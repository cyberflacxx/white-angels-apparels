# White Angels Apparels Architecture

White Angels Apparels is split into a React/Vite client and a Node.js/Express API. The browser never connects to PostgreSQL directly. All order, catalog, inventory, payment and admin operations go through `/api/v1`.

Stock is deducted during successful order creation inside a PostgreSQL transaction. The API locks product rows, validates stock, calculates totals from database prices, writes order items with product snapshots, creates a payment record and records `SALE` inventory movements. If cancellation restoration is added later, it should live in the same order service boundary and write reverse inventory movements.

Images use a local upload abstraction through `multer` and `/uploads`. This is intentionally isolated so Cloudinary or another storage provider can replace local disk storage later.
