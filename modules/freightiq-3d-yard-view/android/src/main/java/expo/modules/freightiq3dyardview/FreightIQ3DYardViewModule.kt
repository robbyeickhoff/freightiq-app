package expo.modules.freightiq3dyardview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FreightIQ3DYardViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FreightIQ3DYardView")

    View(FreightIQ3DYardView::class) {
      Events("onInitialized", "onError")

      Prop("coordinates") { view: FreightIQ3DYardView, value: YardCoordinates ->
        view.setCoordinates(value)
      }

      Prop("resetToken") { view: FreightIQ3DYardView, value: Int ->
        view.resetCamera(value)
      }
    }
  }
}
