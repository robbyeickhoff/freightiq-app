internal import ExpoModulesCore
import class Combine.AnyCancellable
import CoreLocation
import MapboxCommon
@_spi(ExperimentalMapboxAPI) import MapboxDirections
import MapboxMaps
import Turf
import MapboxNavigationCore
import MapboxNavigationUIKit
import UserNotifications

func navigationRoadKey(_ value: String) -> String {
  value.lowercased().replacingOccurrences(of: "¾", with: "3/4")
    .replacingOccurrences(of: "½", with: "1/2").replacingOccurrences(of: "¼", with: "1/4")
    .replacingOccurrences(of: #"\b(road|rd|highway|hwy)\b"#, with: "", options: .regularExpression)
    .filter { $0.isLetter || $0.isNumber }
}

// Road identity outranks a signposted city. Ramp destination refs are a fallback,
// never a reason to substitute the current road or an unrelated later step.
func navigationRoadTitle(names: [String]?, codes: [String]?, destinationCodes: [String]?) -> String? {
  // Local numbered roads should keep their readable name rather than a duplicate shield.
  if let name = names?.first, let code = codes?.first,
     navigationRoadKey(name) == navigationRoadKey(code), !navigationRoadKey(name).isEmpty {
    return name.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  for values in [codes, names, destinationCodes] {
    let text = (values ?? []).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { !$0.isEmpty }.joined(separator: " / ")
    if !text.isEmpty { return text }
  }
  return nil
}

// Distance milestones, with a cooldown, rather than only the SDK's final
// spoken instruction. Skipped milestones never produce a burst of old alerts.
struct NavigationAlertMilestones {
  private var step = ""
  private var lastBucket = -1
  private var lastSent = -Double.infinity
  mutating func shouldSend(step next: String, meters: Double, now: Double) -> Bool {
    guard meters.isFinite, meters >= 0 else { return false }
    if next != step { step = next; lastBucket = -1; lastSent = -Double.infinity }
    let bucket = meters <= 152.4 ? 3 : meters <= 402.336 ? 2 : meters <= 804.672 ? 1 : meters <= 1609.344 ? 0 : -1
    guard bucket > lastBucket, now - lastSent >= 20 else { return false }
    lastBucket = bucket
    lastSent = now
    return true
  }
}

// Use raw GPS so a position snapped to the road cannot qualify on its own.
struct NavigationArrivalProximity {
  private var firstNearbyFix: Date?
  private var lastNearbyFix: Date?

  mutating func qualifies(_ location: CLLocation, destination: CLLocation, now: Date) -> Bool {
    let age = now.timeIntervalSince(location.timestamp)
    guard (0...5).contains(age),
          (0...30).contains(location.horizontalAccuracy),
          (0...2).contains(location.speed),
          location.distance(from: destination) <= 75 else {
      self = .init()
      return false
    }
    if let lastNearbyFix {
      let gap = location.timestamp.timeIntervalSince(lastNearbyFix)
      guard gap > 0 else { return false }
      if gap > 5 { firstNearbyFix = nil }
    }
    if firstNearbyFix == nil { firstNearbyFix = location.timestamp }
    lastNearbyFix = location.timestamp
    return location.timestamp.timeIntervalSince(firstNearbyFix ?? location.timestamp) >= 5
  }
}

struct FreightIQRoadCoordinate: Record {
  @Field var latitude = 0.0
  @Field var longitude = 0.0

  var coordinate: CLLocationCoordinate2D {
    CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
  }
}

private final class StopRestrictionSession: @unchecked Sendable {
  static let shared = StopRestrictionSession()
  private let lock = NSLock()
  private var destination: CLLocationCoordinate2D?
  private var points: [CLLocationCoordinate2D] = []

  func update(destination: CLLocationCoordinate2D?, points: [CLLocationCoordinate2D] = []) {
    lock.lock()
    defer { lock.unlock() }
    self.destination = destination
    self.points = points
  }

  private func pointsForDestination(latitude: Double, longitude: Double) -> [CLLocationCoordinate2D] {
    lock.lock()
    defer { lock.unlock() }
    guard let destination,
          CLLocation(latitude: latitude, longitude: longitude).distance(
            from: CLLocation(latitude: destination.latitude, longitude: destination.longitude)
          ) < 100 else { return [] }
    return points
  }

  func rerouteURL(_ url: String) -> String {
    guard var components = URLComponents(string: url),
          let pathCoordinates = components.path.split(separator: "/").last?.split(separator: ";"),
          pathCoordinates.count == 2, let last = pathCoordinates.last else { return url }
    let coordinate = last.split(separator: ",").compactMap { Double($0) }
    guard coordinate.count == 2 else { return url }
    let exclusionPoints = pointsForDestination(latitude: coordinate[1], longitude: coordinate[0])
    guard !exclusionPoints.isEmpty else { return url }
    var items = components.queryItems ?? []
    let existing = items.first { $0.name == "exclude" }?.value?.split(separator: ",").map(String.init) ?? []
    let points = exclusionPoints.map { "point(\($0.longitude) \($0.latitude))" }
    items.removeAll { $0.name == "exclude" }
    items.append(URLQueryItem(name: "exclude", value: (existing.filter { !$0.hasPrefix("point(") } + points).joined(separator: ",")))
    components.queryItems = items
    return components.string ?? url
  }

  static func warning(for route: Route, road: LineString, exclusionPoints: [CLLocationCoordinate2D], location: CLLocation? = nil) -> String {
    guard let shape = route.shape, shape.coordinates.count >= 2 else {
      return "The route could not be checked against the marked road section."
    }
    if let location, (0...15).contains(location.horizontalAccuracy),
       let closest = road.closestCoordinate(to: location.coordinate),
       closest.index > 0, closest.index < road.coordinates.count - 1,
       CLLocation(latitude: closest.coordinate.latitude, longitude: closest.coordinate.longitude)
        .distance(from: location) <= 15 {
      return "A driver marked this section as inaccessible for tractor-trailers. Proceed with caution."
    }
    let reportedViolation = route.legs.first?.notifications?.contains {
      $0.kind == .violation && $0.subtype == .pointExclusion
    } == true
    // A route can pass the same junction on a different road. The editor
    // confirms these interior points are clear of neighboring roads.
    let crossesMarkedRoad = exclusionPoints.contains { coordinate in
      guard let closest = shape.closestCoordinate(to: coordinate) else { return true }
      return CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude).distance(
        from: CLLocation(latitude: closest.coordinate.latitude, longitude: closest.coordinate.longitude)
      ) <= 8
    }
    if reportedViolation || crossesMarkedRoad {
      return "This route uses a road section marked inaccessible for tractor-trailers."
    }
    return ""
  }
}

struct FreightIQNavigationStop: Record {
  @Field var id = ""
  @Field var name = ""
  @Field var latitude = 0.0
  @Field var longitude = 0.0
}

struct FreightIQNavigationRequest: Record {
  @Field var id = ""
  @Field var stopId = ""
  @Field var name = ""
  @Field var latitude = 0.0
  @Field var longitude = 0.0
  @Field var originLatitude = 0.0
  @Field var originLongitude = 0.0
  @Field var dark = false
  @Field var preview = false
  @Field var stops: [FreightIQNavigationStop] = []
  @Field var restrictedRoad: [FreightIQRoadCoordinate] = []
  @Field var exclusionPoints: [FreightIQRoadCoordinate] = []

  var hasRestriction: Bool {
    !restrictedRoad.isEmpty || !exclusionPoints.isEmpty
  }

  var validRestriction: Bool {
    restrictedRoad.count >= 2 && (1...10000).contains(exclusionPoints.count)
      && (restrictedRoad + exclusionPoints).allSatisfy {
        $0.latitude.isFinite && abs($0.latitude) <= 90 && $0.longitude.isFinite && abs($0.longitude) <= 180
      }
  }
}

class FreightIQNavigation: Module {
  func definition() -> ModuleDefinition {
    Name("FreightIQNavigation")
    OnCreate {
      Task { @MainActor in NavigationLiveActivity.clearDevelopmentActivities() }
    }
    Events("onOfflineDownloadProgress")
    AsyncFunction("offlineRouteCoverage") { (promise: Promise) in
      FreightIQOfflineRoute.shared.coverage(promise)
    }.runOnQueue(.main)
    AsyncFunction("downloadOfflineRoute") { (bounds: [Double], geometryJSON: String, promise: Promise) in
      FreightIQOfflineRoute.shared.download(bounds, geometryJSON: geometryJSON, promise: promise) { [weak self] fraction in
        self?.sendEvent("onOfflineDownloadProgress", ["fraction": fraction])
      }
    }.runOnQueue(.main)
    AsyncFunction("cancelOfflineRouteDownload") {
      FreightIQOfflineRoute.shared.cancel()
    }.runOnQueue(.main)
    AsyncFunction("removeOfflineRoute") { (promise: Promise) in
      FreightIQOfflineRoute.shared.remove(promise)
    }.runOnQueue(.main)
    View(FreightIQNavigationView.self) {
      Events("onState")
      Prop("request") { (view: FreightIQNavigationView, request: FreightIQNavigationRequest) in
        view.configure(request)
      }
      Prop("routeChoice") { (view: FreightIQNavigationView, choice: String) in
        view.selectRoute(choice)
      }
      Prop("feedbackRequest") { (view: FreightIQNavigationView, value: Int) in
        view.reportMapIssue(value)
      }
      Prop("dark") { (view: FreightIQNavigationView, dark: Bool) in
        view.setAppearance(dark)
      }
      Prop("bottomInset") { (view: FreightIQNavigationView, inset: Double) in
        view.setBottomInset(inset)
      }
    }
  }
}

// Keep Mapbox's row selection, sizing and distance behavior; customize only row text.
private final class NavigationStepsDelegate: NSObject, UITableViewDelegate {
  weak var original: UITableViewDelegate?
  var format: ((UITableViewCell, IndexPath) -> Void)?

  override func responds(to selector: Selector!) -> Bool {
    super.responds(to: selector) || original?.responds(to: selector) == true
  }
  override func forwardingTarget(for selector: Selector!) -> Any? {
    original?.responds(to: selector) == true ? original : super.forwardingTarget(for: selector)
  }
  func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
    original?.tableView?(tableView, willDisplay: cell, forRowAt: indexPath)
    format?(cell, indexPath)
  }
}

// The SDK builds list rows from step i's visual instructions, which describe i+1.
// Preserve its arrows/distances and resolve the road from that SAME visual maneuver.
// Current leg rows start at currentStep+1, so their road targets start at currentStep+2.
// Later leg rows start at depart, so their road targets start at index 1.
func navigationListSections<T>(_ legs: [[T]], legIndex: Int, stepIndex: Int) -> [[T]] {
  guard legs.indices.contains(legIndex) else { return [] }
  var sections: [[T]] = []
  let remaining = Array(legs[legIndex].dropFirst(max(0, stepIndex + 2)))
  if !remaining.isEmpty { sections.append(remaining) }
  for leg in legs.dropFirst(legIndex + 1) { sections.append(Array(leg.dropFirst())) }
  return sections
}

// The SDK normally dismisses itself at its final destination. Arrival is only a
// status in FreightIQ; the driver's persisted action owns leaving this delivery.
private final class DeliveryNavigationController: NavigationViewController {
  var bottomOcclusion: CGFloat = 180 {
    didSet { view.setNeedsLayout() }
  }
  private var cameraStateSubscription: AnyCancellable?
  var onReportCondition: (() -> Void)?
  private let conditionButton = UIButton(type: .system)
  private var lastHeadingUpBearing: CLLocationDirection?
  private let orientationButton = UIButton(type: .system)
  private var headingUp = UserDefaults.standard.object(forKey: "navigationHeadingUp") as? Bool ?? true
  private let overviewToggle = UIButton(type: .system)
  private let recenterButton = UIButton(type: .system)
  private var wayNameBottom: NSLayoutConstraint?

  override func viewDidLoad() {
    super.viewDidLoad()
    guard let navigationMapView else { return }
    let camera = navigationMapView.navigationCamera

    // Mapbox uses Resume's hidden state to decide when to show its road label.
    for case let resume as ResumeButton in navigationView.subviews {
      resume.alpha = 0
      resume.isUserInteractionEnabled = false
      resume.accessibilityElementsHidden = true
    }

    for button in [overviewToggle, recenterButton, conditionButton, orientationButton] {
      button.translatesAutoresizingMaskIntoConstraints = false
      button.tintColor = .white
      button.backgroundColor = UIColor(red: 0.14, green: 0.22, blue: 0.31, alpha: 1)
      button.layer.cornerRadius = 25
      let height = button.heightAnchor.constraint(equalToConstant: 50)
      // The stack collapses the recenter button while the camera is following.
      if button === recenterButton { height.priority = .defaultHigh }
      NSLayoutConstraint.activate([
        button.widthAnchor.constraint(equalToConstant: 50),
        height,
      ])
    }
    overviewToggle.addTarget(self, action: #selector(toggleOverview), for: .touchUpInside)
    conditionButton.setImage(UIImage(systemName: "exclamationmark.bubble.fill"), for: .normal)
    conditionButton.accessibilityLabel = "Report a Condition"
    conditionButton.addTarget(self, action: #selector(reportCondition), for: .touchUpInside)
    // The pinned Mapbox SDK orders its default controls as overview, mute, feedback.
    let middleButtons = navigationView.floatingButtons?.dropFirst().dropLast() ?? []
    orientationButton.addTarget(self, action: #selector(toggleOrientation), for: .touchUpInside)
    applyOrientation()
    navigationView.floatingButtons = [orientationButton, overviewToggle] + Array(middleButtons) + [conditionButton, recenterButton]

    recenterButton.setImage(UIImage(systemName: "location.fill"), for: .normal)
    recenterButton.accessibilityLabel = "Recenter on current location"
    recenterButton.addTarget(self, action: #selector(followLocation), for: .touchUpInside)
    updateCameraControls(camera.currentCameraState)
    cameraStateSubscription = camera.cameraStates.sink { [weak self] state in
      self?.updateCameraControls(state)
    }
  }

  @objc private func toggleOrientation() {
    if headingUp, let map = navigationMapView,
       map.navigationCamera.currentCameraState == .following {
      lastHeadingUpBearing = map.mapView.mapboxMap.cameraState.bearing
    }
    headingUp.toggle()
    UserDefaults.standard.set(headingUp, forKey: "navigationHeadingUp")
    applyOrientation()
  }

  private func applyOrientation() {
    orientationButton.setImage(UIImage(systemName: headingUp ? "location.north.line" : "location.north.circle"), for: .normal)
    orientationButton.accessibilityLabel = headingUp ? "Heading up. Switch to north up" : "North up. Switch to heading up"
    guard let map = navigationMapView,
          let source = map.navigationCamera.viewportDataSource as? MobileViewportDataSource else { return }
    source.options.followingCameraOptions.bearingUpdatesAllowed = headingUp
    let bearing = headingUp ? lastHeadingUpBearing : 0
    if let bearing {
      source.currentNavigationCameraOptions.followingCamera.bearing = bearing
      if map.navigationCamera.currentCameraState == .following {
        map.mapView.mapboxMap.setCamera(to: CameraOptions(bearing: bearing))
      }
    }
  }

  private var stepsDelegate: NavigationStepsDelegate?
  var stepsProgress: (() -> RouteProgress?)?

  private func formatDirectionRow(_ cell: UITableViewCell, at index: IndexPath) {
    guard let progress = stepsProgress?() else { return }
    let sections = navigationListSections(progress.navigationRoutes.mainRoute.route.legs.map(\.steps),
      legIndex: progress.legIndex, stepIndex: progress.currentLegProgress.stepIndex)
    guard sections.indices.contains(index.section), sections[index.section].indices.contains(index.row),
          let row = cell.subviews.compactMap({ $0 as? StepInstructionsView }).first else { return }
    let step = sections[index.section][index.row]
    guard step.maneuverType != .arrive,
          let road = navigationRoadTitle(names: step.exitNames ?? step.names, codes: step.codes,
                                         destinationCodes: step.destinationCodes) else { return }
    row.primaryLabel.numberOfLines = 2
    row.primaryLabel.attributedText = NSAttributedString(string: road, attributes: [
      .font: row.primaryLabel.font ?? UIFont.boldSystemFont(ofSize: 26),
      .foregroundColor: row.primaryLabel.textColor ?? UIColor.label
    ])
    var details = (step.destinations ?? []).filter { navigationRoadKey($0) != navigationRoadKey(road) }
    if let exits = step.exitCodes, !exits.isEmpty { details.insert("Exit " + exits.joined(separator: " / "), at: 0) }
    row.secondaryLabel.attributedText = NSAttributedString(string: details.joined(separator: " · "), attributes: [
      .font: UIFont.systemFont(ofSize: 16), .foregroundColor: row.secondaryLabel.textColor ?? UIColor.secondaryLabel
    ])
  }

  private func sizeExpandedDirections(_ banner: UIView) {
    guard let top = children.compactMap({ $0 as? TopBannerViewController }).first,
          top.isDisplayingSteps,
          let steps = top.children.compactMap({ $0 as? StepsViewController }).first,
          let table = steps.view.subviews.compactMap({ $0 as? UITableView }).first,
          table.contentSize.height > 0 else { return }
    if table.delegate !== stepsDelegate {
      let proxy = NavigationStepsDelegate()
      proxy.original = table.delegate
      proxy.format = { [weak self] cell, index in self?.formatDirectionRow(cell, at: index) }
      stepsDelegate = proxy
      table.delegate = proxy
    }
    for cell in table.visibleCells {
      if let index = table.indexPath(for: cell) { formatDirectionRow(cell, at: index) }
    }
    let safeHeight = view.safeAreaLayoutGuide.layoutFrame.height
    let headerHeight = steps.view.convert(CGPoint.zero, to: banner).y
    let footerHeight = max(0, steps.view.bounds.height - table.bounds.height)
    let desiredHeight = min(safeHeight / 2, headerHeight + table.contentSize.height + footerHeight)
    // Mapbox 3.34.1 expands the top banner by tying its bottom to the host's bottom.
    guard let fullHeight = view.constraints.first(where: {
      $0.firstItem as? UIView === top.view && $0.secondItem as? UIView === view &&
        $0.firstAttribute == .bottom && $0.secondAttribute == .bottom
    }) else { return }
    let topY = top.view.convert(CGPoint.zero, to: view).y
    let offset = topY + desiredHeight - view.bounds.height
    if abs(fullHeight.constant - offset) > 1 { fullHeight.constant = offset }
  }

  private func updateCameraControls(_ state: NavigationCameraState) {
    let isOverview = state == .overview
    overviewToggle.setImage(UIImage(systemName: isOverview ? "location.north.fill" : "point.topleft.down.to.point.bottomright.curvepath"), for: .normal)
    overviewToggle.accessibilityLabel = isOverview ? "Return to navigation view" : "Show route overview"
    recenterButton.isHidden = state != .idle
  }

  @objc private func toggleOverview() {
    guard let camera = navigationMapView?.navigationCamera else { return }
    camera.update(cameraState: camera.currentCameraState == .overview ? .following : .overview)
  }

  @objc private func reportCondition() {
    onReportCondition?()
  }

  @objc private func followLocation() {
    navigationMapView?.navigationCamera.update(cameraState: .following)
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    let banner = navigationView.topBannerContainerView
    banner.layer.cornerRadius = 26
    banner.clipsToBounds = true
    sizeExpandedDirections(banner)
    for constraint in navigationView.constraints where constraint.firstItem as? UIView === banner {
      switch constraint.firstAttribute {
      case .leading: constraint.constant = 12
      case .trailing: constraint.constant = -12
      case .top: constraint.constant = 8
      default: break
      }
    }
    let wayName = navigationView.wayNameView
    // Mapbox can rebuild its layout constraints when the size class changes.
    for constraint in navigationView.constraints where constraint.firstItem === wayName
      && constraint.firstAttribute == .bottom
      && constraint.secondItem === navigationView.bottomBannerContainerView {
      constraint.isActive = false
    }
    if wayNameBottom == nil {
      let bottom = wayName.bottomAnchor.constraint(equalTo: navigationView.bottomAnchor)
      bottom.constant = -bottomOcclusion
      bottom.isActive = true
      wayNameBottom = bottom
    }
    wayNameBottom?.constant = -bottomOcclusion
    if var padding = navigationMapView?.viewportPadding {
      // Reserve the road label's height plus clearance below the location arrow.
      padding.bottom = bottomOcclusion + wayName.bounds.height + 20
      navigationMapView?.viewportPadding = padding
    }
    // Keep required map credits above FreightIQ's floating panel.
    navigationMapView?.mapView.ornaments.options.logo.margins.y = bottomOcclusion + 8
    // Group the map credits on the left, clear of the driving controls.
    navigationMapView?.mapView.ornaments.options.attributionButton.position = .bottomLeading
    navigationMapView?.mapView.ornaments.options.attributionButton.margins = CGPoint(x: 96, y: bottomOcclusion + 8)
    navigationMapView?.mapView.ornaments.options.attributionButton.tintColor = .lightGray
  }
  override func dismiss(animated flag: Bool, completion: (() -> Void)? = nil) {
    completion?()
  }
}

// A rolling window preserves FreightIQ order. Native arrival never authorizes the
// next leg; only a successfully persisted FreightIQ Complete/Skip supplies a new window.
final class FreightIQNavigationView: ExpoView, NavigationViewControllerDelegate {
  let onState = EventDispatcher()
  private var request: FreightIQNavigationRequest?
  private var pendingRoutes: NavigationRoutes?
  private var selectedRoutes: NavigationRoutes?
  private var isStartingGuidance = false
  private var pendingSelection: (routes: NavigationRoutes, index: Int)?
  private var task: Task<Void, Never>?
  private var controller: NavigationViewController?
  private var dark = false
  private var guidanceId: String?
  private var arrivalProximity = NavigationArrivalProximity()
  private var reportedArrivalStopId: String?
  private var lastProgressAt = Date.distantPast
  private var bottomInset: CGFloat = 180
  private var alertMilestones = NavigationAlertMilestones()
  private var alertStep = ""
  private var isRerouting = false
  private var rerouteFailed = false
  private var rerouteRecoveryID = UUID()
  private var rerouteRecovery: Task<Void, Never>?
  private var lastRawLocation: CLLocation?
  private let liveActivity = NavigationLiveActivity()
  private let notificationId = "com.freightiq.navigation.maneuver"
  private static var provider: MapboxNavigationProvider { FreightIQOfflineRoute.shared.provider }

  func configure(_ next: FreightIQNavigationRequest) {
    guard next.id != request?.id else { return }
    if next.stopId != request?.stopId { reportedArrivalStopId = nil }
    selectedRoutes = nil
    pendingSelection = nil
    request = next
    if window != nil { calculate(next) }
  }

  func setAppearance(_ value: Bool) {
    dark = value
    controller?.overrideUserInterfaceStyle = value ? .dark : .light
    controller?.styleManager?.applyStyle(type: value ? .night : .day)
  }

  func setBottomInset(_ value: Double) {
    bottomInset = CGFloat(max(0, value))
    (controller as? DeliveryNavigationController)?.bottomOcclusion = bottomInset
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    // Loading Mapbox's controller can synchronously trigger another window callback.
    // Reconcile the final window state when that single startup has finished.
    guard !isStartingGuidance else { return }
    if window == nil {
      stop()
    } else if controller == nil, let request {
      if !request.preview, let selectedRoutes {
        startGuidance(selectedRoutes, request)
      } else if !request.preview, pendingSelection != nil {
        resumeSelection(request)
      } else {
        calculate(request)
      }
    }
  }

  private func emit(_ state: String, _ request: FreightIQNavigationRequest, message: String = "", legs: [[String: Any]] = []) {
    onState(["state": state, "requestId": request.id, "stopId": request.stopId, "message": message, "legs": legs])
  }

  private func legEstimates(_ route: Route, _ request: FreightIQNavigationRequest, progress: RouteProgress? = nil) -> [[String: Any]] {
    let expectedLegs = request.hasRestriction ? 1 : request.stops.count
    guard route.legs.count == expectedLegs else { return [] }
    return route.legs.enumerated().map { index, leg in
      ["stopId": request.stops[index].id,
       "seconds": index == 0 ? (progress?.currentLegProgress.durationRemaining ?? leg.expectedTravelTime) : leg.expectedTravelTime,
       "meters": index == 0 ? (progress?.currentLegProgress.distanceRemaining ?? leg.distance) : leg.distance]
    }
  }

  private func reportRestriction(_ progress: RouteProgress, _ request: FreightIQNavigationRequest, location: CLLocation) {
    guard request.validRestriction else { return }
    let leg = progress.currentLegProgress
    let upcoming = leg.currentStepProgress.distanceRemaining <= 500 ? leg.upcomingStep?.shape : nil
    let turnsOntoSection = request.exclusionPoints.contains { point in
      guard let closest = upcoming?.closestCoordinate(to: point.coordinate) else { return false }
      return CLLocation(latitude: point.latitude, longitude: point.longitude).distance(
        from: CLLocation(latitude: closest.coordinate.latitude, longitude: closest.coordinate.longitude)
      ) <= 8
    }
    let nearSection = (0...30).contains(location.horizontalAccuracy) && request.restrictedRoad.contains { point in
      CLLocation(latitude: point.latitude, longitude: point.longitude).distance(from: location) <= 75
    }
    emit("restriction", request, message: turnsOntoSection ? "Upcoming road was flagged restricted" : nearSection ? "Flagged road section nearby" : "")
  }

  private func calculate(_ next: FreightIQNavigationRequest) {
    task?.cancel()
    rerouteRecoveryID = UUID()
    rerouteRecovery?.cancel()
    rerouteRecovery = nil
    pendingRoutes = nil
    liveActivity.end()
    isRerouting = false
    rerouteFailed = false
    clearTurnNotification()
    arrivalProximity = NavigationArrivalProximity()
    lastProgressAt = .distantPast
    alertMilestones = NavigationAlertMilestones()
    alertStep = ""
    guidanceId = nil
    if controller != nil { Self.provider.tripSession().setToIdle() }
    emit("loading", next)
    task = Task { @MainActor [weak self] in
      do {
        guard !next.stops.isEmpty, next.stops.count <= 24, next.stops.first?.id == next.stopId else {
          self?.emit("error", next, message: "Your route could not be opened. Return to your route and try again.")
          return
        }
        let restricted = next.validRestriction
        let destinations = restricted ? Array(next.stops.prefix(1)) : next.stops
        let coordinates = [CLLocationCoordinate2D(latitude: next.originLatitude, longitude: next.originLongitude)]
          + destinations.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
        let options = NavigationRouteOptions(coordinates: coordinates, profileIdentifier: .automobileAvoidingTraffic)
        options.includesAlternativeRoutes = next.preview
        if restricted { options.excludedLocations = next.exclusionPoints.prefix(50).map(\.coordinate) }
        StopRestrictionSession.shared.update(destination: restricted ? coordinates.last : nil,
                                             points: options.excludedLocations)
        let provider = Self.provider
        let routes: NavigationRoutes
        do {
          routes = try await provider.routingProvider().calculateRoutes(options: options).value
        } catch {
          guard restricted, !Task.isCancelled else { throw error }
          // Restrictions advise the driver; a failed avoidance request must not prevent guidance.
          options.excludedLocations = []
          routes = try await provider.routingProvider().calculateRoutes(options: options).value
        }
        guard !Task.isCancelled, let self, self.window != nil, self.request?.id == next.id else { return }
        if next.preview {
          let candidates = [routes.mainRoute.route] + routes.alternativeRoutes.map(\.route)
          let ordered = candidates.enumerated().sorted { left, right in
            guard restricted else { return left.offset < right.offset }
            let road = LineString(next.restrictedRoad.map(\.coordinate))
            let a = StopRestrictionSession.warning(for: left.element, road: road, exclusionPoints: next.exclusionPoints.map(\.coordinate)).isEmpty
            let b = StopRestrictionSession.warning(for: right.element, road: road, exclusionPoints: next.exclusionPoints.map(\.coordinate)).isEmpty
            return a == b ? left.offset < right.offset : a
          }
          let choices: [[String: Any]] = ordered.compactMap { index, route in
            guard let coordinates = route.shape?.coordinates, coordinates.count > 1 else { return nil }
            return ["index": index, "seconds": route.expectedTravelTime, "meters": route.distance,
                    "coordinates": coordinates.map { ["latitude": $0.latitude, "longitude": $0.longitude] },
                    "steps": route.legs.enumerated().flatMap { legIndex, leg in
                      leg.steps.map { step -> [String: Any] in
                        ["instruction": step.instructions, "meters": step.distance, "legIndex": legIndex]
                      }
                    }]
          }
          guard !choices.isEmpty else {
            self.emit("error", next, message: "No directions were found. Check your connection and try again.")
            return
          }
          self.pendingRoutes = routes
          self.onState(["state": "preview", "requestId": next.id, "stopId": next.stopId, "choices": choices])
        } else {
          self.startGuidance(routes, next)
        }
      } catch {
        guard !Task.isCancelled, let self, self.request?.id == next.id else { return }
        self.emit("error", next, message: "Could not calculate directions. Your route is still saved. Check your connection and try again.")
      }
    }
  }

  func selectRoute(_ choice: String) {
    guard let next = request, let routes = pendingRoutes,
          choice.hasPrefix(next.id + "|"),
          let index = Int(choice.dropFirst(next.id.count + 1)), index >= 0 else { return }
    // The selection survives temporary removal of this view from its window.
    request?.preview = false
    pendingSelection = (routes, index)
    pendingRoutes = nil
    resumeSelection(next)
  }

  private func resumeSelection(_ next: FreightIQNavigationRequest) {
    guard let selection = pendingSelection else { return }
    task?.cancel()
    task = Task { @MainActor [weak self] in
      let selected = selection.index == 0 ? selection.routes : await selection.routes.selectingAlternativeRoute(at: selection.index - 1)
      guard !Task.isCancelled, let self, self.window != nil, self.request?.id == next.id else { return }
      guard let selected else {
        self.emit("error", next, message: "Could not open the selected route. Try again.")
        return
      }
      self.startGuidance(selected, next)
    }
  }

  private func startGuidance(_ routes: NavigationRoutes, _ next: FreightIQNavigationRequest) {
    guard !isStartingGuidance else { return }
    isStartingGuidance = true
    defer {
      isStartingGuidance = false
      if window == nil { stop() }
    }
    if request?.id == next.id { request?.preview = false }
    selectedRoutes = routes
    pendingSelection = nil
    isRerouting = false
    rerouteFailed = false
    let provider = Self.provider
    if self.controller != nil {
      provider.tripSession().startActiveGuidance(with: routes, startLegIndex: 0)
      self.guidanceId = next.id
      self.liveActivity.start()
      self.emit("started", next, legs: self.legEstimates(routes.mainRoute.route, next))
      return
    }
    let navigation = DeliveryNavigationController(navigationRoutes: routes, navigationOptions: NavigationOptions(
      mapboxNavigation: provider.mapboxNavigation,
      voiceController: provider.routeVoiceController,
      eventsManager: provider.eventsManager(),
      styles: [DayStyle(), NightStyle()],
      predictiveCacheManager: provider.predictiveCacheManager
    ))
    navigation.delegate = self
    navigation.sendsNotifications = false
    navigation.bottomOcclusion = self.bottomInset
    navigation.onReportCondition = { [weak self] in
      guard let self, let request = self.request, request.id == self.guidanceId else { return }
      self.emit("reportCondition", request)
    }
    navigation.stepsProgress = { [weak self] in
      guard self?.guidanceId != nil else { return nil }
      return Self.provider.mapboxNavigation.navigation().currentRouteProgress?.routeProgress
    }
    navigation.showsReportFeedback = false
    navigation.navigationView.bottomBannerContainerView.isHidden = true
    navigation.automaticallyAdjustsStyleForTimeOfDay = false
    navigation.overrideUserInterfaceStyle = self.dark ? .dark : .light
    navigation.styleManager?.applyStyle(type: self.dark ? .night : .day)
    guard let parent = self.reactViewController() else {
      self.emit("error", next, message: "Navigation could not open. Return to your route and try again.")
      return
    }
    parent.addChild(navigation)
    self.addSubview(navigation.view)
    navigation.view.frame = self.bounds
    navigation.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    // Center on the route origin while the navigation camera waits for its first location update.
    navigation.navigationMapView?.mapView.mapboxMap.setCamera(to: CameraOptions(center: CLLocationCoordinate2D(latitude: next.originLatitude, longitude: next.originLongitude), zoom: 15))
    navigation.didMove(toParent: parent)
    self.controller = navigation
    self.guidanceId = next.id
    self.liveActivity.start()
    self.emit("started", next, legs: self.legEstimates(routes.mainRoute.route, next))
  }

  private func stop() {
    rerouteRecoveryID = UUID()
    rerouteRecovery?.cancel()
    rerouteRecovery = nil
    isRerouting = false
    pendingRoutes = nil
    liveActivity.end()
    if request?.hasRestriction == true { StopRestrictionSession.shared.update(destination: nil) }
    clearTurnNotification()
    task?.cancel()
    task = nil
    guidanceId = nil
    if let controller {
      controller.delegate = nil
      controller.willMove(toParent: nil)
      controller.view.removeFromSuperview()
      controller.removeFromParent()
      self.controller = nil
      Self.provider.tripSession().setToIdle()
    }
  }

  func navigationViewController(
    _ navigationViewController: NavigationViewController,
    waypointCircleLayerWithIdentifier identifier: String,
    sourceIdentifier: String
  ) -> CircleLayer? {
    var layer = CircleLayer(id: identifier, source: sourceIdentifier)
    let opacity = Exp(.switchCase) {
      Exp(.any) { Exp(.get) { "waypointCompleted" } }
      0
      1
    }
    layer.circleColor = .constant(StyleColor(UIColor(red: 0.24, green: 0.72, blue: 0.25, alpha: 1)))
    layer.circleRadius = .constant(7)
    layer.circleStrokeColor = .constant(StyleColor(.white))
    layer.circleStrokeWidth = .constant(2)
    layer.circleOpacity = .expression(opacity)
    layer.circleStrokeOpacity = .expression(opacity)
    layer.circleEmissiveStrength = .constant(1)
    return layer
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didArriveAt waypoint: Waypoint) {
    guard let request, request.id == guidanceId else { return }
    reportArrival("arrived", request)
  }

  private func reportArrival(_ state: String, _ request: FreightIQNavigationRequest) {
    guard reportedArrivalStopId != request.stopId else { return }
    reportedArrivalStopId = request.stopId
    liveActivity.end()
    emit(state, request)
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didUpdate progress: RouteProgress, with location: CLLocation, rawLocation: CLLocation) {
    guard let request, request.id == guidanceId else { return }
    selectedRoutes = progress.navigationRoutes
    lastRawLocation = rawLocation
    if rawLocation.horizontalAccuracy >= 0, rawLocation.horizontalAccuracy <= 100,
       (0...15).contains(-rawLocation.timestamp.timeIntervalSinceNow) {
      self.request?.originLatitude = rawLocation.coordinate.latitude
      self.request?.originLongitude = rawLocation.coordinate.longitude
    }
    let now = Date()
    if reportedArrivalStopId != request.stopId {
      let destination = CLLocation(latitude: request.latitude, longitude: request.longitude)
      if arrivalProximity.qualifies(rawLocation, destination: destination, now: now) {
        reportArrival("arrivedNearby", request)
      }
    }
    guard now.timeIntervalSince(lastProgressAt) >= 5 else { return }
    lastProgressAt = now
    reportRestriction(progress, request, location: rawLocation)
    if !isRerouting, !rerouteFailed, reportedArrivalStopId != request.stopId { updateLiveActivity(progress) }
    updateTurnNotification(progress)
    emit("progress", request, legs: legEstimates(progress.route, request, progress: progress))
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, willRerouteFrom location: CLLocation?) {
    guard navigationViewController === controller, let request, request.id == guidanceId,
          reportedArrivalStopId != request.stopId else { return }
    isRerouting = true
    clearTurnNotification()
    liveActivity.update(.init(instruction: "Rerouting…", arrow: "location.fill", distance: "", eta: nil))
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didRerouteAlong route: Route) {
    guard navigationViewController === controller else { return }
    isRerouting = false
    rerouteFailed = false
    rerouteRecoveryID = UUID()
    rerouteRecovery?.cancel()
    rerouteRecovery = nil
    lastProgressAt = .distantPast
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didFailToRerouteWith error: Error) {
    guard navigationViewController === controller, let request, request.id == guidanceId else { return }
    // A failed attempt is terminal, even if no restricted road is involved.
    isRerouting = false
    rerouteFailed = true
    lastProgressAt = .distantPast
    clearTurnNotification()
    liveActivity.update(.init(instruction: "Unable to update route", arrow: "location.fill", distance: "", eta: nil))
    guard rerouteRecovery == nil, let location = lastRawLocation,
          (0...15).contains(-location.timestamp.timeIntervalSinceNow),
          location.horizontalAccuracy >= 0, location.horizontalAccuracy <= 100 else { return }
    // Native legs advance only after FreightIQ Complete/Skip supplies a new request.
    // Preserve every remaining stop on ordinary routes; restricted requests cover one leg.
    let stops = request.validRestriction ? Array(request.stops.prefix(1)) : request.stops
    guard !stops.isEmpty else { return }
    liveActivity.update(.init(instruction: "Recalculating route…", arrow: "location.fill", distance: "", eta: nil))
    let recoveryID = UUID()
    rerouteRecoveryID = recoveryID
    rerouteRecovery = Task { @MainActor [weak self] in
      defer { if self?.rerouteRecoveryID == recoveryID { self?.rerouteRecovery = nil } }
      let coordinates = [location.coordinate] + stops.map {
        CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude)
      }
      let options = NavigationRouteOptions(coordinates: coordinates, profileIdentifier: .automobileAvoidingTraffic)
      options.includesAlternativeRoutes = false
      do {
        let routes = try await Self.provider.routingProvider().calculateRoutes(options: options).value
        guard !Task.isCancelled, let self, self.window != nil,
              self.request?.id == request.id, self.guidanceId == request.id,
              self.rerouteRecoveryID == recoveryID else { return }
        self.startGuidance(routes, request)
      } catch {
        guard !Task.isCancelled, let self, self.request?.id == request.id else { return }
        self.liveActivity.update(.init(instruction: "Unable to update route", arrow: "location.slash", distance: "", eta: nil))
        // Leave Mapbox's normal off-route recovery active for subsequent location updates.
      }
    }
  }

  private var lastFeedbackRequest = 0
  private var feedbackOpen = false

  func reportMapIssue(_ value: Int) {
    guard value > lastFeedbackRequest else { return }
    lastFeedbackRequest = value
    guard !feedbackOpen, guidanceId != nil,
          let map = controller?.navigationMapView?.mapView,
          let presenter = reactViewController(), presenter.presentedViewController == nil else { return }
    feedbackOpen = true
    let capturedRequest = guidanceId
    // Render only Mapbox content, excluding the React route/Intel cards above it.
    guard let image = try? map.snapshot() else {
      feedbackOpen = false
      let notice = UIAlertController(title: "Feedback unavailable", message: "Unable to capture the navigation map. Please try again.", preferredStyle: .alert)
      notice.addAction(UIAlertAction(title: "OK", style: .default))
      presenter.present(notice, animated: true)
      return
    }
    Task { @MainActor [weak self, weak presenter] in
      guard let self else { return }
      let manager = Self.provider.eventsManager()
      guard let feedback = await manager.createFeedback(screenshotOption: .custom(image)),
            let presenter, self.window != nil, self.guidanceId == capturedRequest else {
        self.feedbackOpen = false
        if let presenter, self.window != nil, self.guidanceId == capturedRequest {
          let notice = UIAlertController(title: "Feedback unavailable", message: "Mapbox could not prepare the report. Please try again with an active navigation session.", preferredStyle: .alert)
          notice.addAction(UIAlertAction(title: "OK", style: .default))
          presenter.present(notice, animated: true)
        }
        return
      }
      let categories: [(String, ActiveNavigationFeedbackType)] = [
        ("Missing Speed Limit", .missingSpeedLimit), ("Wrong Speed Limit", .wrongSpeedLimit),
        ("Other Map / Navigation Issue", .other)
      ]
      let menu = UIAlertController(title: "Report a Map Issue", message: "Send map feedback to Mapbox, separate from FreightIQ reports.", preferredStyle: .alert)
      for (title, type) in categories {
        menu.addAction(UIAlertAction(title: title, style: .default) { [weak self, weak presenter] _ in
          guard let self, let presenter else { return }
          let form = UIAlertController(title: title,
            message: "Shares the captured navigation map, location and navigation context with Mapbox. Notes are optional. Map corrections are reviewed by Mapbox.", preferredStyle: .alert)
          form.addTextField { $0.placeholder = "Optional details / posted speed limit" }
          form.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in self.feedbackOpen = false })
          form.addAction(UIAlertAction(title: "Send to Mapbox", style: .default) { [weak self, weak form, weak presenter] _ in
            let notes = form?.textFields?.first?.text.map { String($0.prefix(2000)) }
            Task { @MainActor in
              let result = await manager.sendActiveNavigationFeedback(feedback, type: type, description: notes, source: .user)
              self?.feedbackOpen = false
              guard let presenter, presenter.view.window != nil else { return }
              let notice = UIAlertController(title: result == nil ? "Feedback unavailable" : "Feedback submitted",
                message: result == nil ? "Mapbox could not accept this report. Please try again when connected." : "Handed to Mapbox for processing. A map correction is not immediate or guaranteed.", preferredStyle: .alert)
              notice.addAction(UIAlertAction(title: "OK", style: .default))
              presenter.present(notice, animated: true)
            }
          })
          presenter.present(form, animated: true)
        })
      }
      menu.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in self.feedbackOpen = false })
      presenter.present(menu, animated: true)
    }
  }

  func label(_ label: InstructionLabel, willPresent instruction: VisualInstruction,
             as presented: NSAttributedString) -> NSAttributedString? {
    // Only customize the live primary banner, not lane guidance or the steps list.
    guard let banner = label.superview as? InstructionsBannerView,
          label === banner.primaryLabel,
          let progress = Self.provider.mapboxNavigation.navigation().currentRouteProgress?.routeProgress,
          let step = progress.currentLegProgress.upcomingStep,
          step.maneuverType != .arrive,
          let road = navigationRoadTitle(names: step.exitNames ?? step.names, codes: step.codes,
                                         destinationCodes: step.destinationCodes) else { return nil }
    // Do not repeat the SDK primary text: it can contain both a road name and its shield.
    var details = (step.destinations ?? []).filter {
      !navigationRoadKey($0).isEmpty && navigationRoadKey($0) != navigationRoadKey(road)
    }
    if let exits = step.exitCodes, !exits.isEmpty { details.insert("Exit " + exits.joined(separator: " / "), at: 0) }
    let detail = details.joined(separator: " · ")
    let showDetail = !detail.isEmpty
    label.numberOfLines = 2
    var attributes = presented.length > 0 ? presented.attributes(at: 0, effectiveRange: nil) : [:]
    attributes[.font] = label.font ?? UIFont.boldSystemFont(ofSize: 30)
    let result = NSMutableAttributedString(string: road, attributes: attributes)
    if showDetail {
      attributes[.font] = UIFont.systemFont(ofSize: 17)
      result.append(NSAttributedString(string: "\n" + detail, attributes: attributes))
    }
    return result
  }

  private func updateLiveActivity(_ progress: RouteProgress) {
    let leg = progress.currentLegProgress
    guard let instruction = leg.currentStep.instructionsDisplayedAlongStep?.last else { return }
    let primary = instruction.primaryInstruction
    let arrow: String
    switch primary.maneuverDirection?.rawValue {
    case "left", "sharp left": arrow = "arrow.turn.up.left"
    case "right", "sharp right": arrow = "arrow.turn.up.right"
    case "slight left": arrow = "arrow.up.left"
    case "slight right": arrow = "arrow.up.right"
    case "uturn": arrow = "arrow.uturn.left"
    default: arrow = "arrow.up"
    }
    let meters = leg.currentStepProgress.distanceRemaining
    guard meters.isFinite, meters >= 0 else { return }
    let distance = meters < 160.934
      ? "\(Int((meters * 3.28084 / 10).rounded()) * 10) ft"
      : String(format: "%.1f mi", meters / 1609.344)
    let seconds = leg.durationRemaining
    let eta = seconds.isFinite && seconds >= 0 ? Date().addingTimeInterval(seconds) : nil
    liveActivity.update(.init(
      instruction: primary.text ?? "Continue",
      arrow: arrow, distance: distance, eta: eta
    ))
  }

  private func clearTurnNotification() {
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [notificationId])
    center.removeDeliveredNotifications(withIdentifiers: [notificationId])
  }

  private func updateTurnNotification(_ progress: RouteProgress) {
    guard !isRerouting, !rerouteFailed else { clearTurnNotification(); return }
    guard UIApplication.shared.applicationState == .background else {
      clearTurnNotification()
      return
    }
    let leg = progress.currentLegProgress
    guard !leg.userHasArrivedAtWaypoint,
      let instruction = leg.currentStep.instructionsDisplayedAlongStep?.last else {
      clearTurnNotification()
      return
    }
    let meters = leg.currentStepProgress.distanceRemaining
    let key = "\(progress.legIndex):\(leg.stepIndex):\(leg.upcomingStep?.maneuverLocation.latitude ?? 0):\(leg.upcomingStep?.maneuverLocation.longitude ?? 0)"
    if key != alertStep {
      clearTurnNotification()
      alertStep = key
    }
    guard alertMilestones.shouldSend(step: key, meters: meters, now: Date().timeIntervalSince1970) else { return }
    let primary = instruction.primaryInstruction
    let direction = primary.maneuverDirection?.rawValue ?? "straight"
    var words: String
    switch direction {
    case "right": words = "Turn right"
    case "left": words = "Turn left"
    case "slight right": words = "Keep right"
    case "slight left": words = "Keep left"
    case "sharp right": words = "Sharp right"
    case "sharp left": words = "Sharp left"
    case "uturn": words = "U-turn"
    default: words = "Continue"
    }
    switch primary.maneuverType {
    case .arrive: words = "Arrive"
    case .takeOffRamp: words = direction.contains("left") ? "Exit left" : "Exit right"
    case .merge: words = "Merge"
    case .takeRoundabout, .turnAtRoundabout, .takeRotary: words = "At the roundabout"
    case .exitRotary, .exitRoundabout: words = "Exit the roundabout"
    default: break
    }
    let distance = meters >= 160.9344
      ? String(format: "%.1f mi", meters / 1609.344)
      : "\(max(0, Int((meters / 0.3048 / 50).rounded()) * 50)) ft"
    let content = UNMutableNotificationContent()
    content.title = "\(words) · \(distance)"
    content.body = primary.text ?? leg.upcomingStep?.instructions ?? "Upcoming maneuver"
    let arrow = ManeuverView()
    arrow.frame = CGRect(x: 10, y: 10, width: 52, height: 52)
    arrow.visualInstruction = primary
    arrow.drivingSide = instruction.drivingSide
    arrow.primaryColor = .white
    arrow.secondaryColor = .lightGray
    arrow.layer.displayIfNeeded()
    let png = UIGraphicsImageRenderer(size: CGSize(width: 72, height: 72)).pngData { context in
      UIColor.black.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 72, height: 72))
      context.cgContext.translateBy(x: 10, y: 10)
      arrow.layer.render(in: context.cgContext)
    }
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("freightiq-turn.png")
    if (try? png.write(to: url)) != nil,
      let attachment = try? UNNotificationAttachment(identifier: "turn", url: url) {
      content.attachments = [attachment]
    }
    clearTurnNotification()
    UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: notificationId, content: content, trigger: nil))
  }

  func navigationViewControllerDidDismiss(_ navigationViewController: NavigationViewController, byCanceling canceled: Bool) {
    guard canceled else { return }
    if let request { emit("closed", request) }
    stop()
  }
}

// All state changes run on the main queue. The same tile store serves downloads,
// the on-device router and the navigation map.
private final class OfflineRouteException: GenericException<String>, @unchecked Sendable {
  override var reason: String { param }
}

private final class FreightIQOfflineRoute {
  static let shared = FreightIQOfflineRoute()
  let provider: MapboxNavigationProvider
  private let store: TileStore
  private let manager = OfflineManager()
  private let styles: [StyleURI] = [.light, .dark]
  private let defaults = UserDefaults.standard
  private let readyKey = "FreightIQOfflineRoute.ready.v1"
  private let pendingKey = "FreightIQOfflineRoute.pending.v1"
  private var cancelDownload: (() -> Void)?
  private var cancelled = false
  private var removing = false

  private init() {
    let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let directory = support.appendingPathComponent("FreightIQNavigationTiles", isDirectory: true)
    let configuration: TileStoreConfiguration
    do {
      try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      configuration = .custom(directory)
    } catch {
      configuration = .default
    }
    store = configuration.navigatorLocation.tileStore
    MapboxMapsOptions.tileStore = store
    var routingConfig = RoutingConfig(datasetProfileIdentifier: .automobileAvoidingTraffic)
    routingConfig.rerouteConfig.urlOptionsCustomization = .init(StopRestrictionSession.shared.rerouteURL)
    routingConfig.fasterRouteDetectionConfig = nil
    routingConfig.alternativeRoutesDetectionConfig = nil
    provider = MapboxNavigationProvider(coreConfig: CoreConfig(
      routingConfig: routingConfig,
      multilegAdvancing: .manually { _ in false },
      tilestoreConfig: configuration
    ))
    if let pending = defaults.string(forKey: pendingKey) {
      if pending != saved?.id { store.removeTileRegion(forId: pending) }
      defaults.removeObject(forKey: pendingKey)
    }
  }

  private var saved: (id: String, bounds: [Double])? {
    guard let record = defaults.dictionary(forKey: readyKey),
          let id = record["id"] as? String, let bounds = record["bounds"] as? [Double]
    else { return nil }
    return (id, bounds)
  }

  func coverage(_ promise: Promise) {
    guard let saved else { promise.resolve(nil); return }
    store.tileRegion(forId: saved.id) { result in
      guard let region = try? result.get(), region.requiredResourceCount > 0,
            region.completedResourceCount == region.requiredResourceCount
      else { promise.resolve(nil); return }
      self.checkStyles { complete in
        let record = self.defaults.dictionary(forKey: self.readyKey)
        let coverage: Any
        if let geometryJSON = record?["geometryJSON"] as? String {
          coverage = ["bounds": saved.bounds, "geometryJSON": geometryJSON]
        } else { coverage = saved.bounds }
        promise.resolve(complete && self.saved?.id == saved.id ? coverage : nil)
      }
    }
  }

  private func checkStyles(_ completion: @escaping (Bool) -> Void) {
    manager.allStylePacks { result in
      let packs = (try? result.get()) ?? []
      let completeStyles = Set(packs.filter {
        $0.requiredResourceCount > 0 && $0.completedResourceCount == $0.requiredResourceCount
      }.map(\.styleURI))
      DispatchQueue.main.async {
        completion(self.styles.allSatisfy { completeStyles.contains($0.rawValue) })
      }
    }
  }

  func download(_ bounds: [Double], geometryJSON: String? = nil, promise: Promise, progress: @escaping (Double) -> Void) {
    guard cancelDownload == nil, !removing else { promise.reject(OfflineRouteException("Wait for the current offline action to finish.")); return }
    guard bounds.count == 4, bounds.allSatisfy(\.isFinite),
          (-180...180).contains(bounds[0]), (-180...180).contains(bounds[2]),
          (-85...85).contains(bounds[1]), (-85...85).contains(bounds[3]),
          bounds[0] < bounds[2], bounds[1] < bounds[3]
    else { promise.reject(OfflineRouteException("Could not prepare offline coverage for this route.")); return }
    let (west, south, east, north) = (bounds[0], bounds[1], bounds[2], bounds[3])
    let ring = [(west, south), (east, south), (east, north), (west, north), (west, south)]
      .map { CLLocationCoordinate2D(latitude: $0.1, longitude: $0.0) }
    let geometry: Turf.Geometry
    if let geometryJSON {
      guard let data = geometryJSON.data(using: .utf8), let decoded = try? JSONDecoder().decode(Turf.Geometry.self, from: data) else {
        promise.reject(OfflineRouteException("Could not prepare offline road coverage.")); return
      }
      switch decoded {
      case .polygon, .multiPolygon: geometry = decoded
      default: promise.reject(OfflineRouteException("Could not prepare offline road coverage.")); return
      }
    } else { geometry = Polygon([ring]).geometry }
    let mapDescriptors = styles.map { style in
      manager.createTilesetDescriptor(for: TilesetDescriptorOptions(
        styleURI: style, zoomRange: 6...14, tilesets: nil,
        stylePackOptions: nil
      ))
    }
    guard let options = TileRegionLoadOptions(
      geometry: geometry,
      descriptors: [provider.getLatestNavigationTilesetDescriptor()] + mapDescriptors,
      metadata: nil, acceptExpired: false, networkRestriction: .none
    ) else { promise.reject(OfflineRouteException("Could not prepare offline coverage for this route.")); return }

    guard let styleOptions = StylePackLoadOptions(glyphsRasterizationMode: .ideographsRasterizedLocally) else {
      promise.reject(OfflineRouteException("Could not prepare offline map resources.")); return
    }
    let id = "freightiq-route-" + UUID().uuidString
    cancelled = false
    defaults.set(id, forKey: pendingKey)
    // Finish both styles explicitly before declaring the map and road data ready.
    // Descriptor resolution alone must not be the readiness signal.
    var downloads: [Cancelable] = []
    cancelDownload = { downloads.forEach { $0.cancel() } }
    let group = DispatchGroup()
    var styleFailed = false
    for style in styles {
      group.enter()
      let download = manager.loadStylePack(for: style,
        loadOptions: styleOptions,
        progress: { _ in }, completion: { result in
          DispatchQueue.main.async {
            if case .failure = result { styleFailed = true }
            group.leave()
          }
        })
      downloads.append(download)
    }
    group.notify(queue: .main) {
      guard !self.cancelled, !styleFailed else {
        self.defaults.set("map-resources", forKey: "FreightIQOfflineRoute.lastFailure")
        self.finishDownload(id, bounds: bounds, geometryJSON: geometryJSON, ready: false, promise: promise,
          message: self.cancelled ? "Offline download cancelled." : "Offline map resources could not be downloaded. Check your connection and try again.")
        return
      }
      progress(0.1)
      let operation = self.store.loadTileRegion(forId: id, loadOptions: options, progress: { state in
        guard state.requiredResourceCount > 0 else { return }
        let fraction = Double(state.completedResourceCount) / Double(state.requiredResourceCount)
        DispatchQueue.main.async {
          if self.defaults.string(forKey: self.pendingKey) == id { progress(0.1 + 0.9 * fraction) }
        }
      }, completion: { result in
        DispatchQueue.main.async {
          switch result {
          case .failure(let error):
            let message: String
            switch error as? MapboxMaps.TileRegionError {
            case .diskFull?: message = "Not enough storage for this offline route. Free up space and try again."
            case .tileCountExceeded?: message = "This offline area exceeds the map provider’s download limit. Try a smaller route."
            case .canceled?: message = "Offline download cancelled."
            default: message = "Offline road data could not be downloaded. Check your connection and try again."
            }
            self.defaults.set(message, forKey: "FreightIQOfflineRoute.lastFailure")
            self.finishDownload(id, bounds: bounds, geometryJSON: geometryJSON, ready: false, promise: promise, message: message)
          case .success(let region):
            guard region.requiredResourceCount > 0,
                  region.completedResourceCount == region.requiredResourceCount else {
              self.finishDownload(id, bounds: bounds, geometryJSON: geometryJSON, ready: false, promise: promise,
                message: "Offline road data is incomplete. Please try the download again.")
              return
            }
            self.checkStyles { ready in
              self.finishDownload(id, bounds: bounds, geometryJSON: geometryJSON, ready: ready, promise: promise,
                message: "Offline map resources could not be verified. Please try again.")
            }
          }
        }
      })
      downloads.append(operation)
    }
  }

  private func finishDownload(_ id: String, bounds: [Double], geometryJSON: String? = nil, ready: Bool, promise: Promise,
                              message: String = "Offline download did not finish. Please try again.") {
    guard defaults.string(forKey: pendingKey) == id else { return }
    defer { cancelDownload = nil; defaults.removeObject(forKey: pendingKey) }
    guard ready, !cancelled, defaults.string(forKey: pendingKey) == id else {
      store.removeTileRegion(forId: id)
      promise.reject(OfflineRouteException(cancelled ? "Offline download cancelled." : message))
      return
    }
    defaults.removeObject(forKey: "FreightIQOfflineRoute.lastFailure")
    let previous = saved?.id
    var record: [String: Any] = ["id": id, "bounds": bounds]
    if let geometryJSON { record["geometryJSON"] = geometryJSON }
    defaults.set(record, forKey: readyKey)
    if let previous { store.removeTileRegion(forId: previous) }
    promise.resolve(nil)
  }

  func cancel() {
    guard let cancelDownload else { return }
    cancelled = true
    cancelDownload()
  }

  func remove(_ promise: Promise) {
    guard cancelDownload == nil, !removing else { promise.reject(OfflineRouteException("Wait for the current offline action to finish.")); return }
    guard let saved else { promise.resolve(nil); return }
    removing = true
    store.removeRegion(forId: saved.id) { result in
      DispatchQueue.main.async {
        self.removing = false
        switch result {
        case .success:
          self.defaults.removeObject(forKey: self.readyKey)
          promise.resolve(nil)
        case .failure:
          promise.reject(OfflineRouteException("Could not remove the offline download."))
        }
      }
    }
  }
}
