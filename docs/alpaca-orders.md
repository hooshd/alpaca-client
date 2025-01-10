# Alpaca Orders API Specification

## Base URL
Paper:
```
https://paper-api.alpaca.markets/v2/orders
```

Live: 
```
https://api.alpaca.markets/v2/orders
```

## Endpoints

### 1. Create an Order

- **Method:** `POST`
- **URL:** `/v2/orders`
- **Description:** Places a new order for the account. Orders may be rejected if the account is unauthorized or if the tradable balance is insufficient.

#### Request Body Parameters

| Parameter        | Type    | Required | Description                                                                                                             |
|------------------|---------|----------|-------------------------------------------------------------------------------------------------------------------------|
| `symbol`         | string  | Yes      | Symbol, asset ID, or currency pair to identify the asset to trade.                                                     |
| `qty`            | string  | No       | Number of shares to trade. Fractional quantities allowed only for market and day orders.                                |
| `notional`       | string  | No       | Dollar amount to trade. Cannot be used with `qty`. Applicable only for market and day orders.                           |
| `side`           | string  | Yes      | Order side: `buy` or `sell`.                                                                                            |
| `type`           | string  | Yes      | Order type: `market`, `limit`, `stop`, `stop_limit`, `trailing_stop` (varies by asset class).                           |
| `time_in_force`  | string  | Yes      | Time-In-Force: `day`, `gtc`, `opg`, `cls`, `ioc`, `fok` (varies by asset class).                                       |
| `limit_price`    | string  | Conditional | Required if `type` is `limit` or `stop_limit`.                                                                         |
| `stop_price`     | string  | Conditional | Required if `type` is `stop` or `stop_limit`.                                                                          |
| `trail_price`    | string  | Conditional | Required if `type` is `trailing_stop` and `trail_percent` not provided.                                               |
| `trail_percent`  | string  | Conditional | Required if `type` is `trailing_stop` and `trail_price` not provided.                                                 |
| `extended_hours` | boolean | No       | If `true`, order is eligible to execute in premarket/afterhours. Default is `false`. Applies to `limit` type and `day` TIF. |
| `client_order_id`| string  | No       | Unique identifier for the order (≤ 128 characters). Automatically generated if not provided.                             |
| `order_class`    | string  | No       | Order class: `simple` (default), `oco`, `oto`, `bracket`. Varies by asset class.                                      |
| `take_profit`    | object  | No       | Parameters for take-profit leg of advanced orders.                                                                      |
| `stop_loss`      | object  | No       | Parameters for stop-loss leg of advanced orders.                                                                        |
| `position_intent`| string  | No       | Position strategy: `buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close`.                                     |

#### Order Types

- **Equity:** `market`, `limit`, `stop`, `stop_limit`, `trailing_stop`
- **Options:** `market`, `limit`, `stop`, `stop_limit`
- **Crypto:** `market`, `limit`, `stop_limit`

#### Time-In-Force (TIF)

- **Equity:** `day`, `gtc`, `opg`, `cls`, `ioc`, `fok`
- **Options:** `day`
- **Crypto:** `gtc`, `ioc`

##### TIF Descriptions

- **day:** Valid only on the day it is live, during regular trading hours unless `extended_hours` is `true`.
- **gtc (Good Till Canceled):** Order remains active until canceled.
- **opg (On Open):** Executes only in the opening auction.
- **cls (On Close):** Executes only in the closing auction.
- **ioc (Immediate Or Cancel):** Executes immediately, cancels unfilled portion.
- **fok (Fill Or Kill):** Executes entirely or cancels the entire order.

#### Responses

- **200 OK**
  - **Description:** Order successfully created.
  - **Body:** [Order Object](#order-object)

- **403 Forbidden**
  - **Description:** Insufficient buying power or shares.

- **422 Unprocessable Entity**
  - **Description:** Invalid input parameters.

---

### 2. Get All Orders

- **Method:** `GET`
- **URL:** `/v2/orders`
- **Description:** Retrieves a list of orders, filtered by query parameters.

#### Query Parameters

| Parameter | Type    | Required | Description                                                                                   |
|-----------|---------|----------|-----------------------------------------------------------------------------------------------|
| `status`  | string  | No       | Filter by order status: `open`, `closed`, or `all`. Defaults to `open`.                      |
| `limit`   | integer | No       | Maximum number of orders to return. Defaults to `50`, max `500`.                             |
| `after`   | string  | No       | Return orders submitted after this timestamp (exclusive).                                    |
| `until`   | string  | No       | Return orders submitted until this timestamp (exclusive).                                   |
| `direction`| string | No       | Sort order: `asc` or `desc`. Defaults to `desc`.                                             |
| `nested`  | boolean | No       | If `true`, multi-leg orders are nested under the `legs` field.                               |
| `symbols` | string  | No       | Comma-separated list of symbols (e.g., `AAPL,TSLA`) or currency pairs for crypto (e.g., `BTCUSD`). |
| `side`    | string  | No       | Filter by order side: `buy` or `sell`.                                                       |

#### Responses

- **200 OK**
  - **Description:** Successfully retrieved orders.
  - **Body:** Array of [Order Objects](#order-object).

---

### 3. Delete All Orders

- **Method:** `DELETE`
- **URL:** `/v2/orders`
- **Description:** Attempts to cancel all open orders. Provides a response for each cancellation attempt.

#### Responses

- **207 Multi-Status**
  - **Description:** Contains the status for each cancellation attempt.
  - **Body:** Array of objects with `id` and `status`.

  ```json
  [
    {
      "id": "order_id_1",
      "status": 204
    },
    {
      "id": "order_id_2",
      "status": 500
    }
  ]
  ```

- **500 Internal Server Error**
  - **Description:** Failed to cancel some orders.

---

### 4. Get Order by ID

- **Method:** `GET`
- **URL:** `/v2/orders/{order_id}`
- **Description:** Retrieves a single order by its `order_id`.

#### Path Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `order_id`| string | Yes      | ID of the order to retrieve. |

#### Query Parameters

| Parameter | Type    | Required | Description                                                                                   |
|-----------|---------|----------|-----------------------------------------------------------------------------------------------|
| `nested`  | boolean | No       | If `true`, multi-leg orders are nested under the `legs` field.                               |

#### Responses

- **200 OK**
  - **Description:** Successfully retrieved the order.
  - **Body:** [Order Object](#order-object).

---

### 5. Replace Order by ID

- **Method:** `PATCH`
- **URL:** `/v2/orders/{order_id}`
- **Description:** Replaces a single order with updated parameters. Overrides corresponding attributes of the existing order.

#### Path Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `order_id`| string | Yes      | ID of the order to replace. |

#### Request Body Parameters

| Parameter        | Type    | Required | Description                                                                                 |
|------------------|---------|----------|---------------------------------------------------------------------------------------------|
| `qty`            | string  | Conditional | Number of shares to trade. Only full shares. Cannot change for fractional or notional orders. |
| `time_in_force`  | string  | No       | Updated Time-In-Force (see [Time-In-Force](#time-in-force)).                               |
| `limit_price`    | string  | Yes if original type was `limit` or `stop_limit` | Updated limit price. |
| `stop_price`     | string  | Yes if original type was `stop` or `stop_limit` | Updated stop price. |
| `trail`          | string  | No       | New `trail_price` or `trail_percent` for trailing stop orders.                             |
| `client_order_id`| string  | No       | New unique identifier for the order (≤ 128 characters).                                    |

#### Responses

- **200 OK**
  - **Description:** Successfully replaced the order.
  - **Body:** New [Order Object](#order-object) with a new order ID.

#### Notes

- Replacing an order affects buying power based on the larger of the old and new orders.
- Orders cannot be replaced if their status is `accepted`, `pending_new`, `pending_cancel`, or `pending_replace`.

---

### 6. Delete Order by ID

- **Method:** `DELETE`
- **URL:** `/v2/orders/{order_id}`
- **Description:** Attempts to cancel an open order by its `order_id`.

#### Path Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `order_id`| string | Yes      | ID of the order to cancel. |

#### Responses

- **204 No Content**
  - **Description:** Order successfully canceled.

- **422 Unprocessable Entity**
  - **Description:** Order status is not cancelable.

---

## Order Object

Represents an order within the Alpaca system.

| Field             | Type          | Description                                                                                                  |
|-------------------|---------------|--------------------------------------------------------------------------------------------------------------|
| `id`              | string        | Order ID                                                                                                     |
| `client_order_id` | string        | Client unique order ID (≤ 128 characters)                                                                   |
| `created_at`      | date-time     | Timestamp when the order was created                                                                         |
| `updated_at`      | date-time/null| Timestamp when the order was last updated                                                                      |
| `submitted_at`    | date-time/null| Timestamp when the order was submitted                                                                        |
| `filled_at`       | date-time/null| Timestamp when the order was filled                                                                           |
| `expired_at`      | date-time/null| Timestamp when the order expired                                                                              |
| `canceled_at`     | date-time/null| Timestamp when the order was canceled                                                                          |
| `failed_at`       | date-time/null| Timestamp when the order failed                                                                               |
| `replaced_at`     | date-time/null| Timestamp when the order was replaced                                                                          |
| `replaced_by`     | string/null   | Order ID that replaced this order                                                                             |
| `replaces`        | string/null   | Order ID that this order replaces                                                                             |
| `asset_id`        | string        | Asset ID (option contract ID for options)                                                                     |
| `symbol`          | string        | Asset symbol                                                                                                  |
| `asset_class`     | string        | Category of asset: `us_equity`, `us_option`, `crypto`                                                         |
| `notional`        | string/null   | Ordered notional amount. If provided, `qty` is null. Up to 9 decimal points.                                 |
| `qty`             | string/null   | Ordered quantity. If provided, `notional` is null. Up to 9 decimal points.                                   |
| `filled_qty`      | string        | Filled quantity                                                                                               |
| `filled_avg_price`| string/null   | Filled average price                                                                                          |
| `order_class`     | string        | `simple`, `oco`, `oto`, `bracket` (varies by asset class)                                                    |
| `type`            | string        | Order type: `market`, `limit`, `stop`, `stop_limit`, `trailing_stop` (varies by asset class)                  |
| `side`            | string        | `buy` or `sell`                                                                                                |
| `time_in_force`   | string        | Time-In-Force: `day`, `gtc`, `opg`, `cls`, `ioc`, `fok` (varies by asset class)                              |
| `limit_price`     | string/null   | Limit price                                                                                                   |
| `stop_price`      | string/null   | Stop price                                                                                                    |
| `trail_price`     | string/null   | Dollar value for trailing stop orders.                                                                      |
| `trail_percent`   | string/null   | Percent value for trailing stop orders.                                                                     |
| `hwm`             | string/null   | Highest (or lowest) market price seen since trailing stop order was submitted.                              |
| `position_intent` | string        | Position strategy: `buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close`                           |
| `status`          | string        | Order status: `new`, `partially_filled`, `filled`, `done_for_day`, `canceled`, `expired`, `replaced`, etc. |
| `extended_hours`  | boolean       | Eligible for execution outside regular trading hours.                                                       |
| `legs`            | array/null    | Array of [Order Objects](#order-object) for multi-leg orders; `null` for simple orders.                     |

### Status Values

- **Common:**
  - `new`: Order received and routed for execution.
  - `partially_filled`: Part of the order has been filled.
  - `filled`: Order completely filled.
  - `done_for_day`: Execution done for the day.
  - `canceled`: Order canceled.
  - `expired`: Order expired.
  - `replaced`: Order replaced by another order.
  - `pending_cancel`: Waiting to be canceled.
  - `pending_replace`: Waiting to be replaced.

- **Less Common:**
  - `accepted`: Received but not yet routed to execution venue.
  - `pending_new`: Received and routed but not yet accepted for execution.
  - `accepted_for_bidding`: Received by exchanges and evaluated for pricing.
  - `stopped`: Trade guaranteed but not yet occurred.
  - `rejected`: Order rejected by exchanges.
  - `suspended`: Order suspended and not eligible for trading.
  - `calculated`: Order completed for the day with pending settlement calculations.

---

## Additional Objects

### Take Profit Object

Used for advanced orders to specify take-profit parameters.

| Field            | Type    | Description                         |
|------------------|---------|-------------------------------------|
| `limit_price`    | string  | Limit price for take-profit order.  |
| `stop_price`     | string  | Stop price for take-profit order.   |
| `order_class`    | string  | Order class for take-profit.        |

### Stop Loss Object

Used for advanced orders to specify stop-loss parameters.

| Field            | Type    | Description                         |
|------------------|---------|-------------------------------------|
| `stop_price`     | string  | Stop price for stop-loss order.     |
| `limit_price`    | string  | Limit price for stop-loss order.    |
| `order_class`    | string  | Order class for stop-loss.          |

---

## Notes

- **Replacing Orders:** When replacing an order, buying power is adjusted based on the larger of the existing and new order amounts. Replacements cannot be performed if the order is in `accepted`, `pending_new`, `pending_cancel`, or `pending_replace` status.
  
- **Extended Hours:** The `extended_hours` flag allows orders to be executed outside regular trading hours but is only applicable to certain order types and TIFs.

- **Multi-leg Orders:** Orders with classes such as `oco`, `oto`, or `bracket` are considered advanced and can contain multiple legs. Use the `nested` query parameter to retrieve these orders with their associated legs.

- **Deprecated Fields:** The `order_type` field is deprecated in favor of the `type` field.

---

## Error Codes

| Status Code | Description                                     |
|-------------|-------------------------------------------------|
| `200`       | Successful request.                             |
| `204`       | Successful deletion (No Content).              |
| `207`       | Multi-Status response for bulk operations.      |
| `403`       | Forbidden. Insufficient buying power or shares.|
| `422`       | Unprocessable Entity. Invalid input parameters. |
| `500`       | Internal Server Error. Failed to process request.|

---

## Example Usage

### Creating a Market Order

**Request:**

```http
POST /v2/orders HTTP/1.1
Host: paper-api.alpaca.markets
Content-Type: application/json

{
  "symbol": "AAPL",
  "qty": "10",
  "side": "buy",
  "type": "market",
  "time_in_force": "day"
}
```

**Response:**

```json
{
  "id": "order_id_123",
  "client_order_id": "unique_id_456",
  "created_at": "2025-01-09T12:34:56Z",
  "status": "new",
  "filled_qty": "0",
  "qty": "10",
  "symbol": "AAPL",
  "side": "buy",
  "type": "market",
  "time_in_force": "day",
  "extended_hours": false,
  "asset_class": "us_equity"
}
```