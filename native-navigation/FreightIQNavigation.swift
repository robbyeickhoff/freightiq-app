internal import ExpoModulesCore
import CoreLocation
import MapboxDirections
import MapboxNavigationCore
import MapboxNavigationUIKit

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
    View(FreightIQNavigationView.self) {
      Events("onState")
      Prop("request") { (view: FreightIQNavigationView, request: FreightIQNavigationRequest) in
        view.configure(request)
      }
      Prop("dark") { (view: FreightIQNavigationView, dark: Bool) in
        view.setAppearance(dark)
      }
    }
  }
}

// The SDK normally dismisses itself at its final destination. Arrival is only a
// status in FreightIQ; the driver's persisted action owns leaving this delivery.
private final class DeliveryNavigationController: NavigationViewController {
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
  private var lastProgressAt = Date.distantPast
  private static let provider = MapboxNavigationProvider(coreConfig: CoreConfig(
    routingConfig: RoutingConfig(datasetProfileIdentifier: .automobile),
    multilegAdvancing: .manually { _ in false }
  ))

  func configure(_ next: FreightIQNavigationRequest) {
    guard next.id != request?.id else { return }
    request = next
    if window != nil { calculate(next) }
  }

  func setAppearance(_ value: Bool) {
    dark = value
    controller?.overrideUserInterfaceStyle = value ? .dark : .light
    controller?.styleManager?.applyStyle(type: value ? .night : .day)
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
    if let request, request.id == guidanceId { emit("arrived", request) }
  }

  func navigationViewController(_ navigationViewController: NavigationViewController, didUpdate progress: RouteProgress, with location: CLLocation, rawLocation: CLLocation) {
    guard let request, request.id == guidanceId, Date().timeIntervalSince(lastProgressAt) >= 5 else { return }
    lastProgressAt = Date()
    emit("progress", request, legs: legEstimates(progress.route, request, progress: progress))
  }

  func navigationViewControllerDidDismiss(_ navigationViewController: NavigationViewController, byCanceling canceled: Bool) {
    guard canceled else { return }
    if let request { emit("closed", request) }
    stop()
  }
}
