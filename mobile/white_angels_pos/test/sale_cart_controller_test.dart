import "package:flutter_test/flutter_test.dart";
import "package:white_angels_pos/src/models.dart";
import "package:white_angels_pos/src/state/controllers.dart";

void main() {
  test("sale cart reuses the same client reference until cleared", () {
    final controller = SaleCartController();
    final product = PosProduct(
      id: "prod-1",
      name: "Dress",
      sku: "SKU-1",
      sellingPrice: 12.5,
      availableStock: 4,
      status: "ACTIVE",
      primaryImage: "",
    );

    controller.addProduct(product);
    final first = controller.prepareClientReference();
    final second = controller.prepareClientReference();

    expect(first, second);

    controller.clear();
    controller.addProduct(product);
    final third = controller.prepareClientReference();
    expect(third, isNot(first));
  });

  test("sale cart totals stay in sync with quantity changes", () {
    final controller = SaleCartController();
    final product = PosProduct(
      id: "prod-1",
      name: "Dress",
      sku: "SKU-1",
      sellingPrice: 10,
      availableStock: 2,
      status: "ACTIVE",
      primaryImage: "",
    );

    controller.addProduct(product);
    controller.increment(product.id);

    expect(controller.totalUnits, 2);
    expect(controller.totalAmount, 20);
  });
}
