import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:travelai/features/auth/screens/login_screen.dart';
import 'package:travelai/l10n/app_localizations.dart';

void main() {
  testWidgets('LoginScreen hiển thị đúng nút đăng nhập Google, không có form email/password', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          locale: Locale('vi'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: LoginScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Đăng nhập với Google'), findsOneWidget);
    expect(find.byType(TextFormField), findsNothing);
  });
}
