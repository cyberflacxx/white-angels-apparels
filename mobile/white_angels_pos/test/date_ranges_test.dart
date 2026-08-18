import "package:flutter_test/flutter_test.dart";
import "package:white_angels_pos/src/utils/date_ranges.dart";

void main() {
  test("today preset resolves a same-day range", () {
    final range = resolvePresetRange(
      ReportPreset.today,
      now: DateTime(2026, 8, 18, 12),
    );

    expect(range.from, "2026-08-18");
    expect(range.to, "2026-08-18");
  });

  test("this week preset starts on Monday", () {
    final range = resolvePresetRange(
      ReportPreset.thisWeek,
      now: DateTime(2026, 8, 19),
    );

    expect(range.from, "2026-08-17");
    expect(range.to, "2026-08-19");
  });
}
