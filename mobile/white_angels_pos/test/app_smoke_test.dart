import "package:flutter_test/flutter_test.dart";
import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:white_angels_pos/main.dart";
import "package:white_angels_pos/src/services/api_client.dart";
import "package:white_angels_pos/src/services/pdf_report_service.dart";
import "package:white_angels_pos/src/state/controllers.dart";

void main() {
  testWidgets("renders the login screen when no session is restored", (
    tester,
  ) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider(create: (_) => ApiClient()),
          Provider(create: (_) => PdfReportService()),
          ChangeNotifierProvider(
            create: (context) => SessionController(context.read<ApiClient>()),
          ),
          ChangeNotifierProvider(create: (_) => SaleCartController()),
          ChangeNotifierProvider(create: (_) => RefreshController()),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.pump();

    expect(find.text("White Angels POS"), findsOneWidget);
    expect(find.text("Login"), findsOneWidget);
  });
}
