package expo.modules.freightiq3dyardview

import android.app.Activity
import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues

class FreightIQ3DYardViewModule : Module() {
  private var launchPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("FreightIQ3DYardView")

    AsyncFunction("openAndroid3DYardView") {
        coordinates: YardCoordinates,
        backLabel: String,
        promise: Promise ->
      val activity = appContext.throwingActivity
      launchPromise?.reject("ERR_3D_VIEW_REPLACED", "A newer 3D view replaced this one.", null)
      launchPromise = promise
      val intent = Intent(activity, FreightIQ3DYardActivity::class.java).apply {
        putExtra(FreightIQ3DYardActivity.EXTRA_STOP_LATITUDE, coordinates.stopLatitude)
        putExtra(FreightIQ3DYardActivity.EXTRA_STOP_LONGITUDE, coordinates.stopLongitude)
        putExtra(
          FreightIQ3DYardActivity.EXTRA_DELIVERY_ZONE_LATITUDE,
          coordinates.deliveryZoneLatitude
        )
        putExtra(
          FreightIQ3DYardActivity.EXTRA_DELIVERY_ZONE_LONGITUDE,
          coordinates.deliveryZoneLongitude
        )
        putExtra(FreightIQ3DYardActivity.EXTRA_BACK_LABEL, backLabel)
      }
      activity.startActivityForResult(intent, FreightIQ3DYardActivity.REQUEST_CODE)
    }.runOnQueue(Queues.MAIN)

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode != FreightIQ3DYardActivity.REQUEST_CODE) return@OnActivityResult
      val action = if (resultCode == Activity.RESULT_OK) {
        data?.getStringExtra(FreightIQ3DYardActivity.EXTRA_RESULT_ACTION)
      } else {
        null
      }
      launchPromise?.resolve(action ?: FreightIQ3DYardActivity.ACTION_BACK)
      launchPromise = null
    }

    View(FreightIQ3DYardView::class) {
      Events("onInitialized", "onError")

      Prop("coordinates") { view: FreightIQ3DYardView, value: YardCoordinates ->
        view.setCoordinates(value)
      }

      Prop("resetToken") { view: FreightIQ3DYardView, value: Int ->
        view.resetCamera(value)
      }

      OnViewDestroys { view: FreightIQ3DYardView ->
        view.destroy()
      }
    }
  }
}
