import ActivityKit
import Foundation
import UIKit

@MainActor
final class NavigationLiveActivity {
  typealias State = NavigationActivityAttributes.ContentState
  private var activity: Activity<NavigationActivityAttributes>?
  private var started = false

  static var isDevelopmentBuild: Bool {
    Bundle.main.bundleIdentifier?.hasSuffix(".dev") == true
  }

  static func clearDevelopmentActivities() {
    guard isDevelopmentBuild else { return }
    dismiss(Activity<NavigationActivityAttributes>.activities)
  }

  private static func dismiss(_ activities: [Activity<NavigationActivityAttributes>]) {
    // Capture before scheduling so cleanup cannot end a newly started activity.
    for previous in activities {
      Task { await previous.end(nil, dismissalPolicy: .immediate) }
    }
  }

  func start() {
    guard !Self.isDevelopmentBuild else {
      end()
      return
    }
    guard !started, UIApplication.shared.applicationState == .active,
          ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    let scheme = "mfi"
    guard let url = URL(string: "\(scheme)://active-navigation?fromLiveActivity=1") else { return }
    let state = State(instruction: "Navigation active", arrow: "location.fill", distance: "", eta: nil)
    Self.dismiss(Activity<NavigationActivityAttributes>.activities)
    activity = try? Activity.request(
      attributes: NavigationActivityAttributes(returnURL: url),
      content: ActivityContent(state: state, staleDate: Date().addingTimeInterval(30))
    )
    started = activity != nil
  }

  func update(_ state: State) {
    guard let activity, activity.activityState == .active || activity.activityState == .stale else { return }
    // Refresh the stale deadline even when the instruction has stayed the same.
    let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(30))
    Task { await activity.update(content) }
  }

  func end() {
    started = false
    var activities = Activity<NavigationActivityAttributes>.activities
    if let activity, !activities.contains(where: { $0.id == activity.id }) {
      activities.append(activity)
    }
    self.activity = nil
    Self.dismiss(activities)
  }
}
