import ActivityKit
import Foundation
import UIKit

@MainActor
final class NavigationLiveActivity {
  typealias State = NavigationActivityAttributes.ContentState
  private var activity: Activity<NavigationActivityAttributes>?
  private var started = false

  func start() {
    guard !started, UIApplication.shared.applicationState == .active,
          ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    started = true
    let scheme = Bundle.main.bundleIdentifier?.hasSuffix(".dev") == true ? "mfi-dev" : "mfi"
    guard let url = URL(string: "\(scheme)://active-navigation?fromLiveActivity=1") else { return }
    let state = State(instruction: "Navigation active", arrow: "location.fill", distance: "", eta: nil)
    for previous in Activity<NavigationActivityAttributes>.activities {
      Task { await previous.end(nil, dismissalPolicy: .immediate) }
    }
    activity = try? Activity.request(
      attributes: NavigationActivityAttributes(returnURL: url),
      content: ActivityContent(state: state, staleDate: Date().addingTimeInterval(30))
    )
  }

  func update(_ state: State) {
    guard let activity, activity.activityState == .active || activity.activityState == .stale else { return }
    // Refresh the stale deadline even when the instruction has stayed the same.
    let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(30))
    Task { await activity.update(content) }
  }

  func end() {
    started = false
    guard let activity else { return }
    self.activity = nil
    Task { await activity.end(nil, dismissalPolicy: .immediate) }
  }
}
