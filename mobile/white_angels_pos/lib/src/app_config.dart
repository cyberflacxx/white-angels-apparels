class AppConfig {
  static const String appName = "White Angels POS";
  static const String apiBaseUrl = String.fromEnvironment(
    "API_BASE_URL",
    defaultValue: "https://whiteangels.178.238.227.229.sslip.io/api/v1",
  );
}
