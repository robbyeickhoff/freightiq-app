import ExpoModulesCore

struct YardCoordinates: Record {
  @Field var stopLatitude = 0.0
  @Field var stopLongitude = 0.0
  @Field var deliveryZoneLatitude = 0.0
  @Field var deliveryZoneLongitude = 0.0
}

public class FreightIQ3DYardViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FreightIQ3DYardView")

    View(FreightIQ3DYardView.self) {
      Events("onInitialized", "onError")

      Prop("coordinates") { (view: FreightIQ3DYardView, value: YardCoordinates) in
        view.setCoordinates(
          stopLatitude: value.stopLatitude,
          stopLongitude: value.stopLongitude,
          deliveryZoneLatitude: value.deliveryZoneLatitude,
          deliveryZoneLongitude: value.deliveryZoneLongitude
        )
      }

      Prop("resetToken") { (view: FreightIQ3DYardView, value: Int) in
        view.resetCamera(token: value)
      }
    }
  }
}
