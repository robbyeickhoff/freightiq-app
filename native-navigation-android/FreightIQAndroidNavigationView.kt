package expo.modules.freightiqnavigation

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
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
import com.mapbox.maps.plugin.annotation.generated.CircleAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createCircleAnnotationManager
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
  @Field var preview: Boolean = false
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
  private val stopMarkers = map.annotations.createCircleAnnotationManager()
  private val currentRoad = TextView(context).apply {
    textSize = 17f
    setTextColor(Color.WHITE)
    gravity = Gravity.CENTER
    maxLines = 1
    ellipsize = android.text.TextUtils.TruncateAt.END
    setPadding(dp(14), dp(7), dp(14), dp(7))
    background = roundedSurface(16)
    visibility = GONE
  }

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
  private val guidance = object : LinearLayout(context) {
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
      if (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.UNSPECIFIED) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        return
      }
      val halfScreen = MeasureSpec.getSize(heightMeasureSpec) / 2
      super.onMeasure(widthMeasureSpec, MeasureSpec.makeMeasureSpec(halfScreen, MeasureSpec.AT_MOST))
      // Keep the header readable even when large system text takes more space.
      if (measuredHeight < guidanceToggle.measuredHeight) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
      }
    }
  }.apply {
    orientation = LinearLayout.VERTICAL
    background = roundedSurface(18)
    addView(guidanceToggle)
    addView(stepsScroll, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
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
    val roadParams = currentRoad.layoutParams as FrameLayout.LayoutParams
    roadParams.bottomMargin = dp(inset)
    currentRoad.layoutParams = roadParams
  }

  private val preferences = context.getSharedPreferences("navigation", Context.MODE_PRIVATE)
  private var headingUp = preferences.getBoolean("headingUp", true)
  private var course = 0.0
  private var following = true

  private fun updateFollowingCamera(recenter: Boolean = false) {
    val position = lastPosition ?: return
    val camera = CameraOptions.Builder().center(position).bearing(if (headingUp) course else 0.0)
    if (recenter) camera.zoom(15.0)
    map.mapboxMap.setCamera(camera.build())
  }

  private val orientationButton = mapButton("↑", "Map orientation") {
    headingUp = !headingUp
    preferences.edit().putBoolean("headingUp", headingUp).apply()
    updateOrientationButton()
    if (following) updateFollowingCamera()
  }

  private fun updateOrientationButton() {
    orientationButton.text = if (headingUp) "↑" else "N"
    orientationButton.contentDescription =
      if (headingUp) "Heading up. Switch to north up" else "North up. Switch to heading up"
  }
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
    updateFollowingCamera(recenter = true)
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
  private var firstNearbyFix: Long? = null
  private var lastNearbyFix: Long? = null
  private var requestedRouteId: Long? = null
  private val navigation by lazy {
    MapboxNavigationProvider.create(NavigationOptions.Builder(context.applicationContext).build())
  }
  private val notificationManager = context.getSystemService(NotificationManager::class.java)
  private var lastNotificationText: Pair<String, String>? = null

  private fun publishTurnNotification(instruction: String, distance: String) {
    if (instruction.isBlank() || arrived) return
    if (Build.VERSION.SDK_INT >= 33 &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    if (lastNotificationText == (instruction to distance)) return
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val reopen = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE)
    val channel = "freightiq_active_guidance"
    notificationManager.createNotificationChannel(
      NotificationChannel(channel, "Active navigation", NotificationManager.IMPORTANCE_LOW)
    )
    val notification = Notification.Builder(context, channel)
      .setSmallIcon(android.R.drawable.ic_menu_directions)
      .setContentTitle(instruction)
      .setContentText(distance)
      .setContentIntent(reopen)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setCategory(Notification.CATEGORY_NAVIGATION)
    if (Build.VERSION.SDK_INT >= 36) {
      notification.addExtras(android.os.Bundle().apply { putBoolean("android.requestPromotedOngoing", true) })
      if (distance.isNotBlank()) notification.setShortCriticalText(distance)
    }
    notificationManager.notify(9201, notification.build())
    lastNotificationText = instruction to distance
  }

  private fun clearTurnNotification() {
    notificationManager.cancel(9201)
    lastNotificationText = null
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
    publishTurnNotification(maneuver?.instruction().orEmpty(), turnDistance.text.toString())
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
    override fun onNewRawLocation(rawLocation: Location) {
      val destination = activeRequest?.stops?.firstOrNull() ?: return
      if (arrived) return
      val timestamp = rawLocation.timestamp
      val position = Point.fromLngLat(rawLocation.longitude, rawLocation.latitude)
      val target = Point.fromLngLat(destination.longitude, destination.latitude)
      if (System.currentTimeMillis() - timestamp !in 0L..5_000L ||
        (rawLocation.horizontalAccuracy ?: Double.NaN) !in 0.0..30.0 ||
        (rawLocation.speed ?: Double.NaN) !in 0.0..2.0 ||
        TurfMeasurement.distance(position, target, "meters") > 75.0
      ) {
        firstNearbyFix = null
        lastNearbyFix = null
        return
      }
      lastNearbyFix?.let { previous ->
        if (timestamp <= previous) return
        if (timestamp - previous > 5_000L) firstNearbyFix = null
      }
      val first = firstNearbyFix ?: timestamp.also { firstNearbyFix = it }
      lastNearbyFix = timestamp
      if (timestamp - first >= 5_000L) markArrival("arrivedNearby")
    }

    override fun onNewLocationMatcherResult(locationMatcherResult: LocationMatcherResult) {
      val roadName = locationMatcherResult.road?.components
        ?.firstNotNullOfOrNull { it.text?.trim()?.takeIf(String::isNotEmpty) }
      if (currentRoad.text.toString() != roadName.orEmpty()) {
        currentRoad.text = roadName
        currentRoad.visibility = if (roadName == null) GONE else VISIBLE
      }
      val location = locationMatcherResult.enhancedLocation
      locationProvider.changePosition(location, locationMatcherResult.keyPoints)
      lastPosition = Point.fromLngLat(location.longitude, location.latitude)
      location.bearing?.takeIf { it.isFinite() }?.let { course = it }
      if (following) updateFollowingCamera()
    }
  }

  private val arrivalObserver = object : ArrivalObserver {
    override fun onWaypointArrival(routeProgress: RouteProgress) = markArrival()
    override fun onFinalDestinationArrival(routeProgress: RouteProgress) = markArrival()
    override fun onNextRouteLegStart(routeLegProgress: RouteLegProgress) = Unit
  }

  private fun markArrival(state: String = "arrived") {
    val current = activeRequest ?: return
    if (arrived) return
    arrived = true
    clearTurnNotification()
    emit(current, state)
  }

  private val routesObserver = RoutesObserver { result ->
    lines.deleteAll()
    stopMarkers.deleteAll()
    val current = activeRequest ?: return@RoutesObserver
    val route = result.navigationRoutes.firstOrNull() ?: return@RoutesObserver
    if (conflictsWithRestriction(current, route)) {
      stop()
      emit(current, "error", "No route was found that avoids the marked road section.")
      return@RoutesObserver
    }
    val legCount = route.directionsRoute.legs().orEmpty().size
    stopMarkers.create(current.stops.take(legCount).map { stop ->
      CircleAnnotationOptions()
        .withPoint(Point.fromLngLat(stop.longitude, stop.latitude))
        .withCircleRadius(7.0)
        .withCircleColor("#3DB840")
        .withCircleStrokeColor("#FFFFFF")
        .withCircleStrokeWidth(2.0)
    })
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
      updateOrientationButton()
      addView(orientationButton, LinearLayout.LayoutParams(dp(52), dp(52)).apply { bottomMargin = dp(8) })
      addView(overview, LinearLayout.LayoutParams(dp(52), dp(52)))
      addView(mapButton("⚑", "Report a condition") {
        activeRequest?.let { emit(it, "reportCondition") }
      }, LinearLayout.LayoutParams(dp(52), dp(52)).apply { topMargin = dp(8) })
    }
    container.addView(tools, FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.END).apply {
      bottomMargin = dp(128)
      marginEnd = dp(12)
    })
    container.addView(currentRoad, FrameLayout.LayoutParams(
      LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
    ).apply {
      setMargins(dp(72), 0, dp(72), dp(128))
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

  private var pendingRoutes = emptyList<NavigationRoute>()

  fun selectRoute(choice: String) {
    val request = activeRequest ?: return
    val prefix = request.id + "|"
    if (!choice.startsWith(prefix)) return
    val index = choice.removePrefix(prefix).toIntOrNull() ?: return
    val route = pendingRoutes.getOrNull(index) ?: return
    pendingRoutes = emptyList()
    startGuidance(request, route)
  }

  private fun startGuidance(request: AndroidGuidanceRequest, route: NavigationRoute) {
    navigation.setNavigationRoutes(listOf(route))
    navigation.startTripSession()
    publishLegs(request, "started", route)
  }

  private fun stop() {
    pendingRoutes = emptyList()
    if (activeRequest == null) return
    activeRequest = null
    currentRoad.text = null
    currentRoad.visibility = GONE
    stopMarkers.deleteAll()
    clearTurnNotification()
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
      val baseOptions = androidRouteOptions(origin, routeStops, next.preview)
      val options = if (restricted) baseOptions.toBuilder().exclude(exclusions).build() else baseOptions
      if (restricted) {
        navigation.setRerouteOptionsAdapter(object : RerouteOptionsAdapter {
          override fun onRouteOptions(routeOptions: RouteOptions): RouteOptions =
            routeOptions.toBuilder().exclude(exclusions).build()
        })
      }
      activeRequest = next
      arrived = false
      firstNearbyFix = null
      lastNearbyFix = null
      routePoints = emptyList()
      course = 0.0
      lastPosition = origin.toPoint()
      followLocation()
      guidance.visibility = GONE
      showSteps(false)
      lines.deleteAll()
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
          if (!next.preview && conflictsWithRestriction(next, route)) {
            stop()
            emit(next, "error", "No route was found that avoids the marked road section.")
            return
          }
          if (!next.preview) {
            startGuidance(next, route)
            return
          }
          pendingRoutes = routes.filterNot { conflictsWithRestriction(next, it) }
          val choices = pendingRoutes.mapIndexedNotNull { index, candidate ->
            val directions = candidate.directionsRoute
            val geometry = directions.geometry() ?: return@mapIndexedNotNull null
            val coordinates = LineString.fromPolyline(geometry, 6).coordinates()
            if (coordinates.size < 2) return@mapIndexedNotNull null
            mapOf(
              "index" to index, "seconds" to directions.duration(), "meters" to directions.distance(),
              "coordinates" to coordinates.map { mapOf("latitude" to it.latitude(), "longitude" to it.longitude()) },
            )
          }
          if (choices.isEmpty()) {
            stop()
            emit(next, "error", "No route is available with the current road restrictions.")
            return
          }
          onState(mapOf("requestId" to next.id, "stopId" to next.stopId, "state" to "preview", "choices" to choices))
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
