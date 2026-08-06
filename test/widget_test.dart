import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:travelai/main.dart';

void main() {
  testWidgets('App khởi động và hiển thị màn splash', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    expect(find.text('Trợ lý du lịch AI'), findsOneWidget);
    expect(find.byIcon(Icons.travel_explore), findsOneWidget);
  });
}
