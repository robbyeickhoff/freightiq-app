package expo.modules.freightiqnavigation

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.mapbox.common.Cancelable
import com.mapbox.common.TileStore
import com.mapbox.common.TileRegionLoadOptions
import com.mapbox.geojson.Geometry
import com.mapbox.geojson.MultiPolygon
import com.mapbox.geojson.Point
import com.mapbox.geojson.Polygon
import com.mapbox.maps.MapboxMapsOptions
import com.mapbox.maps.OfflineManager
import com.mapbox.maps.Style
import com.mapbox.maps.StylePackLoadOptions
import com.mapbox.maps.TilesetDescriptorOptions
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.options.RoutingTilesOptions
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.MapboxNavigationProvider
import expo.modules.kotlin.Promise
import org.json.JSONArray
import java.io.File
import java.util.UUID

internal class FreightIQOfflineRoute private constructor(context: Context) {
  companion object {
    private var instance: FreightIQOfflineRoute? = null
    fun get(context: Context): FreightIQOfflineRoute = instance ?: FreightIQOfflineRoute(context.applicationContext).also { instance = it }
  }
  private val main = Handler(Looper.getMainLooper())
  private val prefs = context.getSharedPreferences("freightiq-offline-route", Context.MODE_PRIVATE)
  val store = run {
    val path = File(context.filesDir, "FreightIQNavigationTiles").apply { mkdirs() }.absolutePath
    check(TileStore.setRootPath(path).error == null) { "Could not configure offline map storage." }
    TileStore.create()
  }
  private val manager = OfflineManager()
  private val styles = listOf(Style.LIGHT, Style.DARK)
  private val options = NavigationOptions.Builder(context).routingTilesOptions(
    RoutingTilesOptions.Builder().tileStore(store).tilesProfile("driving-traffic").build()
  ).build()
  val navigation: MapboxNavigation get() = if (MapboxNavigationProvider.isCreated()) MapboxNavigationProvider.retrieve() else MapboxNavigationProvider.create(options)
  private var operation: Cancelable? = null
  private var pending: String? = null
  private var cancelled = false
  private var removing = false
  init {
    MapboxMapsOptions.tileStore = store
    prefs.getString("pending", null)?.let { if (it != prefs.getString("ready", null)) store.removeTileRegion(it) }
    prefs.edit().remove("pending").apply()
  }
  private fun bounds(): List<Double>? = try {
    prefs.getString("bounds", null)?.let { raw -> JSONArray(raw).let { a -> (0 until a.length()).map { a.getDouble(it) }.takeIf { it.size == 4 } } }
  } catch (_: Exception) { null }
  private fun checkStyles(done: (Boolean) -> Unit) {
    manager.getAllStylePacks { result -> main.post {
      done(result.value?.let { packs -> styles.all { style -> packs.any { it.styleURI == style && it.requiredResourceCount > 0 && it.completedResourceCount == it.requiredResourceCount } } } == true)
    } }
  }
  fun coverage(promise: Promise) {
    val id = prefs.getString("ready", null)
    val saved = bounds()
    if (id == null || saved == null) { promise.resolve(null); return }
    store.getTileRegion(id) { result -> main.post {
      val region = result.value
      if (region == null || region.requiredResourceCount <= 0 || region.completedResourceCount != region.requiredResourceCount) promise.resolve(null)
      else checkStyles { complete -> promise.resolve(if (complete && prefs.getString("ready", null) == id) prefs.getString("geometryJSON", null)?.let { mapOf("bounds" to saved, "geometryJSON" to it) } ?: saved else null) }
    } }
  }
  fun download(bounds: List<Double>, geometryJSON: String, promise: Promise, progress: (Double) -> Unit) {
    if (pending != null || removing) { promise.reject("BUSY", "Wait for the current offline action to finish.", null); return }
    if (bounds.size != 4 || bounds.any { !it.isFinite() } || bounds[0] !in -180.0..180.0 || bounds[2] !in -180.0..180.0 || bounds[1] !in -85.0..85.0 || bounds[3] !in -85.0..85.0 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
      promise.reject("COVERAGE", "Could not prepare offline coverage for this route.", null); return
    }
    val geometry: Geometry = try {
      when (org.json.JSONObject(geometryJSON).getString("type")) {
        "Polygon" -> Polygon.fromJson(geometryJSON)
        "MultiPolygon" -> MultiPolygon.fromJson(geometryJSON)
        else -> throw IllegalArgumentException()
      }
    } catch (_: Exception) { promise.reject("COVERAGE", "Could not prepare offline road coverage.", null); return }
    val id = "freightiq-route-${UUID.randomUUID()}"
    pending = id; cancelled = false
    prefs.edit().putString("pending", id).apply()
    val maps = styles.map { style -> manager.createTilesetDescriptor(TilesetDescriptorOptions.Builder()
      .styleURI(style).minZoom(6).maxZoom(14).stylePackOptions(StylePackLoadOptions.Builder().build()).build()) }
    val load = TileRegionLoadOptions.Builder().geometry(geometry)
      .descriptors(maps + navigation.tilesetDescriptorFactory.getLatest()).acceptExpired(false).build()
    operation = store.loadTileRegion(id, load, { state -> main.post {
      if (pending == id && state.requiredResourceCount > 0) progress(state.completedResourceCount.toDouble() / state.requiredResourceCount)
    } }, { result -> main.post {
      val region = result.value
      result.error?.let { error ->
        android.util.Log.w("FreightIQOffline", "Download failed: ${error.type}: ${error.message}")
      }
      if (region == null || region.requiredResourceCount <= 0 || region.completedResourceCount != region.requiredResourceCount) {
        val message = when (result.error?.type?.name.orEmpty()) {
          "DISK_FULL" -> "Not enough storage for this offline route. Free up space and try again."
          "TILE_COUNT_EXCEEDED" -> "This offline area exceeds the map provider’s download limit. Try a smaller route."
          else -> "Offline road data could not be downloaded. Check your connection and try again."
        }
        finish(id, bounds, geometryJSON, false, message, promise)
      } else checkStyles { ready -> finish(id, bounds, geometryJSON, ready, "Offline map resources could not be verified. Please try again.", promise) }
    } })
  }
  private fun finish(id: String, bounds: List<Double>, geometryJSON: String, ready: Boolean, message: String, promise: Promise) {
    if (pending != id) return
    val success = ready && !cancelled
    if (success) {
      val previous = prefs.getString("ready", null)
      prefs.edit().putString("ready", id).putString("bounds", JSONArray(bounds).toString()).putString("geometryJSON", geometryJSON).remove("pending").apply()
      previous?.let { store.removeTileRegion(it) }
    } else { store.removeTileRegion(id); prefs.edit().remove("pending").apply() }
    pending = null; operation = null
    if (success) promise.resolve(null) else promise.reject("DOWNLOAD", if (cancelled) "Offline download cancelled." else message, null)
  }
  fun cancel() { if (pending != null) { cancelled = true; operation?.cancel() } }
  fun remove(promise: Promise) {
    if (pending != null || removing) { promise.reject("BUSY", "Wait for the current offline action to finish.", null); return }
    val id = prefs.getString("ready", null) ?: run { promise.resolve(null); return }
    removing = true
    store.removeTileRegion(id) { result -> main.post {
      removing = false
      if (result.isValue) { prefs.edit().remove("ready").remove("bounds").remove("geometryJSON").apply(); promise.resolve(null) }
      else promise.reject("REMOVE", "Could not remove the offline download.", null)
    } }
  }
}
