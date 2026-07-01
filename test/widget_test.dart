import 'package:flutter_test/flutter_test.dart';

import 'package:milk_packet_counter/main.dart';

void main() {
  testWidgets('App renders home screen with title', (WidgetTester tester) async {
    await tester.pumpWidget(const MilkPacketCounterApp());
    await tester.pumpAndSettle();

    // Verify the app title is shown
    expect(find.text('Milk Tray Scan'), findsOneWidget);

    // Verify the two main action buttons are present
    expect(find.text('Start Counting'), findsOneWidget);
    expect(find.text('View History'), findsOneWidget);

    // Verify the "How it works" section is shown
    expect(find.text('How it works'), findsOneWidget);
  });
}
