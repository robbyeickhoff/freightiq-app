import ExpoModulesCore
#if FREIGHTIQ_3D_YARD_VIEW
import GoogleMaps3D
import SwiftUI

private struct YardMap: View {
  let stopLatitude: Double
  let stopLongitude: Double
  let deliveryZoneLatitude: Double
  let deliveryZoneLongitude: Double
  let resetToken: Int
  @State private var cameraTrigger = 0

  private var stop: LatLngAltitude {
    LatLngAltitude(latitude: stopLatitude, longitude: stopLongitude)
  }

  private var deliveryZone: LatLngAltitude {
    LatLngAltitude(latitude: deliveryZoneLatitude, longitude: deliveryZoneLongitude)
  }

  private var camera: Camera {
    let tilt = 35.0
    let range = 520.0
    let lookAheadMeters = range * sin(tilt * .pi / 180)
    let center = LatLngAltitude(
      latitude: deliveryZoneLatitude - lookAheadMeters / 111_000,
      longitude: deliveryZoneLongitude,
      altitude: 220
    )

    return Camera(
      center: center,
      heading: 0,
      tilt: tilt,
      range: range,
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
      cameraTrigger += 1
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
    stopLatitude: Double,
    stopLongitude: Double,
    deliveryZoneLatitude: Double,
    deliveryZoneLongitude: Double
  ) {
    self.stopLatitude = stopLatitude
    self.stopLongitude = stopLongitude
    self.deliveryZoneLatitude = deliveryZoneLatitude
    self.deliveryZoneLongitude = deliveryZoneLongitude
    hasCoordinates = true
    renderMap()
  }

  func resetCamera(token: Int) {
    resetToken = token
    renderMap()
  }

  private func renderMap() {
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
      resetToken: resetToken
    )

    if let hostingController {
      hostingController.rootView = yardMap
    } else {
      let controller = UIHostingController(rootView: yardMap)
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
    stopLatitude: Double,
    stopLongitude: Double,
    deliveryZoneLatitude: Double,
    deliveryZoneLongitude: Double
  ) {
    stopLatitudeValue = stopLatitude
    stopLongitudeValue = stopLongitude
    deliveryZoneLatitudeValue = deliveryZoneLatitude
    deliveryZoneLongitudeValue = deliveryZoneLongitude
    onError(["message": "3D Yard View is available only in the FreightIQ development build."])
  }

  func resetCamera(token: Int) {}
}
#endif
