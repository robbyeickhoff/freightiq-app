package expo.modules.freightiqnavigation

import com.mapbox.geojson.Point
import com.mapbox.api.directions.v5.DirectionsCriteria
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.navigation.base.extensions.applyDefaultNavigationOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AndroidRoutePoint : Record {
  @Field var latitude: Double = Double.NaN
  @Field var longitude: Double = Double.NaN

  fun toPoint(): Point {
    require(latitude in -90.0..90.0 && longitude in -180.0..180.0) {
      "A route stop has invalid coordinates."
    }
    return Point.fromLngLat(longitude, latitude)
  }
}

internal fun androidRouteOptions(origin: AndroidRoutePoint, stops: List<AndroidRoutePoint>, alternatives: Boolean = false): RouteOptions {
  require(stops.size in 1..24) { "Navigation requires between 1 and 24 stops." }
  return RouteOptions.builder()
    .applyDefaultNavigationOptions(DirectionsCriteria.PROFILE_DRIVING_TRAFFIC)
    .coordinatesList(listOf(origin.toPoint()) + stops.map { it.toPoint() })
    .alternatives(alternatives)
    .build()
}

class FreightIQAndroidRouteModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FreightIQAndroidRouteModule")
    Constant("available") { true }
    View(FreightIQAndroidNavigationView::class) {
      Events("onState")
      Prop("bottomInset") { view: FreightIQAndroidNavigationView, inset: Int ->
        view.updateBottomInset(inset)
      }
      Prop("routeChoice") { view: FreightIQAndroidNavigationView, choice: String ->
        view.selectRoute(choice)
      }
      Prop("request") { view: FreightIQAndroidNavigationView, request: AndroidGuidanceRequest ->
        view.setRequest(request)
      }
    }
  }
}
