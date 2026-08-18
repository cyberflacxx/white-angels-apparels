import "package:flutter_test/flutter_test.dart";
import "package:white_angels_pos/src/models.dart";
import "package:white_angels_pos/src/services/pdf_report_service.dart";

void main() {
  test("pdf report service creates the expected file name", () {
    const report = PosSalesReport(
      from: "2026-08-18",
      to: "2026-08-18",
      summary: PosReportSummary(
        totalRevenue: 120,
        salesCount: 2,
        unitsSold: 4,
        averageSale: 60,
      ),
      dailyTrend: [],
      sales: [],
    );

    final service = PdfReportService();
    expect(
      service.buildFileName(report),
      "white-angels-sales-2026-08-18-to-2026-08-18.pdf",
    );
  });
}
