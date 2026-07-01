import 'package:flutter_test/flutter_test.dart';

import 'package:milk_packet_counter/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const MilkPacketCounterApp());
    await tester.pumpAndSettle();

    // Verify the app title is shown
    expect(find.text('Milk Packet Counter'), findsWidgets);
  });
}
