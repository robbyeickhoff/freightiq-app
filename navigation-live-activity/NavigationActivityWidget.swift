import ActivityKit
import SwiftUI
import WidgetKit

@main
struct NavigationActivityWidget: Widget {
  private let amber = Color(red: 1, green: 0.82, blue: 0.49)

  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NavigationActivityAttributes.self) { context in
      guidance(context, prioritizeDistance: true)
        .padding()
        .widgetURL(context.attributes.returnURL)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.bottom) { guidance(context) }
      } compactLeading: {
        maneuverIcon(context)
      } compactTrailing: {
        Text(context.isStale ? "—" : context.state.distance)
          .font(.system(size: 15, weight: .bold, design: .rounded))
          .monospacedDigit()
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      } minimal: {
        maneuverIcon(context)
      }
      .widgetURL(context.attributes.returnURL)
    }
  }

  private func maneuverIcon(_ context: ActivityViewContext<NavigationActivityAttributes>) -> some View {
    Image(systemName: context.isStale ? "location.slash" : context.state.arrow)
      .foregroundStyle(amber)
  }

  private func guidance(
    _ context: ActivityViewContext<NavigationActivityAttributes>,
    prioritizeDistance: Bool = false
  ) -> some View {
    HStack(spacing: 12) {
      maneuverIcon(context)
        .font(.title)
      VStack(alignment: .leading) {
        HStack(alignment: .firstTextBaseline) {
          Text(context.isStale ? "Guidance unavailable" : context.state.instruction)
            .font(.headline)
            .lineLimit(2)
          if prioritizeDistance && !context.isStale && !context.state.distance.isEmpty {
            Text(context.state.distance)
              .font(.title3.bold())
              .fixedSize()
          }
        }
        if !context.isStale {
          HStack {
            if !prioritizeDistance && !context.state.distance.isEmpty {
              Text(context.state.distance)
            }
            if let eta = context.state.eta {
              Text("ETA")
              Text(eta, style: .time)
            }
          }
          .font(prioritizeDistance ? .footnote : .subheadline)
        }
      }
      Spacer(minLength: 0)
    }
  }
}
