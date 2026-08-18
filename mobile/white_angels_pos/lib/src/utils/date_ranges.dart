import "package:intl/intl.dart";

enum ReportPreset { today, yesterday, thisWeek, thisMonth, custom }

class DateRangeValue {
  const DateRangeValue({required this.from, required this.to});

  final String from;
  final String to;
}

DateRangeValue resolvePresetRange(ReportPreset preset, {DateTime? now}) {
  final localNow = now ?? DateTime.now();
  final today = DateTime(localNow.year, localNow.month, localNow.day);
  switch (preset) {
    case ReportPreset.today:
      return _asRange(today, today);
    case ReportPreset.yesterday:
      final day = today.subtract(const Duration(days: 1));
      return _asRange(day, day);
    case ReportPreset.thisWeek:
      final start = today.subtract(Duration(days: today.weekday - 1));
      return _asRange(start, today);
    case ReportPreset.thisMonth:
      final start = DateTime(today.year, today.month, 1);
      return _asRange(start, today);
    case ReportPreset.custom:
      return _asRange(today, today);
  }
}

String formatDateLabel(DateTime date) => DateFormat("dd MMM yyyy").format(date);

DateRangeValue customRange(DateTime start, DateTime end) => _asRange(
  DateTime(start.year, start.month, start.day),
  DateTime(end.year, end.month, end.day),
);

DateRangeValue _asRange(DateTime from, DateTime to) {
  final formatter = DateFormat("yyyy-MM-dd");
  return DateRangeValue(from: formatter.format(from), to: formatter.format(to));
}
