package expo.modules.freightiq3dyardview

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class YardCoordinates : Record {
  @Field val stopLatitude: Double = 0.0
  @Field val stopLongitude: Double = 0.0
  @Field val deliveryZoneLatitude: Double = 0.0
  @Field val deliveryZoneLongitude: Double = 0.0
}
