internal import ExpoModulesCore
import CoreLocation
import MapboxCommon
import MapboxDirections
import MapboxMaps
import Turf
import MapboxNavigationCore
import MapboxNavigationUIKit
import UserNotifications

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
  @Field var stops: [FreightIQNavigationStop] = []
}

class FreightIQNavigation: Module {
  func definition() -> ModuleDefinition {
    Name("FreightIQNavigation")
    Events("onOfflineDownloadProgress")
    AsyncFunction("offlineRouteCoverage") { (promise: Promise) in
      FreightIQOfflineRoute.shared.coverage(promise)
    }.runOnQueue(.main)
    AsyncFunction("downloadOfflineRoute") { (bounds: [Double], promise: Promise) in
      FreightIQOfflineRoute.shared.download(bounds, promise: promise) { [weak self] fraction in
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
      Prop("dark") { (view: FreightIQNavigationView, dark: Bool) in
        view.setAppearance(dark)
      }
      Prop("bottomInset") { (view: FreightIQNavigationView, inset: Double) in
        view.setBottomInset(inset)
      }
    }
  }
}

// The SDK normally dismisses itself at its final destination. Arrival is only a
// status in FreightIQ; the driver's persisted action owns leaving this delivery.
private final class DeliveryNavigationController: NavigationViewController {
  var bottomOcclusion: CGFloat = 180 {
    didSet { view.setNeedsLayout() }
  }
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    let banner = navigationView.topBannerContainerView
    banner.layer.cornerRadius = 26
    banner.clipsToBounds = true
    for constraint in navigationView.constraints where constraint.firstItem as? UIView === banner {
      switch constraint.firstAttribute {
      case .leading: constraint.constant = 12
      case .trailing: constraint.constant = -12
      case .top: constraint.constant = 8
      default: break
      }
    }
    if var padding = navigationMapView?.viewportPadding {
      padding.bottom = bottomOcclusion
      navigationMapView?.viewportPadding = padding
    }
    // Keep required map credits above FreightIQ's floating panel.
    navigationMapView?.mapView.ornaments.options.logo.margins.y = bottomOcclusion + 8
    navigationMapView?.mapView.ornaments.options.attributionButton.margins.y = bottomOcclusion + 8
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
  private let notificationId = "com.freightiq.navigation.maneuver"
  private static var provider: MapboxNavigationProvider { FreightIQOfflineRoute.shared.provider }

  func configure(_ next: FreightIQNavigationRequest) {
    guard next.id != request?.id else { return }
    if next.stopId != request?.stopId { reportedArrivalStopId = nil }
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
    if window == nil {
      stop()
    } else if controller == nil, let request {
      calculate(request)
    }
  }

  private func emit(_ state: String, _ request: FreightIQNavigationRequest, message: String = "", legs: [[String: Any]] = []) {
    onState(["state": state, "requestId": request.id, "stopId": request.stopId, "message": message, "legs": legs])
  }

  private func legEstimates(_ route: Route, _ request: FreightIQNavigationRequest, progress: RouteProgress? = nil) -> [[String: Any]] {
    guard route.legs.count == request.stops.count else { return [] }
    return route.legs.enumerated().map { index, leg in
      ["stopId": request.stops[index].id,
       "seconds": index == 0 ? (progress?.currentLegProgress.durationRemaining ?? leg.expectedTravelTime) : leg.expectedTravelTime,
       "meters": index == 0 ? (progress?.currentLegProgress.distanceRemaining ?? leg.distance) : leg.distance]
    }
  }

  private func calculate(_ next: FreightIQNavigationRequest) {
    task?.cancel()
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
        let coordinates = [CLLocationCoordinate2D(latitude: next.originLatitude, longitude: next.originLongitude)]
          + next.stops.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
        let options = NavigationRouteOptions(coordinates: coordinates, profileIdentifier: .automobile)
        let provider = Self.provider
        let routes = try await provider.routingProvider().calculateRoutes(options: options).value
        guard !Task.isCancelled, let self, self.window != nil, self.request?.id == next.id else { return }
        if self.controller != nil {
          provider.tripSession().startActiveGuidance(with: routes, startLegIndex: 0)
          self.guidanceId = next.id
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
        navigation.showsEndOfRouteFeedback = false
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
        navigation.navigationMapView?.mapView.mapboxMap.setCamera(to: CameraOptions(center: coordinates[0], zoom: 15))
        navigation.didMove(toParent: parent)
        self.controller = navigation
        self.guidanceId = next.id
        self.emit("started", next, legs: self.legEstimates(routes.mainRoute.route, next))
      } catch {
        guard !Task.isCancelled, let self, self.request?.id == next.id else { return }
        self.emit("error", next, message: "Could not calculate directions. Your route is still saved. Check your connection and try again.")
      }
    }
  }

  private func stop() {
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

  func navigationViewController(_ navigationViewController: NavigationViewController, didArriveAt waypoint: Waypoint) {
    guard let request, request.id == guidanceId else { return }
    reportArrival("arrived", request)
  }

  private func reportArrival(_ state: String, _ request: FreightIQNavigationRequest) {
    guard reportedArrivalStopId != request.stopId else { return }
    reportedArrivalStopId = request.stopId
    emit(state, request)
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didUpdate progress: RouteProgress, with location: CLLocation, rawLocation: CLLocation) {
    guard let request, request.id == guidanceId else { return }
    let now = Date()
    if reportedArrivalStopId != request.stopId {
      let destination = CLLocation(latitude: request.latitude, longitude: request.longitude)
      if arrivalProximity.qualifies(rawLocation, destination: destination, now: now) {
        reportArrival("arrivedNearby", request)
      }
    }
    guard now.timeIntervalSince(lastProgressAt) >= 5 else { return }
    lastProgressAt = now
    updateTurnNotification(progress)
    emit("progress", request, legs: legEstimates(progress.route, request, progress: progress))
  }

  private func clearTurnNotification() {
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [notificationId])
    center.removeDeliveredNotifications(withIdentifiers: [notificationId])
  }

  private func updateTurnNotification(_ progress: RouteProgress) {
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
    provider = MapboxNavigationProvider(coreConfig: CoreConfig(
      routingConfig: RoutingConfig(datasetProfileIdentifier: .automobile),
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
        promise.resolve(complete && self.saved?.id == saved.id ? saved.bounds : nil)
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

  func download(_ bounds: [Double], promise: Promise, progress: @escaping (Double) -> Void) {
    guard cancelDownload == nil, !removing else { promise.reject("BUSY", "Wait for the current offline action to finish."); return }
    guard bounds.count == 4, bounds.allSatisfy(\.isFinite),
          (-180...180).contains(bounds[0]), (-180...180).contains(bounds[2]),
          (-85...85).contains(bounds[1]), (-85...85).contains(bounds[3]),
          bounds[0] < bounds[2], bounds[1] < bounds[3]
    else { promise.reject("COVERAGE", "Could not prepare offline coverage for this route."); return }
    let (west, south, east, north) = (bounds[0], bounds[1], bounds[2], bounds[3])
    let ring = [(west, south), (east, south), (east, north), (west, north), (west, south)]
      .map { CLLocationCoordinate2D(latitude: $0.1, longitude: $0.0) }
    let mapDescriptors = styles.map { style in
      manager.createTilesetDescriptor(for: TilesetDescriptorOptions(
        styleURI: style, zoomRange: 6...16, tilesets: nil,
        stylePackOptions: StylePackLoadOptions(glyphsRasterizationMode: nil)
      ))
    }
    guard let options = TileRegionLoadOptions(
      geometry: Polygon([ring]).geometry,
      descriptors: [provider.getLatestNavigationTilesetDescriptor()] + mapDescriptors,
      metadata: nil, acceptExpired: false, networkRestriction: .none
    ) else { promise.reject("COVERAGE", "Could not prepare offline coverage for this route."); return }

    let id = "freightiq-route-" + UUID().uuidString
    cancelled = false
    defaults.set(id, forKey: pendingKey)
    let operation = store.loadTileRegion(forId: id, loadOptions: options, progress: { state in
      guard state.requiredResourceCount > 0 else { return }
      let fraction = Double(state.completedResourceCount) / Double(state.requiredResourceCount)
      DispatchQueue.main.async {
        if self.defaults.string(forKey: self.pendingKey) == id { progress(fraction) }
      }
    }, completion: { result in
      DispatchQueue.main.async {
        guard let region = try? result.get(), region.requiredResourceCount > 0,
              region.completedResourceCount == region.requiredResourceCount else {
          self.finishDownload(id, bounds: bounds, ready: false, promise: promise)
          return
        }
        self.checkStyles { ready in
          self.finishDownload(id, bounds: bounds, ready: ready, promise: promise)
        }
      }
    })
    cancelDownload = { operation.cancel() }
  }

  private func finishDownload(_ id: String, bounds: [Double], ready: Bool, promise: Promise) {
    defer { cancelDownload = nil; defaults.removeObject(forKey: pendingKey) }
    guard ready, !cancelled, defaults.string(forKey: pendingKey) == id else {
      store.removeTileRegion(forId: id)
      promise.reject("DOWNLOAD", "Offline download did not finish. Check your connection and try again.")
      return
    }
    let previous = saved?.id
    defaults.set(["id": id, "bounds": bounds], forKey: readyKey)
    if let previous { store.removeTileRegion(forId: previous) }
    promise.resolve(nil)
  }

  func cancel() {
    guard let cancelDownload else { return }
    cancelled = true
    cancelDownload()
  }

  func remove(_ promise: Promise) {
    guard cancelDownload == nil, !removing else { promise.reject("BUSY", "Wait for the current offline action to finish."); return }
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
          promise.reject("REMOVE", "Could not remove the offline download.")
        }
      }
    }
  }
}
