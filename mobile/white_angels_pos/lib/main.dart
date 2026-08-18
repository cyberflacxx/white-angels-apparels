import "dart:typed_data";

import "package:fl_chart/fl_chart.dart";
import "package:flutter/material.dart";
import "package:intl/intl.dart";
import "package:pdf/pdf.dart";
import "package:printing/printing.dart";
import "package:provider/provider.dart";

import "src/app_config.dart";
import "src/models.dart";
import "src/services/api_client.dart";
import "src/services/pdf_report_service.dart";
import "src/state/controllers.dart";
import "src/utils/date_ranges.dart";

void main() {
  runApp(const WhiteAngelsPosApp());
}

class WhiteAngelsPosApp extends StatelessWidget {
  const WhiteAngelsPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => ApiClient()),
        Provider(create: (_) => PdfReportService()),
        ChangeNotifierProvider(
          create: (context) =>
              SessionController(context.read<ApiClient>())..restore(),
        ),
        ChangeNotifierProvider(create: (_) => SaleCartController()),
        ChangeNotifierProvider(create: (_) => RefreshController()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: AppConfig.appName,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF183B80),
            primary: const Color(0xFF183B80),
            surface: Colors.white,
          ),
          scaffoldBackgroundColor: const Color(0xFFF5F7FB),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF183B80),
            elevation: 0,
          ),
          cardTheme: const CardThemeData(
            color: Colors.white,
            elevation: 0,
            margin: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(18)),
              side: BorderSide(color: Color(0xFFE2E8F0)),
            ),
          ),
        ),
        home: Consumer<SessionController>(
          builder: (context, session, _) {
            if (session.restoring) return const SplashScreen();
            if (!session.isAuthenticated) return const LoginScreen();
            return const PosShell();
          },
        ),
      ),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await context.read<SessionController>().login(
        _emailController.text,
        _passwordController.text,
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Image.asset("assets/white-angels-logo.png", height: 84),
                        const SizedBox(height: 20),
                        Text(
                          AppConfig.appName,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF183B80),
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Login with your existing White Angels admin account.",
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: const Color(0xFF475569)),
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: "Email"),
                          validator: (value) =>
                              (value == null || value.trim().isEmpty)
                              ? "Email is required."
                              : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: "Password",
                          ),
                          validator: (value) => (value == null || value.isEmpty)
                              ? "Password is required."
                              : null,
                          onFieldSubmitted: (_) => _submit(),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            _error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ],
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: session.loggingIn ? null : _submit,
                          child: session.loggingIn
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text("Login"),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PosShell extends StatefulWidget {
  const PosShell({super.key});

  @override
  State<PosShell> createState() => _PosShellState();
}

class _PosShellState extends State<PosShell> {
  int _index = 0;

  static const _titles = ["Home", "New Sale", "Sales", "Reports"];

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>().session!;
    final pages = const [
      HomeScreen(),
      NewSaleScreen(),
      SalesScreen(),
      ReportsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: Row(
          children: [
            Image.asset("assets/white-angels-logo.png", height: 34),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _titles[_index],
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    session.admin.fullName,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: "Logout",
            onPressed: () => context.read<SessionController>().logout(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: "Home",
          ),
          NavigationDestination(
            icon: Icon(Icons.point_of_sale_outlined),
            selectedIcon: Icon(Icons.point_of_sale_rounded),
            label: "Sale",
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded),
            label: "Sales",
          ),
          NavigationDestination(
            icon: Icon(Icons.assessment_outlined),
            selectedIcon: Icon(Icons.assessment_rounded),
            label: "Reports",
          ),
        ],
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PosDashboard? _dashboard;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    context.read<RefreshController>().addListener(_reloadFromRefresh);
    _load();
  }

  @override
  void dispose() {
    context.read<RefreshController>().removeListener(_reloadFromRefresh);
    super.dispose();
  }

  void _reloadFromRefresh() {
    _load();
  }

  Future<void> _load() async {
    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dashboard = await context.read<ApiClient>().getDashboard(token);
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeading(
            title: "White Angels POS",
            subtitle: "Today's overview and the last 7 business days.",
          ),
          if (_loading && _dashboard == null)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            ),
          if (_error != null && _dashboard == null) ErrorCard(message: _error!),
          if (_dashboard != null) ...[
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                MetricCard(
                  label: "Today's Revenue",
                  value: formatCurrency(_dashboard!.todayRevenue),
                ),
                MetricCard(
                  label: "Sales Today",
                  value: _dashboard!.todaySalesCount.toString(),
                ),
                MetricCard(
                  label: "Units Sold",
                  value: _dashboard!.todayUnitsSold.toString(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "7-Day Sales Trend",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 240,
                      child:
                          _dashboard!.trend.every((point) => point.revenue == 0)
                          ? const EmptyState(
                              message: "No POS sales recorded yet.",
                            )
                          : BarChart(
                              BarChartData(
                                gridData: const FlGridData(show: false),
                                borderData: FlBorderData(show: false),
                                titlesData: FlTitlesData(
                                  rightTitles: const AxisTitles(
                                    sideTitles: SideTitles(showTitles: false),
                                  ),
                                  topTitles: const AxisTitles(
                                    sideTitles: SideTitles(showTitles: false),
                                  ),
                                  leftTitles: const AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      reservedSize: 48,
                                    ),
                                  ),
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      getTitlesWidget: (value, meta) {
                                        final index = value.toInt();
                                        if (index < 0 ||
                                            index >= _dashboard!.trend.length) {
                                          return const SizedBox.shrink();
                                        }
                                        final date = DateTime.tryParse(
                                          _dashboard!.trend[index].date,
                                        );
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                            top: 8,
                                          ),
                                          child: Text(
                                            date == null
                                                ? ""
                                                : DateFormat(
                                                    "dd MMM",
                                                  ).format(date),
                                            style: const TextStyle(
                                              fontSize: 10,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                                barGroups: List.generate(
                                  _dashboard!.trend.length,
                                  (index) => BarChartGroupData(
                                    x: index,
                                    barRods: [
                                      BarChartRodData(
                                        toY: _dashboard!.trend[index].revenue,
                                        borderRadius: BorderRadius.circular(8),
                                        width: 22,
                                        color: const Color(0xFF183B80),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class NewSaleScreen extends StatefulWidget {
  const NewSaleScreen({super.key});

  @override
  State<NewSaleScreen> createState() => _NewSaleScreenState();
}

class _NewSaleScreenState extends State<NewSaleScreen> {
  final _searchController = TextEditingController();
  List<PosProduct> _products = const [];
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final products = await context.read<ApiClient>().getProducts(
        token,
        search: _searchController.text,
      );
      if (!mounted) return;
      setState(() => _products = products);
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _recordSale() async {
    final cart = context.read<SaleCartController>();
    if (cart.isEmpty || _submitting) return;
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text("Record this sale?"),
            content: Text(
              "${cart.totalUnits} units\n${formatCurrency(cart.totalAmount)}",
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text("Cancel"),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text("Record Sale"),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    if (!mounted) return;

    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() => _submitting = true);
    final clientReference = cart.prepareClientReference();
    final apiClient = context.read<ApiClient>();
    final refreshController = context.read<RefreshController>();
    try {
      final sale = await apiClient.recordSale(
        token,
        clientReference: clientReference,
        items: cart.toApiItems(),
      );
      if (!mounted) return;
      cart.clear();
      refreshController.touch();
      await _loadProducts();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text("Sale Recorded"),
          content: Text(
            "${sale.saleNumber}\n${formatCurrency(sale.totalAmount)}\n${sale.totalUnits} units",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("New Sale"),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.of(this.context).push(
                  MaterialPageRoute(
                    builder: (_) => SaleDetailScreen(saleId: sale.id),
                  ),
                );
              },
              child: const Text("View Sale"),
            ),
          ],
        ),
      );
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error.message.isEmpty
                ? "Unable to connect. Sale was not recorded."
                : error.message,
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<SaleCartController>();
    return RefreshIndicator(
      onRefresh: _loadProducts,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeading(
            title: "New Sale",
            subtitle:
                "Search products, build the sale, then record it against live White Angels stock.",
          ),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: "Search products...",
              suffixIcon: IconButton(
                onPressed: _loadProducts,
                icon: const Icon(Icons.search_rounded),
              ),
            ),
            onSubmitted: (_) => _loadProducts(),
          ),
          const SizedBox(height: 16),
          if (_error != null) ErrorCard(message: _error!),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (!_loading && _products.isEmpty)
            const EmptyState(message: "No products found."),
          if (_products.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _products
                      .map(
                        (product) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: ProductThumb(
                            imageUrl: resolveImageUrl(product.primaryImage),
                          ),
                          title: Text(
                            product.name,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            "${product.sku.isEmpty ? "No SKU" : product.sku} • ${product.availableStock} in stock",
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                formatCurrency(product.sellingPrice),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              OutlinedButton(
                                onPressed: product.availableStock < 1
                                    ? null
                                    : () => context
                                          .read<SaleCartController>()
                                          .addProduct(product),
                                child: const Text("Add"),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Selected Sale",
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (cart.lines.isEmpty)
                    const EmptyState(message: "Add products to start a sale."),
                  ...cart.lines.map(
                    (line) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            line.product.name,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "${line.product.sku.isEmpty ? "No SKU" : line.product.sku} • ${formatCurrency(line.product.sellingPrice)}",
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              IconButton(
                                onPressed: () => context
                                    .read<SaleCartController>()
                                    .decrement(line.product.id),
                                icon: const Icon(Icons.remove_circle_outline),
                              ),
                              Text(
                                "${line.quantity}",
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              IconButton(
                                onPressed: () => context
                                    .read<SaleCartController>()
                                    .increment(line.product.id),
                                icon: const Icon(Icons.add_circle_outline),
                              ),
                              const Spacer(),
                              Text(
                                formatCurrency(line.lineTotal),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 24),
                  SummaryRow(label: "Total Units", value: "${cart.totalUnits}"),
                  SummaryRow(
                    label: "Total Amount",
                    value: formatCurrency(cart.totalAmount),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: cart.isEmpty || _submitting ? null : _recordSale,
                    icon: _submitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.check_circle_outline),
                    label: const Text("RECORD SALE"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  ReportPreset _preset = ReportPreset.today;
  DateRangeValue _range = resolvePresetRange(ReportPreset.today);
  PosSalesPage? _salesPage;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    context.read<RefreshController>().addListener(_onRefreshSignal);
    _load();
  }

  @override
  void dispose() {
    context.read<RefreshController>().removeListener(_onRefreshSignal);
    super.dispose();
  }

  void _onRefreshSignal() => _load();

  Future<void> _pickCustomRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2025),
      lastDate: DateTime(2030),
      initialDateRange: DateTimeRange(
        start: DateTime.parse(_range.from),
        end: DateTime.parse(_range.to),
      ),
    );
    if (picked == null) return;
    setState(() {
      _preset = ReportPreset.custom;
      _range = customRange(picked.start, picked.end);
    });
    await _load();
  }

  Future<void> _changePreset(ReportPreset preset) async {
    if (preset == ReportPreset.custom) {
      await _pickCustomRange();
      return;
    }
    setState(() {
      _preset = preset;
      _range = resolvePresetRange(preset);
    });
    await _load();
  }

  Future<void> _load() async {
    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await context.read<ApiClient>().getSales(
        token,
        from: _range.from,
        to: _range.to,
        page: 1,
        limit: 50,
      );
      if (!mounted) return;
      setState(() => _salesPage = result);
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeading(
            title: "Sales",
            subtitle: "Showing ${_range.from} to ${_range.to}",
          ),
          FilterBar(preset: _preset, onPresetSelected: _changePreset),
          const SizedBox(height: 16),
          if (_loading && _salesPage == null)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (_error != null && _salesPage == null) ErrorCard(message: _error!),
          if (_salesPage != null && _salesPage!.sales.isEmpty)
            const EmptyState(message: "No sales recorded for this period."),
          if (_salesPage != null && _salesPage!.sales.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _salesPage!.sales
                      .map(
                        (sale) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            sale.saleNumber,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(
                            "${DateFormat("dd MMM yyyy HH:mm").format(sale.soldAt)} • ${sale.totalUnits} units",
                          ),
                          trailing: Text(
                            formatCurrency(sale.totalAmount),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => SaleDetailScreen(saleId: sale.id),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  ReportPreset _preset = ReportPreset.today;
  DateRangeValue _range = resolvePresetRange(ReportPreset.today);
  PosSalesReport? _report;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    context.read<RefreshController>().addListener(_onRefreshSignal);
    _load();
  }

  @override
  void dispose() {
    context.read<RefreshController>().removeListener(_onRefreshSignal);
    super.dispose();
  }

  void _onRefreshSignal() => _load();

  Future<void> _changePreset(ReportPreset preset) async {
    if (preset == ReportPreset.custom) {
      final picked = await showDateRangePicker(
        context: context,
        firstDate: DateTime(2025),
        lastDate: DateTime(2030),
        initialDateRange: DateTimeRange(
          start: DateTime.parse(_range.from),
          end: DateTime.parse(_range.to),
        ),
      );
      if (picked == null) return;
      setState(() {
        _preset = ReportPreset.custom;
        _range = customRange(picked.start, picked.end);
      });
      await _load();
      return;
    }
    setState(() {
      _preset = preset;
      _range = resolvePresetRange(preset);
    });
    await _load();
  }

  Future<void> _load() async {
    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final report = await context.read<ApiClient>().getSalesReport(
        token,
        from: _range.from,
        to: _range.to,
      );
      if (!mounted) return;
      setState(() => _report = report);
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeading(
            title: "Reports",
            subtitle: "Sales report for ${_range.from} to ${_range.to}",
          ),
          FilterBar(preset: _preset, onPresetSelected: _changePreset),
          const SizedBox(height: 16),
          if (_loading && _report == null)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (_error != null && _report == null) ErrorCard(message: _error!),
          if (_report != null) ...[
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                MetricCard(
                  label: "Total Revenue",
                  value: formatCurrency(_report!.summary.totalRevenue),
                ),
                MetricCard(
                  label: "Transactions",
                  value: _report!.summary.salesCount.toString(),
                ),
                MetricCard(
                  label: "Units Sold",
                  value: _report!.summary.unitsSold.toString(),
                ),
                MetricCard(
                  label: "Average Sale",
                  value: formatCurrency(_report!.summary.averageSale),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Sales Trend",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 220,
                      child:
                          _report!.dailyTrend.every(
                            (point) => point.revenue == 0,
                          )
                          ? const EmptyState(
                              message: "No sales found for this period.",
                            )
                          : LineChart(
                              LineChartData(
                                borderData: FlBorderData(show: false),
                                gridData: const FlGridData(show: false),
                                titlesData: FlTitlesData(
                                  rightTitles: const AxisTitles(
                                    sideTitles: SideTitles(showTitles: false),
                                  ),
                                  topTitles: const AxisTitles(
                                    sideTitles: SideTitles(showTitles: false),
                                  ),
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      getTitlesWidget: (value, meta) {
                                        final index = value.toInt();
                                        if (index < 0 ||
                                            index >=
                                                _report!.dailyTrend.length) {
                                          return const SizedBox.shrink();
                                        }
                                        final date = DateTime.tryParse(
                                          _report!.dailyTrend[index].date,
                                        );
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                            top: 8,
                                          ),
                                          child: Text(
                                            date == null
                                                ? ""
                                                : DateFormat(
                                                    "dd MMM",
                                                  ).format(date),
                                            style: const TextStyle(
                                              fontSize: 10,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                                lineBarsData: [
                                  LineChartBarData(
                                    spots: List.generate(
                                      _report!.dailyTrend.length,
                                      (index) => FlSpot(
                                        index.toDouble(),
                                        _report!.dailyTrend[index].revenue,
                                      ),
                                    ),
                                    isCurved: true,
                                    color: const Color(0xFF183B80),
                                    barWidth: 3,
                                    dotData: const FlDotData(show: false),
                                  ),
                                ],
                              ),
                            ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              PdfReportPreviewScreen(report: _report!),
                        ),
                      ),
                      icon: const Icon(Icons.picture_as_pdf_outlined),
                      label: const Text("EXPORT PDF"),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _report!.sales
                      .map(
                        (sale) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            sale.saleNumber,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(
                            "${DateFormat("dd MMM yyyy HH:mm").format(sale.soldAt)} • ${sale.totalUnits} units",
                          ),
                          trailing: Text(
                            formatCurrency(sale.totalAmount),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class SaleDetailScreen extends StatefulWidget {
  const SaleDetailScreen({super.key, required this.saleId});

  final String saleId;

  @override
  State<SaleDetailScreen> createState() => _SaleDetailScreenState();
}

class _SaleDetailScreenState extends State<SaleDetailScreen> {
  PosSale? _sale;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<SessionController>().session?.token;
    if (token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final sale = await context.read<ApiClient>().getSaleDetail(
        token,
        widget.saleId,
      );
      if (!mounted) return;
      setState(() => _sale = sale);
    } on SessionExpiredException {
      if (!mounted) return;
      await context.read<SessionController>().logout();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Sale Detail")),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loading && _sale == null)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
            if (_error != null && _sale == null) ErrorCard(message: _error!),
            if (_sale != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "White Angels POS",
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      SummaryRow(
                        label: "Sale number",
                        value: _sale!.saleNumber,
                      ),
                      SummaryRow(
                        label: "Date",
                        value: DateFormat("dd MMM yyyy").format(_sale!.soldAt),
                      ),
                      SummaryRow(
                        label: "Time",
                        value: DateFormat("HH:mm").format(_sale!.soldAt),
                      ),
                      SummaryRow(
                        label: "Recorded by",
                        value: _sale!.recordedBy,
                      ),
                      const Divider(height: 24),
                      ..._sale!.items.map(
                        (item) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            item.productName,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            "${item.quantity} x ${formatCurrency(item.unitPrice)}",
                          ),
                          trailing: Text(
                            formatCurrency(item.lineTotal),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                      const Divider(height: 24),
                      SummaryRow(
                        label: "Total Units",
                        value: "${_sale!.totalUnits}",
                      ),
                      SummaryRow(
                        label: "Total Amount",
                        value: formatCurrency(_sale!.totalAmount),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class PdfReportPreviewScreen extends StatefulWidget {
  const PdfReportPreviewScreen({super.key, required this.report});

  final PosSalesReport report;

  @override
  State<PdfReportPreviewScreen> createState() => _PdfReportPreviewScreenState();
}

class _PdfReportPreviewScreenState extends State<PdfReportPreviewScreen> {
  Uint8List? _bytes;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _buildPdf();
  }

  Future<void> _buildPdf() async {
    try {
      final bytes = await context.read<PdfReportService>().buildSalesReport(
        widget.report,
      );
      if (!mounted) return;
      setState(() => _bytes = bytes);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    }
  }

  Future<void> _savePdf() async {
    if (_bytes == null || _saving) return;
    setState(() => _saving = true);
    try {
      final service = context.read<PdfReportService>();
      final path = await service.saveReport(
        _bytes!,
        service.buildFileName(widget.report),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Saved to $path")));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.read<PdfReportService>();
    return Scaffold(
      appBar: AppBar(
        title: const Text("PDF Preview"),
        actions: [
          IconButton(
            onPressed: _bytes == null
                ? null
                : () => Printing.sharePdf(
                    bytes: _bytes!,
                    filename: service.buildFileName(widget.report),
                  ),
            icon: const Icon(Icons.share_outlined),
          ),
          IconButton(
            onPressed: _bytes == null || _saving ? null : _savePdf,
            icon: const Icon(Icons.download_outlined),
          ),
        ],
      ),
      body: _error != null
          ? Center(child: Text(_error!))
          : _bytes == null
          ? const Center(child: CircularProgressIndicator())
          : PdfPreview(
              build: (format) async => _bytes!,
              initialPageFormat: PdfPageFormat.a4,
              canChangeOrientation: false,
              canChangePageFormat: false,
              allowSharing: false,
            ),
    );
  }
}

class SectionHeading extends StatelessWidget {
  const SectionHeading({
    super.key,
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF183B80),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF475569)),
          ),
        ],
      ),
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ProductThumb extends StatelessWidget {
  const ProductThumb({super.key, required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 48,
        height: 48,
        color: const Color(0xFFE2E8F0),
        child: imageUrl.isEmpty
            ? const Icon(Icons.image_not_supported_outlined)
            : Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.image_not_supported_outlined),
              ),
      ),
    );
  }
}

class FilterBar extends StatelessWidget {
  const FilterBar({
    super.key,
    required this.preset,
    required this.onPresetSelected,
  });

  final ReportPreset preset;
  final ValueChanged<ReportPreset> onPresetSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _chip(context, ReportPreset.today, "Today"),
        _chip(context, ReportPreset.yesterday, "Yesterday"),
        _chip(context, ReportPreset.thisWeek, "This Week"),
        _chip(context, ReportPreset.thisMonth, "This Month"),
        _chip(context, ReportPreset.custom, "Custom Range"),
      ],
    );
  }

  Widget _chip(BuildContext context, ReportPreset value, String label) {
    final selected = preset == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onPresetSelected(value),
    );
  }
}

class SummaryRow extends StatelessWidget {
  const SummaryRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class ErrorCard extends StatelessWidget {
  const ErrorCard({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message, style: const TextStyle(color: Colors.red)),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          const Icon(
            Icons.inventory_2_outlined,
            size: 36,
            color: Color(0xFF94A3B8),
          ),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

String formatCurrency(double amount) =>
    NumberFormat.currency(symbol: "\$", decimalDigits: 2).format(amount);

String resolveImageUrl(String path) {
  if (path.isEmpty) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  final uri = Uri.parse(AppConfig.apiBaseUrl);
  return "${uri.scheme}://${uri.host}${uri.hasPort ? ":${uri.port}" : ""}$path";
}
