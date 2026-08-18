# White Angels POS API

All POS endpoints use the existing White Angels admin JWT.

Base URL:

`/api/v1/pos`

Authorization header:

`Authorization: Bearer <admin-jwt>`

## Authentication

Login reuses the existing admin endpoint:

`POST /api/v1/admin/auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "********"
}
```

Response:

```json
{
  "token": "jwt",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN",
    "fullName": "Admin User"
  }
}
```

## GET `/products`

Returns active sellable products for POS.

Optional query:

- `search=`

Response shape:

```json
[
  {
    "id": "uuid",
    "name": "Angel Satin Dress",
    "sku": "WA-DR-001",
    "sellingPrice": 68,
    "availableStock": 12,
    "status": "ACTIVE",
    "primaryImage": "/uploads/products/example.jpg"
  }
]
```

## POST `/sales`

Records a POS sale and deducts stock in the same database transaction.

Request:

```json
{
  "clientReference": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ]
}
```

The server ignores client-side prices and calculates:

- `unitPrice`
- `lineTotal`
- `totalAmount`
- `totalUnits`

Response:

```json
{
  "id": "uuid",
  "saleNumber": "WA-POS-20260818-0001",
  "clientReference": "uuid",
  "soldAt": "2026-08-18T10:00:00.000Z",
  "totalAmount": 136,
  "totalUnits": 2,
  "recordedBy": "Admin User",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Angel Satin Dress",
      "sku": "WA-DR-001",
      "quantity": 2,
      "unitPrice": 68,
      "lineTotal": 136
    }
  ]
}
```

### Idempotency behavior

- `clientReference` is unique.
- If the same `clientReference` is retried, the API returns the existing sale.
- Stock is not deducted twice.

## GET `/sales`

Returns paginated sales history.

Optional query:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`
- `page=`
- `limit=`

Default behavior:

- if no range is supplied, the API uses the current Africa/Harare business day

Response:

```json
{
  "range": {
    "from": "2026-08-18",
    "to": "2026-08-18"
  },
  "page": 1,
  "limit": 20,
  "total": 3,
  "sales": [
    {
      "id": "uuid",
      "saleNumber": "WA-POS-20260818-0001",
      "soldAt": "2026-08-18T10:00:00.000Z",
      "totalAmount": 136,
      "totalUnits": 2,
      "recordedBy": "Admin User"
    }
  ]
}
```

## GET `/sales/:id`

Returns the full sale detail by sale UUID or sale number.

## GET `/dashboard`

Returns today’s Africa/Harare POS summary plus a 7-day trend.

Response:

```json
{
  "todayRevenue": 245,
  "todaySalesCount": 18,
  "todayUnitsSold": 31,
  "trend": [
    {
      "date": "2026-08-18",
      "revenue": 245,
      "salesCount": 18
    }
  ]
}
```

## GET `/reports/sales`

Required query:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Response:

```json
{
  "period": {
    "from": "2026-08-01",
    "to": "2026-08-18"
  },
  "summary": {
    "totalRevenue": 1200,
    "salesCount": 15,
    "unitsSold": 34,
    "averageSale": 80
  },
  "dailyTrend": [
    {
      "date": "2026-08-18",
      "revenue": 245,
      "salesCount": 3,
      "unitsSold": 7
    }
  ],
  "sales": []
}
```

## Error examples

`401`

```json
{
  "message": "Admin authentication required."
}
```

`409`

```json
{
  "message": "Insufficient stock. Only 2 units are available for Angel Satin Dress."
}
```

`400`

```json
{
  "message": "Dates must use YYYY-MM-DD format."
}
```
