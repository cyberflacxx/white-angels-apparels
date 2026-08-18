class AdminUser {
  const AdminUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: json["id"] as String? ?? "",
      email: json["email"] as String? ?? "",
      fullName:
          json["fullName"] as String? ?? json["full_name"] as String? ?? "",
      role: json["role"] as String? ?? "ADMIN",
    );
  }
}

class AuthSession {
  const AuthSession({required this.token, required this.admin});

  final String token;
  final AdminUser admin;
}

class PosProduct {
  const PosProduct({
    required this.id,
    required this.name,
    required this.sku,
    required this.sellingPrice,
    required this.availableStock,
    required this.status,
    required this.primaryImage,
  });

  final String id;
  final String name;
  final String sku;
  final double sellingPrice;
  final int availableStock;
  final String status;
  final String primaryImage;

  factory PosProduct.fromJson(Map<String, dynamic> json) {
    return PosProduct(
      id: json["id"] as String? ?? "",
      name: json["name"] as String? ?? "",
      sku: json["sku"] as String? ?? "",
      sellingPrice: _toDouble(json["sellingPrice"]),
      availableStock: _toInt(json["availableStock"]),
      status: json["status"] as String? ?? "",
      primaryImage: json["primaryImage"] as String? ?? "",
    );
  }
}

class PosTrendPoint {
  const PosTrendPoint({
    required this.date,
    required this.revenue,
    required this.salesCount,
    this.unitsSold = 0,
  });

  final String date;
  final double revenue;
  final int salesCount;
  final int unitsSold;

  factory PosTrendPoint.fromJson(Map<String, dynamic> json) {
    return PosTrendPoint(
      date: json["date"] as String? ?? "",
      revenue: _toDouble(json["revenue"]),
      salesCount: _toInt(json["salesCount"]),
      unitsSold: _toInt(json["unitsSold"]),
    );
  }
}

class PosDashboard {
  const PosDashboard({
    required this.todayRevenue,
    required this.todaySalesCount,
    required this.todayUnitsSold,
    required this.trend,
  });

  final double todayRevenue;
  final int todaySalesCount;
  final int todayUnitsSold;
  final List<PosTrendPoint> trend;

  factory PosDashboard.fromJson(Map<String, dynamic> json) {
    final rawTrend = (json["trend"] as List<dynamic>? ?? const [])
        .map((item) => PosTrendPoint.fromJson(item as Map<String, dynamic>))
        .toList();
    return PosDashboard(
      todayRevenue: _toDouble(json["todayRevenue"]),
      todaySalesCount: _toInt(json["todaySalesCount"]),
      todayUnitsSold: _toInt(json["todayUnitsSold"]),
      trend: rawTrend,
    );
  }
}

class PosSaleItem {
  const PosSaleItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.sku,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  final String id;
  final String productId;
  final String productName;
  final String sku;
  final int quantity;
  final double unitPrice;
  final double lineTotal;

  factory PosSaleItem.fromJson(Map<String, dynamic> json) {
    return PosSaleItem(
      id: json["id"] as String? ?? "",
      productId: json["productId"] as String? ?? "",
      productName: json["productName"] as String? ?? "",
      sku: json["sku"] as String? ?? "",
      quantity: _toInt(json["quantity"]),
      unitPrice: _toDouble(json["unitPrice"]),
      lineTotal: _toDouble(json["lineTotal"]),
    );
  }
}

class PosSale {
  const PosSale({
    required this.id,
    required this.saleNumber,
    required this.soldAt,
    required this.totalAmount,
    required this.totalUnits,
    required this.recordedBy,
    required this.items,
  });

  final String id;
  final String saleNumber;
  final DateTime soldAt;
  final double totalAmount;
  final int totalUnits;
  final String recordedBy;
  final List<PosSaleItem> items;

  factory PosSale.fromJson(Map<String, dynamic> json) {
    final rawItems = (json["items"] as List<dynamic>? ?? const [])
        .map((item) => PosSaleItem.fromJson(item as Map<String, dynamic>))
        .toList();
    return PosSale(
      id: json["id"] as String? ?? "",
      saleNumber: json["saleNumber"] as String? ?? "",
      soldAt: DateTime.parse(
        json["soldAt"] as String? ?? DateTime.now().toUtc().toIso8601String(),
      ).toLocal(),
      totalAmount: _toDouble(json["totalAmount"]),
      totalUnits: _toInt(json["totalUnits"]),
      recordedBy: json["recordedBy"] as String? ?? "",
      items: rawItems,
    );
  }
}

class PosSalesPage {
  const PosSalesPage({
    required this.page,
    required this.limit,
    required this.total,
    required this.sales,
    required this.from,
    required this.to,
  });

  final int page;
  final int limit;
  final int total;
  final List<PosSale> sales;
  final String from;
  final String to;

  factory PosSalesPage.fromJson(Map<String, dynamic> json) {
    final rawRange = json["range"] as Map<String, dynamic>? ?? const {};
    final rawSales = (json["sales"] as List<dynamic>? ?? const [])
        .map((item) => PosSale.fromJson(item as Map<String, dynamic>))
        .toList();
    return PosSalesPage(
      page: _toInt(json["page"]),
      limit: _toInt(json["limit"]),
      total: _toInt(json["total"]),
      sales: rawSales,
      from: rawRange["from"] as String? ?? "",
      to: rawRange["to"] as String? ?? "",
    );
  }
}

class PosReportSummary {
  const PosReportSummary({
    required this.totalRevenue,
    required this.salesCount,
    required this.unitsSold,
    required this.averageSale,
  });

  final double totalRevenue;
  final int salesCount;
  final int unitsSold;
  final double averageSale;

  factory PosReportSummary.fromJson(Map<String, dynamic> json) {
    return PosReportSummary(
      totalRevenue: _toDouble(json["totalRevenue"]),
      salesCount: _toInt(json["salesCount"]),
      unitsSold: _toInt(json["unitsSold"]),
      averageSale: _toDouble(json["averageSale"]),
    );
  }
}

class PosSalesReport {
  const PosSalesReport({
    required this.from,
    required this.to,
    required this.summary,
    required this.dailyTrend,
    required this.sales,
  });

  final String from;
  final String to;
  final PosReportSummary summary;
  final List<PosTrendPoint> dailyTrend;
  final List<PosSale> sales;

  factory PosSalesReport.fromJson(Map<String, dynamic> json) {
    final period = json["period"] as Map<String, dynamic>? ?? const {};
    return PosSalesReport(
      from: period["from"] as String? ?? "",
      to: period["to"] as String? ?? "",
      summary: PosReportSummary.fromJson(
        json["summary"] as Map<String, dynamic>? ?? const {},
      ),
      dailyTrend: (json["dailyTrend"] as List<dynamic>? ?? const [])
          .map((item) => PosTrendPoint.fromJson(item as Map<String, dynamic>))
          .toList(),
      sales: (json["sales"] as List<dynamic>? ?? const [])
          .map((item) => PosSale.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CartLine {
  const CartLine({required this.product, required this.quantity});

  final PosProduct product;
  final int quantity;

  double get lineTotal => product.sellingPrice * quantity;

  CartLine copyWith({int? quantity}) =>
      CartLine(product: product, quantity: quantity ?? this.quantity);
}

double _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? "") ?? 0;
}

int _toInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? "") ?? 0;
}
