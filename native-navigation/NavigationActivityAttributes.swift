import ActivityKit
import Foundation

struct NavigationActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var instruction: String
    var arrow: String
    var distance: String
    var eta: Date?
  }

  let returnURL: URL
}
