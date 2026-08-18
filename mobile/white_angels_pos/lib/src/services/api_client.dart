import "package:dio/dio.dart";
import "../app_config.dart";
import "../models.dart";

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class SessionExpiredException extends ApiException {
  SessionExpiredException(super.message) : super(statusCode: 401);
}

class ApiClient {
  ApiClient([Dio? dio])
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 20),
              sendTimeout: const Duration(seconds: 20),
            ),
          );

  final Dio _dio;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        "/admin/auth/login",
        data: {"email": email.trim(), "password": password},
      );
      final data = response.data ?? const {};
      return AuthSession(
        token: data["token"] as String? ?? "",
        admin: AdminUser.fromJson(
          data["admin"] as Map<String, dynamic>? ?? const {},
        ),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<PosDashboard> getDashboard(String token) async {
    final response = await _get("/pos/dashboard", token: token);
    return PosDashboard.fromJson(response);
  }

  Future<List<PosProduct>> getProducts(
    String token, {
    String search = "",
  }) async {
    final response = await _getList(
      "/pos/products",
      token: token,
      query: {if (search.trim().isNotEmpty) "search": search.trim()},
    );
    return response.map(PosProduct.fromJson).toList();
  }

  Future<PosSale> recordSale(
    String token, {
    required String clientReference,
    required List<Map<String, dynamic>> items,
  }) async {
    final response = await _post(
      "/pos/sales",
      token: token,
      data: {"clientReference": clientReference, "items": items},
    );
    return PosSale.fromJson(response);
  }

  Future<PosSalesPage> getSales(
    String token, {
    required String from,
    required String to,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _get(
      "/pos/sales",
      token: token,
      query: {"from": from, "to": to, "page": page, "limit": limit},
    );
    return PosSalesPage.fromJson(response);
  }

  Future<PosSale> getSaleDetail(String token, String id) async {
    final response = await _get("/pos/sales/$id", token: token);
    return PosSale.fromJson(response);
  }

  Future<PosSalesReport> getSalesReport(
    String token, {
    required String from,
    required String to,
  }) async {
    final response = await _get(
      "/pos/reports/sales",
      token: token,
      query: {"from": from, "to": to},
    );
    return PosSalesReport.fromJson(response);
  }

  Future<Map<String, dynamic>> _get(
    String path, {
    required String token,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        path,
        queryParameters: query,
        options: Options(headers: _headers(token)),
      );
      return response.data ?? const {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<List<Map<String, dynamic>>> _getList(
    String path, {
    required String token,
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        path,
        queryParameters: query,
        options: Options(headers: _headers(token)),
      );
      return (response.data ?? const [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> _post(
    String path, {
    required String token,
    required Map<String, dynamic> data,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: data,
        options: Options(headers: _headers(token)),
      );
      return response.data ?? const {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Map<String, String> _headers(String token) => {
    "Authorization": "Bearer $token",
  };

  ApiException _mapError(DioException error) {
    final data = error.response?.data;
    final statusCode = error.response?.statusCode;
    final message = switch (data) {
      {"message": final String message} => message,
      _ => error.message ?? "Something went wrong.",
    };
    if (statusCode == 401) return SessionExpiredException(message);
    return ApiException(message, statusCode: statusCode);
  }
}
