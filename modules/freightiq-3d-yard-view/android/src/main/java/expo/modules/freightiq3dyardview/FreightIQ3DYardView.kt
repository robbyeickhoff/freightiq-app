package expo.modules.freightiq3dyardview

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import com.google.android.gms.maps3d.GoogleMap3D
import com.google.android.gms.maps3d.Map3DInitConfig
import com.google.android.gms.maps3d.Map3DView
import com.google.android.gms.maps3d.OnMap3DViewReadyCallback
import com.google.android.gms.maps3d.UiControlSettings
import com.google.android.gms.maps3d.model.AltitudeMode
import com.google.android.gms.maps3d.model.CollisionBehavior
import com.google.android.gms.maps3d.model.CompassControl
import com.google.android.gms.maps3d.model.Glyph
import com.google.android.gms.maps3d.model.Map3DMode
import com.google.android.gms.maps3d.model.Marker
import com.google.android.gms.maps3d.model.RotateControl
import com.google.android.gms.maps3d.model.TiltControl
import com.google.android.gms.maps3d.model.ZoomControl
import com.google.android.gms.maps3d.model.camera
import com.google.android.gms.maps3d.model.flyToOptions
import com.google.android.gms.maps3d.model.latLngAltitude
import com.google.android.gms.maps3d.model.markerOptions
import com.google.android.gms.maps3d.model.pinConfiguration
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

class FreightIQ3DYardView(context: Context, appContext: AppContext) : ExpoView(context, appContext),
  OnMap3DViewReadyCallback {
  private val onInitialized by EventDispatcher<Unit>()
  private val onError by EventDispatcher<Map<String, String>>()

  private var coordinates: YardCoordinates? = null
  private var mapView: Map3DView? = null
  private var googleMap: GoogleMap3D? = null
  private var stopMarker: Marker? = null
  private var deliveryZoneMarker: Marker? = null
  private var resetToken = 0
  private var mapStarted = false
  private var mapResumed = false

  init {
    setBackgroundColor(Color.BLACK)
  }

  fun setCoordinates(value: YardCoordinates) {
    if (!valid(value.stopLatitude, value.stopLongitude) ||
      !valid(value.deliveryZoneLatitude, value.deliveryZoneLongitude)
    ) {
      onError(mapOf("message" to "The stop or delivery-zone coordinates are invalid."))
      return
    }

    coordinates = value
    if (mapView == null) {
      createMap(value)
    } else {
      renderYard()
    }
  }

  fun resetCamera(token: Int) {
    if (token == resetToken) return
    resetToken = token
    moveCamera()
  }

  private fun createMap(value: YardCoordinates) {
    activeView?.get()?.takeIf { it !== this }?.destroyMap()
    activeView = WeakReference(this)

    val centerLatitude = (value.stopLatitude + value.deliveryZoneLatitude) / 2.0
    val centerLongitude = (value.stopLongitude + value.deliveryZoneLongitude) / 2.0
    val config = Map3DInitConfig.create(
      centerLat = centerLatitude,
      centerLng = centerLongitude,
      centerAlt = 220.0,
      heading = 0.0,
      tilt = 35.0,
      roll = 0.0,
      range = 520.0,
      minAltitude = 25.0,
      maxAltitude = 5000.0,
      minTilt = 0.0,
      maxTilt = 80.0,
      mapMode = Map3DMode.HYBRID
    )
    val view = Map3DView(context, config)
    view.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(view)
    mapView = view
    view.onCreate(Bundle())
    view.getMap3DViewAsync(this)
    if (isAttachedToWindow) {
      startAndResumeMap(view)
    }
  }

  private fun startAndResumeMap(view: Map3DView) {
    if (!mapStarted) {
      view.onStart()
      mapStarted = true
    }
    if (!mapResumed) {
      view.onResume()
      mapResumed = true
    }
  }

  override fun onMap3DViewReady(map: GoogleMap3D) {
    if (activeView?.get() !== this || mapView == null) return
    googleMap = map
    map.getUiControlSettings()?.setUiControlsPlacement(
      listOf(CompassControl(), ZoomControl(), TiltControl(), RotateControl()),
      UiControlSettings.ControlPlacement.TRAILING
    )
    renderYard()
    onInitialized(Unit)
  }

  override fun onError(error: Exception) {
    onError(mapOf("message" to (error.message ?: "Google Maps 3D could not open this stop.")))
  }

  private fun renderYard() {
    val value = coordinates ?: return
    val map = googleMap ?: return
    stopMarker?.remove()
    deliveryZoneMarker?.remove()

    stopMarker = map.addMarker(markerOptions {
      position = latLngAltitude {
        latitude = value.stopLatitude
        longitude = value.stopLongitude
        altitude = 4.0
      }
      label = "Stop"
      altitudeMode = AltitudeMode.RELATIVE_TO_MESH
      collisionBehavior = CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
      isDrawnWhenOccluded = true
      isSizePreserved = true
      zIndex = 1
      setStyle(pinConfiguration {
        setBackgroundColor(Color.GREEN)
        setBorderColor(Color.WHITE)
        setGlyph(Glyph.fromColor(Color.RED))
      })
    })

    deliveryZoneMarker = map.addMarker(markerOptions {
      position = latLngAltitude {
        latitude = value.deliveryZoneLatitude
        longitude = value.deliveryZoneLongitude
        altitude = 5.0
      }
      label = "Delivery Zone"
      altitudeMode = AltitudeMode.RELATIVE_TO_MESH
      collisionBehavior = CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
      isDrawnWhenOccluded = true
      isSizePreserved = true
      zIndex = 2
      setStyle(pinConfiguration {
        setBackgroundColor(Color.BLUE)
        setBorderColor(Color.WHITE)
        setGlyph(Glyph.fromColor(Color.WHITE))
      })
    })

    moveCamera()
  }

  private fun moveCamera() {
    val value = coordinates ?: return
    val map = googleMap ?: return
    val tilt = 35.0
    val range = 520.0
    val lookAheadMeters = range * kotlin.math.sin(Math.toRadians(tilt))
    map.flyCameraTo(flyToOptions {
      endCamera = camera {
        center = latLngAltitude {
          latitude = value.deliveryZoneLatitude - lookAheadMeters / 111000.0
          longitude = value.deliveryZoneLongitude
          altitude = 220.0
        }
        heading = 0.0
        this.tilt = tilt
        this.range = range
        roll = 0.0
        altitudeMode = AltitudeMode.RELATIVE_TO_MESH
      }
      durationInMillis = 350
    })
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    mapView?.let(::startAndResumeMap)
  }

  override fun onDetachedFromWindow() {
    destroyMap()
    if (activeView?.get() === this) {
      activeView = null
    }
    super.onDetachedFromWindow()
  }

  private fun destroyMap() {
    mapView?.let { view ->
      if (mapResumed) {
        view.onPause()
        mapResumed = false
      }
      if (mapStarted) {
        view.onStop()
        mapStarted = false
      }
    }
    stopMarker?.remove()
    deliveryZoneMarker?.remove()
    stopMarker = null
    deliveryZoneMarker = null
    mapView?.onDestroy()
    removeAllViews()
    googleMap = null
    mapView = null
  }

  private fun valid(latitude: Double, longitude: Double) =
    latitude in -90.0..90.0 && longitude in -180.0..180.0

  private companion object {
    var activeView: WeakReference<FreightIQ3DYardView>? = null
  }
}
