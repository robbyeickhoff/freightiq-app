package expo.modules.freightiqnavigation

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.view.MotionEvent
import android.view.ViewConfiguration
import com.mapbox.maps.ImageHolder
import com.mapbox.maps.plugin.LocationPuck2D
import com.mapbox.maps.plugin.PuckBearing
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.widget.Button
import android.widget.LinearLayout
import com.mapbox.maps.EdgeInsets
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.ScrollView
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.api.directions.v5.models.LegStep
import com.mapbox.api.directions.v5.models.StepManeuver
import com.mapbox.geojson.Point
import com.mapbox.geojson.LineString
import com.mapbox.turf.TurfMeasurement
import com.mapbox.turf.TurfMisc
import com.mapbox.navigation.core.reroute.RerouteOptionsAdapter
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.PolylineAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPolylineAnnotationManager
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.navigation.core.MapboxNavigationProvider
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.common.location.Location
import com.mapbox.maps.plugin.locationcomponent.location
import com.mapbox.navigation.base.trip.model.RouteLegProgress
import com.mapbox.navigation.base.trip.model.RouteProgress
import com.mapbox.navigation.core.arrival.ArrivalController
import com.mapbox.navigation.core.arrival.ArrivalObserver
import com.mapbox.navigation.core.directions.session.RoutesObserver
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.ui.maps.location.NavigationLocationProvider
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class AndroidGuidanceRequest : Record {
  @Field var id: String = ""
  @Field var stopId: String = ""
  @Field var originLatitude: Double = Double.NaN
  @Field var originLongitude: Double = Double.NaN
  @Field var stops: List<AndroidGuidanceStop> = emptyList()
  @Field var exclusionPoints: List<AndroidRoutePoint> = emptyList()
  @Field var restrictedRoad: List<AndroidRoutePoint> = emptyList()
}

class AndroidGuidanceStop : Record {
  @Field var id: String = ""
  @Field var latitude: Double = Double.NaN
  @Field var longitude: Double = Double.NaN
}

class FreightIQAndroidNavigationView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  override val shouldUseAndroidLayout = true
  private val container = FrameLayout(context)
  private val onState by EventDispatcher()
  private val map = MapView(context)
  private val lines = map.annotations.createPolylineAnnotationManager()
  private val maneuverArrow = TextView(context).apply {
    textSize = 36f
    gravity = Gravity.CENTER
    setTextColor(Color.WHITE)
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }
  private val instructions = TextView(context).apply {
    setTextColor(Color.WHITE)
    textSize = 23f
    setTypeface(typeface, Typeface.BOLD)
  }
  private val turnDistance = TextView(context).apply {
    setTextColor(Color.WHITE)
    textSize = 18f
  }
  private val guidanceHeader = LinearLayout(context).apply {
    gravity = Gravity.CENTER_VERTICAL
    setPadding(dp(10), dp(10), dp(16), dp(10))
    addView(maneuverArrow, LinearLayout.LayoutParams(dp(54), LayoutParams.WRAP_CONTENT))
    addView(LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      addView(turnDistance)
      addView(instructions)
    }, LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
  }
  private val stepRows = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
  }
  private var displayedSteps: List<LegStep>? = null
  private val stepsScroll = ScrollView(context).apply {
    visibility = GONE
    addView(stepRows)
  }
  private val guidanceToggle = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    isFocusable = true
    addView(guidanceHeader)
    addView(android.view.View(context).apply {
      background = GradientDrawable().apply {
        cornerRadius = dp(2).toFloat()
        setColor(Color.rgb(155, 170, 185))
      }
    }, LinearLayout.LayoutParams(dp(32), dp(4)).apply {
      gravity = Gravity.CENTER_HORIZONTAL
      bottomMargin = dp(8)
    })
    setOnClickListener { showSteps(stepsScroll.visibility != VISIBLE) }
  }
  private val guidance = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    background = roundedSurface(18)
    addView(guidanceToggle)
    addView(stepsScroll, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dp(250)))
  }

  private fun showSteps(expanded: Boolean) {
    stepsScroll.visibility = if (expanded) VISIBLE else GONE
    androidx.core.view.ViewCompat.setStateDescription(guidanceToggle, if (expanded) "Directions expanded" else "Directions collapsed")
  }

  private val tools = LinearLayout(context)

  fun updateBottomInset(inset: Int) {
    val params = tools.layoutParams as FrameLayout.LayoutParams
    params.bottomMargin = dp(inset)
    tools.layoutParams = params
  }

  private var following = true
  private var lastPosition: Point? = null
  private var routePoints: List<Point> = emptyList()

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  private fun roundedSurface(radius: Int) = GradientDrawable().apply {
    cornerRadius = dp(radius).toFloat()
    setColor(Color.rgb(34, 54, 77))
  }

  private fun followLocation() {
    following = true
    overview.text = "↝"
    overview.contentDescription = "Route overview"
    lastPosition?.let {
      map.mapboxMap.setCamera(CameraOptions.Builder().center(it).zoom(15.0).build())
    }
  }

  private val overview = mapButton("↝", "Route overview") {
    if (!following) {
      followLocation()
    } else if (routePoints.size >= 2) {
      following = false
      val padding = EdgeInsets(dp(125).toDouble(), dp(28).toDouble(), dp(140).toDouble(), dp(60).toDouble())
      map.mapboxMap.setCamera(map.mapboxMap.cameraForCoordinates(routePoints, padding, 0.0, 0.0))
      overviewLabelForReturn()
    }
  }

  private fun overviewLabelForReturn() {
    overview.text = "➤"
    overview.contentDescription = "Recenter on my location"
  }

  private fun mapButton(symbol: String, label: String, action: () -> Unit) =
    Button(context).apply {
      text = symbol
      contentDescription = label
      textSize = 22f
      setTextColor(Color.WHITE)
      background = roundedSurface(28)
      setPadding(0, 0, 0, 0)
      setOnClickListener { action() }
    }

  private var request: AndroidGuidanceRequest? = null
  private var activeRequest: AndroidGuidanceRequest? = null
  private var arrived = false
  private var requestedRouteId: Long? = null
  private val navigation by lazy {
    MapboxNavigationProvider.create(NavigationOptions.Builder(context.applicationContext).build())
  }
  private val progressObserver = RouteProgressObserver { progress ->
    val current = activeRequest ?: return@RouteProgressObserver
    val leg = progress.currentLegProgress ?: return@RouteProgressObserver
    if (leg.legIndex != 0) return@RouteProgressObserver
    val step = leg.currentStepProgress
    val maneuver = step?.step?.maneuver()
    val arrow = maneuverIcon(maneuver)
    maneuverArrow.text = arrow
    maneuverArrow.visibility = if (arrow.isEmpty()) GONE else VISIBLE
    turnDistance.text = formatDistance(step?.distanceRemaining?.toDouble())
    turnDistance.visibility = if (turnDistance.text.isEmpty()) GONE else VISIBLE
    instructions.text = step?.step?.let(::stepLabel).orEmpty()
    guidanceToggle.contentDescription = listOf(turnDistance.text, maneuver?.instruction())
      .filterNot { it.isNullOrBlank() }.joinToString(", ")
    guidance.visibility = if (instructions.text.isEmpty()) GONE else VISIBLE

    val routeSteps = progress.navigationRoute.directionsRoute.legs()?.getOrNull(leg.legIndex)?.steps().orEmpty()
    val upcoming = step?.let { routeSteps.drop(it.stepIndex + 1) }.orEmpty()
    updateSteps(upcoming, step?.distanceRemaining?.toDouble())
    publishLegs(current, "progress", progress.navigationRoute, leg.durationRemaining, leg.distanceRemaining.toDouble())
  }

  private fun maneuverIcon(maneuver: StepManeuver?): String {
    return when (maneuver?.type()) {
      "arrive" -> "⚑"
      "exit roundabout", "exit rotary", "roundabout", "rotary", "roundabout turn" -> "⟳"
      else -> when (maneuver?.modifier()) {
        "left" -> "↰"
        "right" -> "↱"
        "slight left", "sharp left" -> "↖"
        "slight right", "sharp right" -> "↗"
        "uturn" -> "↶"
        "straight" -> "↑"
        else -> if (maneuver?.type() == "depart") "↑" else ""
      }
    }
  }

  private fun stepLabel(step: LegStep): String {
    val maneuver = step.maneuver()
    val instruction = maneuver?.instruction().orEmpty()
    val road = step.name().orEmpty().ifBlank { step.ref().orEmpty() }
    // Keep full wording where an arrow alone would lose an exit or other qualifier.
    if (maneuver?.type() !in setOf("turn", "depart", "continue", "new name") ||
      maneuverIcon(maneuver).isEmpty() || road.isBlank()
    ) return instruction.ifBlank { road }
    return if (maneuver?.modifier() == "uturn") "$road · if permitted" else road
  }

  private fun formatDistance(meters: Double?): String = when {
    meters == null || !meters.isFinite() || meters < 0 -> ""
    meters >= 160.9344 -> String.format(java.util.Locale.US, "%.1f mi", meters / 1609.344)
    else -> "${kotlin.math.round(meters * 3.28084 / 10).toInt() * 10} ft"
  }

  private fun updateSteps(upcoming: List<LegStep>, distanceToFirst: Double?) {
    if (displayedSteps != upcoming) {
      displayedSteps = upcoming
      stepRows.removeAllViews()
      if (upcoming.isEmpty()) {
        stepRows.addView(TextView(context).apply {
          text = "No further steps before this stop."
          setTextColor(Color.WHITE)
          setPadding(dp(16), dp(12), dp(16), dp(12))
        })
      }
      upcoming.forEach { step ->
        stepRows.addView(LinearLayout(context).apply {
          gravity = Gravity.CENTER_VERTICAL
          setPadding(dp(12), dp(8), dp(16), dp(8))
          addView(TextView(context).apply {
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
          }, LinearLayout.LayoutParams(dp(64), LayoutParams.WRAP_CONTENT))
          addView(TextView(context).apply {
            text = stepLabel(step)
            textSize = 20f
            setTextColor(Color.WHITE)
          }, LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
          importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
          isFocusable = true
        })
      }
      stepsScroll.scrollTo(0, 0)
    }
    upcoming.forEachIndexed { index, step ->
      val row = stepRows.getChildAt(index) as LinearLayout
      val distance = formatDistance(if (index == 0) distanceToFirst else upcoming[index - 1].distance())
      val icon = maneuverIcon(step.maneuver())
      val indicator = row.getChildAt(0) as TextView
      val label = android.text.SpannableString(listOf(icon, distance).filter(String::isNotBlank).joinToString("\n"))
      if (icon.isNotEmpty()) label.setSpan(android.text.style.AbsoluteSizeSpan(28, true), 0, icon.length, 0)
      if (indicator.text.toString() != label.toString()) indicator.text = label
      row.contentDescription = listOf(distance, step.maneuver()?.instruction())
        .filterNot { it.isNullOrBlank() }.joinToString(", ")
    }
  }

  private val locationProvider = NavigationLocationProvider()
  private val locationObserver = object : LocationObserver {
    override fun onNewRawLocation(rawLocation: Location) = Unit

    override fun onNewLocationMatcherResult(locationMatcherResult: LocationMatcherResult) {
      val location = locationMatcherResult.enhancedLocation
      locationProvider.changePosition(location, locationMatcherResult.keyPoints)
      lastPosition = Point.fromLngLat(location.longitude, location.latitude)
      if (following) map.mapboxMap.setCamera(CameraOptions.Builder().center(lastPosition).build())
    }
  }

  private val arrivalObserver = object : ArrivalObserver {
    override fun onWaypointArrival(routeProgress: RouteProgress) = markArrival()
    override fun onFinalDestinationArrival(routeProgress: RouteProgress) = markArrival()
    override fun onNextRouteLegStart(routeLegProgress: RouteLegProgress) = Unit
  }

  private fun markArrival() {
    val current = activeRequest ?: return
    if (arrived) return
    arrived = true
    emit(current, "arrived")
  }

  private val routesObserver = RoutesObserver { result ->
    lines.deleteAll()
    val current = activeRequest ?: return@RoutesObserver
    val route = result.navigationRoutes.firstOrNull() ?: return@RoutesObserver
    if (conflictsWithRestriction(current, route)) {
      stop()
      emit(current, "error", "No route was found that avoids the marked road section.")
      return@RoutesObserver
    }
    val geometry = route.directionsRoute.geometry()
    if (geometry != null) {
      val points = com.mapbox.geojson.LineString.fromPolyline(geometry, 6).coordinates()
      routePoints = points
      lines.create(PolylineAnnotationOptions().withPoints(points).withLineColor("#43A6FF").withLineWidth(7.0))
    }
  }

  init {
    addView(container, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    container.addView(map, FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    guidance.visibility = GONE
    showSteps(false)
    container.addView(guidance, FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, Gravity.TOP).apply {
      setMargins(dp(12), dp(8), dp(12), 0)
    })
    tools.apply {
      orientation = LinearLayout.VERTICAL
      addView(overview, LinearLayout.LayoutParams(dp(52), dp(52)))
      addView(mapButton("⚑", "Report a condition") {
        activeRequest?.let { emit(it, "reportCondition") }
      }, LinearLayout.LayoutParams(dp(52), dp(52)).apply { topMargin = dp(8) })
    }
    container.addView(tools, FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.END).apply {
      bottomMargin = dp(128)
      marginEnd = dp(12)
    })
    map.location.setLocationProvider(locationProvider)
    map.location.updateSettings {
      enabled = true
      puckBearingEnabled = true
      puckBearing = PuckBearing.COURSE
      locationPuck = LocationPuck2D(bearingImage = ImageHolder.from(locationArrow()))
    }
    val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    var touchX = 0f
    var touchY = 0f
    map.setOnTouchListener { _, event ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          touchX = event.x
          touchY = event.y
        }
        MotionEvent.ACTION_POINTER_DOWN -> pauseFollowing()
        MotionEvent.ACTION_MOVE -> {
          if (kotlin.math.hypot(event.x - touchX, event.y - touchY) > touchSlop) {
            pauseFollowing()
          }
        }
      }
      false
    }
    map.mapboxMap.loadStyle(Style.STANDARD)
  }

  private fun pauseFollowing() {
    if (!following) return
    following = false
    overviewLabelForReturn()
  }

  private fun locationArrow(): Bitmap {
    val size = dp(44)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.scale(size / 44f, size / 44f)
    val arrow = Path().apply {
      moveTo(22f, 4f)
      lineTo(38f, 36f)
      lineTo(22f, 29f)
      lineTo(6f, 36f)
      close()
    }
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      style = Paint.Style.STROKE
      strokeWidth = 5f
      strokeJoin = Paint.Join.ROUND
    }
    canvas.drawPath(arrow, paint)
    paint.style = Paint.Style.FILL
    paint.color = Color.rgb(28, 112, 247)
    canvas.drawPath(arrow, paint)
    return bitmap
  }

  fun setRequest(next: AndroidGuidanceRequest) {
    if (request?.id == next.id) return
    request = next
    if (isAttachedToWindow) start(next)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    request?.let(::start)
  }

  override fun onDetachedFromWindow() {
    stop()
    super.onDetachedFromWindow()
  }

  private fun stop() {
    if (activeRequest == null) return
    activeRequest = null
    requestedRouteId?.let(navigation::cancelRouteRequest)
    requestedRouteId = null
    navigation.unregisterRouteProgressObserver(progressObserver)
    navigation.unregisterLocationObserver(locationObserver)
    navigation.unregisterArrivalObserver(arrivalObserver)
    navigation.unregisterRoutesObserver(routesObserver)
    navigation.setRerouteOptionsAdapter(null)
    navigation.setArrivalController()
    navigation.stopTripSession()
    navigation.setNavigationRoutes(emptyList())
  }

  private fun start(next: AndroidGuidanceRequest) {
    stop()
    val restricted = next.restrictedRoad.isNotEmpty() || next.exclusionPoints.isNotEmpty()
    if (restricted && (next.restrictedRoad.size < 2 || next.exclusionPoints.size !in 1..50)) {
      emit(next, "error", "The saved road restriction is incomplete. Review it before starting navigation.")
      return
    }
    val origin = AndroidRoutePoint().apply {
      latitude = next.originLatitude
      longitude = next.originLongitude
    }
    val stops = next.stops.map { stop ->
      AndroidRoutePoint().apply {
        latitude = stop.latitude
        longitude = stop.longitude
      }
    }
    try {
      val routeStops = if (restricted) stops.take(1) else stops
      val exclusions = next.exclusionPoints.joinToString(",") {
        val point = it.toPoint()
        "point(${point.longitude()} ${point.latitude()})"
      }
      val baseOptions = androidRouteOptions(origin, routeStops)
      val options = if (restricted) baseOptions.toBuilder().exclude(exclusions).build() else baseOptions
      if (restricted) {
        navigation.setRerouteOptionsAdapter(object : RerouteOptionsAdapter {
          override fun onRouteOptions(routeOptions: RouteOptions): RouteOptions =
            routeOptions.toBuilder().exclude(exclusions).build()
        })
      }
      activeRequest = next
      arrived = false
      routePoints = emptyList()
      lastPosition = origin.toPoint()
      followLocation()
      guidance.visibility = GONE
      showSteps(false)
      lines.deleteAll()
      map.mapboxMap.setCamera(CameraOptions.Builder().center(origin.toPoint()).zoom(15.0).build())
      navigation.registerRouteProgressObserver(progressObserver)
      navigation.registerLocationObserver(locationObserver)
      navigation.registerArrivalObserver(arrivalObserver)
      navigation.registerRoutesObserver(routesObserver)
      navigation.setArrivalController(object : ArrivalController {
        override fun navigateNextRouteLeg(routeLegProgress: RouteLegProgress): Boolean = false
      })
      requestedRouteId = navigation.requestRoutes(options, object : NavigationRouterCallback {
        override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) = Unit

        override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {
          if (activeRequest === next) emit(next, "error", "Could not calculate directions. Try again.")
        }

        override fun onRoutesReady(routes: List<NavigationRoute>, routerOrigin: String) {
          if (activeRequest !== next) return
          val route = routes.firstOrNull()
          if (route == null) {
            emit(next, "error", "No directions found. Try again.")
            return
          }
          if (conflictsWithRestriction(next, route)) {
            stop()
            emit(next, "error", "No route was found that avoids the marked road section.")
            return
          }
          navigation.setNavigationRoutes(listOf(route))
          navigation.startTripSession()
          publishLegs(next, "started", route)
        }
      })
    } catch (error: Exception) {
      stop()
      emit(next, "error", "Could not start Android navigation. Try again.")
    }
  }

  private fun conflictsWithRestriction(request: AndroidGuidanceRequest, route: NavigationRoute): Boolean {
    if (request.exclusionPoints.isEmpty()) return false
    val geometry = route.directionsRoute.geometry() ?: return true
    val points = LineString.fromPolyline(geometry, 6).coordinates()
    if (points.size < 2) return true
    return request.exclusionPoints.any {
      val point = it.toPoint()
      val closest = TurfMisc.nearestPointOnLine(point, points, "meters").geometry() as? Point
      closest == null || TurfMeasurement.distance(point, closest, "meters") <= 8
    }
  }

  private fun publishLegs(
    current: AndroidGuidanceRequest,
    state: String,
    route: NavigationRoute,
    remainingSeconds: Double? = null,
    remainingMeters: Double? = null,
  ) {
    val legs = route.directionsRoute.legs().orEmpty().zip(current.stops).mapIndexed { index, (leg, stop) ->
      mapOf(
        "stopId" to stop.id,
        "seconds" to (if (index == 0) remainingSeconds ?: leg.duration() else leg.duration()),
        "meters" to (if (index == 0) remainingMeters ?: leg.distance() else leg.distance()),
      )
    }
    emit(current, state, legs = legs)
  }

  private fun emit(
    current: AndroidGuidanceRequest,
    state: String,
    message: String = "",
    legs: List<Map<String, Any?>> = emptyList(),
  ) {
    onState(mapOf("requestId" to current.id, "stopId" to current.stopId, "state" to state, "message" to message, "legs" to legs))
  }
}
