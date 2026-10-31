package expo.modules.freightiq3dyardview

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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
import com.google.android.gms.maps3d.model.MarkerView
import com.google.android.gms.maps3d.model.MarkerViewOptions
import com.google.android.gms.maps3d.model.PinView
import com.google.android.gms.maps3d.model.RotateControl
import com.google.android.gms.maps3d.model.TiltControl
import com.google.android.gms.maps3d.model.ZoomControl
import com.google.android.gms.maps3d.model.camera
import com.google.android.gms.maps3d.model.flyToOptions
import com.google.android.gms.maps3d.model.latLngAltitude
import com.google.android.gms.maps3d.model.pinConfiguration

class FreightIQ3DYardActivity : AppCompatActivity(), OnMap3DViewReadyCallback {
  private lateinit var mapView: Map3DView
  private var googleMap: GoogleMap3D? = null
  private var stopMarker: MarkerView? = null
  private var deliveryZoneMarker: MarkerView? = null
  private var initialized = false

  private val stopLatitude by lazy { intent.getDoubleExtra(EXTRA_STOP_LATITUDE, Double.NaN) }
  private val stopLongitude by lazy { intent.getDoubleExtra(EXTRA_STOP_LONGITUDE, Double.NaN) }
  private val deliveryZoneLatitude by lazy {
    intent.getDoubleExtra(EXTRA_DELIVERY_ZONE_LATITUDE, Double.NaN)
  }
  private val deliveryZoneLongitude by lazy {
    intent.getDoubleExtra(EXTRA_DELIVERY_ZONE_LONGITUDE, Double.NaN)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.statusBarColor = Color.BLACK
    window.navigationBarColor = Color.BLACK
    setResult(Activity.RESULT_CANCELED)

    if (!coordinatesAreValid()) {
      Toast.makeText(this, "This stop does not have valid delivery-zone coordinates.", Toast.LENGTH_LONG).show()
      finish()
      return
    }

    val config = Map3DInitConfig.create(
      centerLat = (stopLatitude + deliveryZoneLatitude) / 2.0,
      centerLng = (stopLongitude + deliveryZoneLongitude) / 2.0,
      mapMode = Map3DMode.HYBRID
    )
    mapView = Map3DView(this, config)

    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.BLACK)
      addView(
        mapView,
        FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
      addView(createBottomControls())
    }
    setContentView(root)

    mapView.onCreate(savedInstanceState)
    mapView.getMap3DViewAsync(this)
  }

  private fun createBottomControls(): LinearLayout {
    val buttonHeight = dp(64)
    val controls = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      setPadding(dp(12), dp(8), dp(12), dp(12))
      setBackgroundColor(Color.argb(225, 12, 16, 20))
    }

    val backButton = Button(this).apply {
      text = "← ${intent.getStringExtra(EXTRA_BACK_LABEL) ?: "Back"}"
      textSize = 17f
      isAllCaps = false
      setTextColor(Color.WHITE)
      setBackgroundColor(Color.rgb(17, 22, 27))
      setOnClickListener { finishWithAction(ACTION_BACK) }
    }
    val mapButton = Button(this).apply {
      text = "▣  Open 2D map"
      textSize = 17f
      isAllCaps = false
      setTextColor(Color.BLACK)
      setBackgroundColor(Color.rgb(244, 162, 89))
      setOnClickListener { finishWithAction(ACTION_OPEN_2D) }
    }

    controls.addView(backButton, LinearLayout.LayoutParams(0, buttonHeight, 1f).apply {
      marginEnd = dp(6)
    })
    controls.addView(mapButton, LinearLayout.LayoutParams(0, buttonHeight, 1f).apply {
      marginStart = dp(6)
    })

    controls.layoutParams = FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.WRAP_CONTENT,
      Gravity.BOTTOM
    )
    return controls
  }

  override fun onMap3DViewReady(googleMap3D: GoogleMap3D) {
    googleMap = googleMap3D
    googleMap3D.setOnMapReadyListener { initializeMap() }
    Handler(Looper.getMainLooper()).postDelayed({ initializeMap() }, 2_000)
  }

  private fun initializeMap() {
    val map = googleMap ?: return
    if (initialized) return
    initialized = true

    map.getUiControlSettings()?.setUiControlsPlacement(
      listOf(CompassControl(), ZoomControl(), TiltControl(), RotateControl()),
      UiControlSettings.ControlPlacement.TRAILING
    )

    val stopPin = PinView(this, pinConfiguration {
      scale = 0.72f
      setBackgroundColor(Color.GREEN)
      setBorderColor(Color.WHITE)
      setGlyph(Glyph.fromColor(Color.RED))
    }).apply {
      contentDescription = "Stop"
    }
    stopMarker = map.addMarkerView(MarkerViewOptions().apply {
      position = latLngAltitude {
        latitude = stopLatitude
        longitude = stopLongitude
        altitude = 0.0
      }
      altitudeMode = AltitudeMode.CLAMP_TO_GROUND
      collisionBehavior = CollisionBehavior.REQUIRED
      collisionPriority = 1
      content = stopPin
    })

    val deliveryZonePin = PinView(this, pinConfiguration {
      scale = 0.72f
      setBackgroundColor(Color.BLUE)
      setBorderColor(Color.WHITE)
      setGlyph(Glyph.fromColor(Color.WHITE))
    }).apply {
      contentDescription = "Delivery Zone"
    }
    deliveryZoneMarker = map.addMarkerView(MarkerViewOptions().apply {
      position = latLngAltitude {
        latitude = deliveryZoneLatitude
        longitude = deliveryZoneLongitude
        altitude = 0.0
      }
      altitudeMode = AltitudeMode.CLAMP_TO_GROUND
      collisionBehavior = CollisionBehavior.REQUIRED
      collisionPriority = 2
      content = deliveryZonePin
    })

    val tilt = 35.0
    val range = 520.0
    val lookAheadMeters = range * kotlin.math.sin(Math.toRadians(tilt))
    map.flyCameraTo(flyToOptions {
      endCamera = camera {
        center = latLngAltitude {
          latitude = deliveryZoneLatitude - lookAheadMeters / 111000.0
          longitude = deliveryZoneLongitude
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

  override fun onError(error: Exception) {
    Toast.makeText(
      this,
      error.message ?: "Google Maps 3D could not open this stop.",
      Toast.LENGTH_LONG
    ).show()
  }

  override fun onResume() {
    super.onResume()
    if (::mapView.isInitialized) mapView.onResume()
  }

  override fun onPause() {
    if (::mapView.isInitialized) mapView.onPause()
    super.onPause()
  }

  override fun onDestroy() {
    stopMarker?.remove()
    deliveryZoneMarker?.remove()
    if (::mapView.isInitialized) mapView.onDestroy()
    super.onDestroy()
  }

  override fun onLowMemory() {
    super.onLowMemory()
    if (::mapView.isInitialized) mapView.onLowMemory()
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    if (::mapView.isInitialized) mapView.onSaveInstanceState(outState)
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    finishWithAction(ACTION_BACK)
  }

  private fun finishWithAction(action: String) {
    setResult(Activity.RESULT_OK, Intent().putExtra(EXTRA_RESULT_ACTION, action))
    finish()
  }

  private fun coordinatesAreValid() =
    stopLatitude.isFinite() && stopLatitude in -90.0..90.0 &&
      stopLongitude.isFinite() && stopLongitude in -180.0..180.0 &&
      deliveryZoneLatitude.isFinite() && deliveryZoneLatitude in -90.0..90.0 &&
      deliveryZoneLongitude.isFinite() && deliveryZoneLongitude in -180.0..180.0

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  companion object {
    const val REQUEST_CODE = 7303
    const val EXTRA_STOP_LATITUDE = "stopLatitude"
    const val EXTRA_STOP_LONGITUDE = "stopLongitude"
    const val EXTRA_DELIVERY_ZONE_LATITUDE = "deliveryZoneLatitude"
    const val EXTRA_DELIVERY_ZONE_LONGITUDE = "deliveryZoneLongitude"
    const val EXTRA_BACK_LABEL = "backLabel"
    const val EXTRA_RESULT_ACTION = "resultAction"
    const val ACTION_BACK = "back"
    const val ACTION_OPEN_2D = "open2D"
  }
}
