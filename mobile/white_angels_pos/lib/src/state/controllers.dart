import "package:flutter/foundation.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";
import "package:uuid/uuid.dart";
import "../models.dart";
import "../services/api_client.dart";

class SessionController extends ChangeNotifier {
  SessionController(this._apiClient, {FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final ApiClient _apiClient;
  final FlutterSecureStorage _storage;
  AuthSession? _session;
  bool _restoring = false;
  bool _loggingIn = false;

  static const _tokenKey = "wa_pos_token";
  static const _adminIdKey = "wa_pos_admin_id";
  static const _adminEmailKey = "wa_pos_admin_email";
  static const _adminNameKey = "wa_pos_admin_name";
  static const _adminRoleKey = "wa_pos_admin_role";

  AuthSession? get session => _session;
  bool get isAuthenticated => _session != null;
  bool get restoring => _restoring;
  bool get loggingIn => _loggingIn;

  Future<void> restore() async {
    _restoring = true;
    notifyListeners();
    try {
      final token = await _storage.read(key: _tokenKey);
      if (token == null || token.isEmpty) return;
      final id = await _storage.read(key: _adminIdKey) ?? "";
      final email = await _storage.read(key: _adminEmailKey) ?? "";
      final name = await _storage.read(key: _adminNameKey) ?? "";
      final role = await _storage.read(key: _adminRoleKey) ?? "ADMIN";
      if (id.isEmpty || email.isEmpty || name.isEmpty) {
        await logout();
        return;
      }
      _session = AuthSession(
        token: token,
        admin: AdminUser(id: id, email: email, fullName: name, role: role),
      );
    } finally {
      _restoring = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _loggingIn = true;
    notifyListeners();
    try {
      final session = await _apiClient.login(email: email, password: password);
      _session = session;
      await _storage.write(key: _tokenKey, value: session.token);
      await _storage.write(key: _adminIdKey, value: session.admin.id);
      await _storage.write(key: _adminEmailKey, value: session.admin.email);
      await _storage.write(key: _adminNameKey, value: session.admin.fullName);
      await _storage.write(key: _adminRoleKey, value: session.admin.role);
    } finally {
      _loggingIn = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _session = null;
    await _storage.deleteAll();
    notifyListeners();
  }
}

class SaleCartController extends ChangeNotifier {
  final Map<String, CartLine> _lines = {};
  String? _clientReference;
  final Uuid _uuid = const Uuid();

  List<CartLine> get lines =>
      _lines.values.toList()
        ..sort((a, b) => a.product.name.compareTo(b.product.name));
  bool get isEmpty => _lines.isEmpty;
  int get totalUnits =>
      _lines.values.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount =>
      _lines.values.fold(0, (sum, item) => sum + item.lineTotal);
  String? get pendingClientReference => _clientReference;

  void addProduct(PosProduct product) {
    final current = _lines[product.id];
    final nextQuantity = (current?.quantity ?? 0) + 1;
    if (nextQuantity > product.availableStock) return;
    _lines[product.id] = CartLine(product: product, quantity: nextQuantity);
    notifyListeners();
  }

  void increment(String productId) {
    final line = _lines[productId];
    if (line == null || line.quantity >= line.product.availableStock) return;
    _lines[productId] = line.copyWith(quantity: line.quantity + 1);
    notifyListeners();
  }

  void decrement(String productId) {
    final line = _lines[productId];
    if (line == null) return;
    if (line.quantity <= 1) {
      _lines.remove(productId);
    } else {
      _lines[productId] = line.copyWith(quantity: line.quantity - 1);
    }
    notifyListeners();
  }

  void remove(String productId) {
    _lines.remove(productId);
    notifyListeners();
  }

  String prepareClientReference() {
    _clientReference ??= _uuid.v4();
    return _clientReference!;
  }

  List<Map<String, dynamic>> toApiItems() {
    return lines
        .map(
          (line) => {"productId": line.product.id, "quantity": line.quantity},
        )
        .toList();
  }

  void clear() {
    _lines.clear();
    _clientReference = null;
    notifyListeners();
  }
}

class RefreshController extends ChangeNotifier {
  int _tick = 0;

  int get tick => _tick;

  void touch() {
    _tick += 1;
    notifyListeners();
  }
}
