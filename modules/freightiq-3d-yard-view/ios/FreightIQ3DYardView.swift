import ExpoModulesCore
#if FREIGHTIQ_3D_YARD_VIEW
import GoogleMaps3D
import SwiftUI

private struct YardMap: View {
  let stopLatitude: Double
  let stopLongitude: Double
  let deliveryZoneLatitude: Double
  let deliveryZoneLongitude: Double
  let embedded: Bool
  let resetToken: Int
  @State private var cameraTrigger = 0

  private var stop: LatLngAltitude {
    LatLngAltitude(latitude: stopLatitude, longitude: stopLongitude)
  }

  private var deliveryZone: LatLngAltitude {
    LatLngAltitude(latitude: deliveryZoneLatitude, longitude: deliveryZoneLongitude)
  }

  private var camera: Camera {
    return Camera(
      center: deliveryZone,
      heading: 0,
      tilt: 35,
      range: 180,
      fieldOfView: .degrees(45),
      altitudeMode: .relativeToMesh
    )
  }

  private var cameraBounds: LatLngBounds {
    let latitudePadding = max(0.004, abs(stopLatitude - deliveryZoneLatitude) * 3)
    let longitudePadding = max(0.004, abs(stopLongitude - deliveryZoneLongitude) * 3)
    let latitudeCenter = (stopLatitude + deliveryZoneLatitude) / 2
    let longitudeCenter = (stopLongitude + deliveryZoneLongitude) / 2

    return LatLngBounds(
      latitude: (latitudeCenter - latitudePadding)...(latitudeCenter + latitudePadding),
      longitude: (longitudeCenter - longitudePadding)...(longitudeCenter + longitudePadding)
    )
  }

  var body: some View {
    Map(initialCamera: camera, mode: .hybrid) {
      Marker3D(
        position: stop,
        altitudeMode: .relativeToMesh,
        collisionBehavior: .required,
        drawsWhenOccluded: true,
        sizePreserved: true,
        zIndex: 1,
        label: "Stop",
        style: .pin(.init(backgroundColor: .green, borderColor: .white, scale: 1.1))
      )

      Marker3D(
        position: deliveryZone,
        altitudeMode: .relativeToMesh,
        collisionBehavior: .required,
        drawsWhenOccluded: true,
        sizePreserved: true,
        zIndex: 2,
        label: "Delivery zone",
        style: .pin(
          .init(backgroundColor: .blue, borderColor: .white, scale: 1.25) {
            Image(systemName: "scope")
              .resizable()
              .scaledToFit()
              .foregroundStyle(.white)
          }
        )
      )
    }
    .cameraRestrictions([
      .bounds(cameraBounds),
      .altitude(25...5_000),
      .tilt(0...80),
    ])
    .flyCameraTo(camera, duration: 0.35, trigger: cameraTrigger)
    .mapControls(at: .trailing) {
      CompassControl()
      ZoomControl()
      TiltControl()
      RotateControl()
    }
    .onAppear {
      if !embedded { cameraTrigger += 1 }
    }
    .onChange(of: resetToken) { _ in
      cameraTrigger += 1
    }
  }
}

final class FreightIQ3DYardView: ExpoView {
  let onInitialized = EventDispatcher()
  let onError = EventDispatcher()

  private var stopLatitude = 0.0
  private var stopLongitude = 0.0
  private var deliveryZoneLatitude = 0.0
  private var deliveryZoneLongitude = 0.0
  private var embedded = false
  private var resetToken = 0
  private var hasCoordinates = false
  private var hostingController: UIHostingController<YardMap>?

  var stopLatitudeValue: Double { stopLatitude }
  var stopLongitudeValue: Double { stopLongitude }
  var deliveryZoneLatitudeValue: Double { deliveryZoneLatitude }
  var deliveryZoneLongitudeValue: Double { deliveryZoneLongitude }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
  }

  func setCoordinates(
    embedded: Bool,
    stopLatitude: Double,
    stopLongitude: Double,
    deliveryZoneLatitude: Double,
    deliveryZoneLongitude: Double
  ) {
    self.embedded = embedded
    self.stopLatitude = stopLatitude
    self.stopLongitude = stopLongitude
    self.deliveryZoneLatitude = deliveryZoneLatitude
    self.deliveryZoneLongitude = deliveryZoneLongitude
    hasCoordinates = true
    renderMap()
  }

  func resetCamera(token: Int) {
    guard resetToken != token else { return }
    resetToken = token
    renderMap()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if embedded && hostingController == nil { renderMap() }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil, let hostingController, embedded {
      hostingController.willMove(toParent: nil)
      hostingController.view.removeFromSuperview()
      hostingController.removeFromParent()
      self.hostingController = nil
    } else if embedded && hostingController == nil {
      renderMap()
    }
  }

  private func renderMap() {
    // An embedded map can receive coordinates before its modal has a viewport.
    if embedded && (window == nil || bounds.isEmpty) { return }
    guard hasCoordinates else { return }
    guard
      (-90...90).contains(stopLatitude),
      (-180...180).contains(stopLongitude),
      (-90...90).contains(deliveryZoneLatitude),
      (-180...180).contains(deliveryZoneLongitude)
    else {
      onError(["message": "The stop or delivery-zone coordinates are invalid."])
      return
    }

    guard
      let apiKey = Bundle.main.object(forInfoDictionaryKey: "FreightIQGoogleMaps3DAPIKey") as? String,
      !apiKey.isEmpty
    else {
      onError(["message": "The Google Maps 3D development key is missing from this build."])
      return
    }

    Map.apiKey = apiKey
    let yardMap = YardMap(
      stopLatitude: stopLatitude,
      stopLongitude: stopLongitude,
      deliveryZoneLatitude: deliveryZoneLatitude,
      deliveryZoneLongitude: deliveryZoneLongitude,
      embedded: embedded,
      resetToken: resetToken
    )

    if let hostingController {
      hostingController.rootView = yardMap
    } else {
      let parent = embedded ? sequence(first: self as UIResponder, next: { $0.next })
        .lazy.compactMap { $0 as? UIViewController }.first : nil
      if embedded && parent == nil { return }
      let controller = UIHostingController(rootView: yardMap)
      parent?.addChild(controller)
      controller.view.frame = bounds
      controller.view.backgroundColor = .black
      controller.view.translatesAutoresizingMaskIntoConstraints = false
      addSubview(controller.view)
      NSLayoutConstraint.activate([
        controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
        controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
        controller.view.topAnchor.constraint(equalTo: topAnchor),
        controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
      hostingController = controller
      if let parent { controller.didMove(toParent: parent) }
    }

    onInitialized()
  }
}
#else
final class FreightIQ3DYardView: ExpoView {
  let onInitialized = EventDispatcher()
  let onError = EventDispatcher()

  var stopLatitudeValue = 0.0
  var stopLongitudeValue = 0.0
  var deliveryZoneLatitudeValue = 0.0
  var deliveryZoneLongitudeValue = 0.0

  func setCoordinates(
    embedded: Bool,
    stopLatitude: Double,
    stopLongitude: Double,
    deliveryZoneLatitude: Double,
    deliveryZoneLongitude: Double
  ) {
    stopLatitudeValue = stopLatitude
    stopLongitudeValue = stopLongitude
    deliveryZoneLatitudeValue = deliveryZoneLatitude
    deliveryZoneLongitudeValue = deliveryZoneLongitude
    onError(["message": "3D Yard View is not configured in this build."])
  }

  func resetCamera(token: Int) {}
}
#endif
