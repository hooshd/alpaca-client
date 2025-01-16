# Alpaca Positions API Specification

The Alpaca Positions API provides endpoints to manage and retrieve information about an account’s current open positions. This document outlines the available endpoints, their usage, parameters, and response structures.

## Table of Contents

- [Alpaca Positions API Specification](#alpaca-positions-api-specification)
  - [Table of Contents](#table-of-contents)
  - [Endpoints](#endpoints)
    - [1. Retrieve All Open Positions](#1-retrieve-all-open-positions)
    - [2. Close All Positions](#2-close-all-positions)
    - [3. Get an Open Position](#3-get-an-open-position)
    - [4. Close a Position](#4-close-a-position)
  - [Response Objects](#response-objects)
    - [Position Object](#position-object)
    - [PositionClosed Response](#positionclosed-response)
    - [Order Object](#order-object)
  - [Error Responses](#error-responses)
  - [Notes](#notes)

---

## Endpoints

### 1. Retrieve All Open Positions

**Endpoint**

- **Method:** `GET`
- **URL:** `https://paper-api.alpaca.markets/v2/positions`

**Description**

Retrieves a list of the account’s current open positions. The response includes information such as cost basis, shares traded, and market value, which are updated live as price information is updated. Once a position is closed, it will no longer be queryable through this API.

**Response**

- **Status Code:** `200 OK`
- **Body:** Array of `Position` objects

**Response Body Example**

```json
[
  {
    "asset_id": "string",
    "symbol": "string",
    "exchange": "string",
    "asset_class": "string",
    "avg_entry_price": "string",
    "qty": "string",
    "qty_available": "string",
    "side": "string",
    "market_value": "string",
    "cost_basis": "string",
    "unrealized_pl": "string",
    "unrealized_plpc": "string",
    "unrealized_intraday_pl": "string",
    "unrealized_intraday_plpc": "string",
    "current_price": "string",
    "lastday_price": "string",
    "change_today": "string",
    "asset_marginable": true
  }
]
```

---

### 2. Close All Positions

**Endpoint**

- **Method:** `DELETE`
- **URL:** `https://paper-api.alpaca.markets/v2/positions`

**Description**

Closes (liquidates) all of the account’s open long and short positions. If the `cancel_orders` query parameter is set to `true`, all open orders will be canceled before liquidating the positions. A response will be provided for each attempt to close a position.

**Query Parameters**

| Parameter     | Type    | Description                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------- |
| `cancel_orders` | boolean | If `true`, cancel all open orders before liquidating all positions.                          |

**Responses**

- **Status Code:** `207 Multi-Status`
- **Body:** Array of `PositionClosed` responses

**Response Body Example**

```json
[
  {
    "symbol": "string",
    "status": "string",
    "body": { /* Order Object */ }
  }
]
```

- **Status Code:** `500 Internal Server Error`
  - **Description:** Failed to liquidate positions.

---

### 3. Get an Open Position

**Endpoint**

- **Method:** `GET`
- **URL:** `https://paper-api.alpaca.markets/v2/positions/{symbol_or_asset_id}`

**Description**

Retrieves the account’s open position for the specified symbol or asset ID.

**Path Parameters**

| Parameter              | Type   | Description                    |
| ---------------------- | ------ | ------------------------------ |
| `symbol_or_asset_id`   | string | Symbol name or Asset ID        |

**Response**

- **Status Code:** `200 OK`
- **Body:** `Position` object

**Response Body Example**

```json
{
  "asset_id": "string",
  "symbol": "string",
  "exchange": "string",
  "asset_class": "string",
  "avg_entry_price": "string",
  "qty": "string",
  "qty_available": "string",
  "side": "string",
  "market_value": "string",
  "cost_basis": "string",
  "unrealized_pl": "string",
  "unrealized_plpc": "string",
  "unrealized_intraday_pl": "string",
  "unrealized_intraday_plpc": "string",
  "current_price": "string",
  "lastday_price": "string",
  "change_today": "string",
  "asset_marginable": true
}
```

---

### 4. Close a Position

**Endpoint**

- **Method:** `DELETE`
- **URL:** `https://paper-api.alpaca.markets/v2/positions/{symbol_or_asset_id}`

**Description**

Closes (liquidates) the account’s open position for the specified symbol or asset ID. This works for both long and short positions.

**Path Parameters**

| Parameter            | Type   | Description                  |
| -------------------- | ------ | ---------------------------- |
| `symbol_or_asset_id` | string | Symbol name or Asset ID      |

**Query Parameters**

| Parameter   | Type   | Description                                                                                           |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `qty`       | number | Number of shares to liquidate. Can accept up to 9 decimal points. Cannot be used with `percentage`.    |
| `percentage`| number | Percentage of the position to liquidate (0-100). Can accept up to 9 decimal points. Cannot be used with `qty`. |

**Response**

- **Status Code:** `200 OK`
- **Body:** `Order` object representing the order created to close the position

**Response Body Example**

```json
{
  "id": "string",
  "client_order_id": "string",
  "created_at": "date-time",
  "updated_at": "date-time | null",
  "submitted_at": "date-time | null",
  "filled_at": "date-time | null",
  "expired_at": "date-time | null",
  "canceled_at": "date-time | null",
  "failed_at": "date-time | null",
  "replaced_at": "date-time | null",
  "replaced_by": "string | null",
  "replaces": "string | null",
  "asset_id": "string",
  "symbol": "string",
  "asset_class": "string",
  "notional": "string | null",
  "qty": "string | null",
  "filled_qty": "string",
  "filled_avg_price": "string | null",
  "order_class": "string",
  "type": "string",
  "side": "string",
  "time_in_force": "string",
  "limit_price": "string | null",
  "stop_price": "string | null",
  "status": "string",
  "extended_hours": true,
  "legs": [ /* Array of Order Objects */ ] | null,
  "trail_percent": "string | null",
  "trail_price": "string | null",
  "hwm": "string | null",
  "position_intent": "string"
}
```

---

## Response Objects

### Position Object

Represents an open position in the account.

| Field                      | Type    | Description                                                                                                   |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `asset_id`                 | string  | **Required.** Asset ID (For options, this represents the option contract ID).                                |
| `symbol`                   | string  | **Required.** Symbol name of the asset.                                                                      |
| `exchange`                 | string  | **Required.** Current exchange where the asset is listed. Supported exchanges: AMEX, ARCA, BATS, NYSE, NASDAQ, NYSEARCA, OTC. |
| `asset_class`              | string  | **Required.** Category of the asset. Options: `us_equity`, `us_option`, `crypto`.                            |
| `avg_entry_price`          | string  | **Required.** Average entry price of the position. Length ≥ 1.                                               |
| `qty`                      | string  | **Required.** Number of shares. Length ≥ 1.                                                                   |
| `qty_available`            | string  | Number of shares available minus open orders. Length ≥ 1.                                                     |
| `side`                     | string  | **Required.** Position side: `long` or `short`. Length ≥ 1.                                                  |
| `market_value`             | string  | **Required.** Total dollar amount of the position. Length ≥ 1.                                                |
| `cost_basis`               | string  | **Required.** Total cost basis in dollars. Length ≥ 1.                                                        |
| `unrealized_pl`            | string  | **Required.** Unrealized profit/loss in dollars. Length ≥ 1.                                                  |
| `unrealized_plpc`          | string  | **Required.** Unrealized profit/loss percent (factor of 1). Length ≥ 1.                                      |
| `unrealized_intraday_pl`   | string  | **Required.** Unrealized profit/loss in dollars for the day. Length ≥ 1.                                     |
| `unrealized_intraday_plpc` | string  | **Required.** Unrealized profit/loss percent for the day (factor of 1). Length ≥ 1.                           |
| `current_price`            | string  | **Required.** Current asset price per share. Length ≥ 1.                                                      |
| `lastday_price`            | string  | **Required.** Last day’s asset price per share based on the closing value of the last trading day. Length ≥ 1. |
| `change_today`             | string  | **Required.** Percent change from last day price (factor of 1). Length ≥ 1.                                  |
| `asset_marginable`         | boolean | **Required.** Indicates if the asset is marginable.                                                           |

### PositionClosed Response

Represents the response for each attempt to close a position when using the **Close All Positions** endpoint.

| Field    | Type   | Description                                       |
| -------- | ------ | ------------------------------------------------- |
| `symbol` | string | Symbol name of the asset.                        |
| `status` | string | HTTP status code for the attempt to close this position. |
| `body`   | object | The `Order` object associated with the closure attempt. |

### Order Object

Represents an order placed to manage positions.

| Field              | Type                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | string                       | **Required.** Order ID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `client_order_id`  | string                       | Client unique order ID. Length ≤ 128.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `created_at`       | date-time                    | Timestamp when the order was created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `updated_at`       | date-time \| null            | Timestamp when the order was last updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `submitted_at`     | date-time \| null            | Timestamp when the order was submitted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `filled_at`        | date-time \| null            | Timestamp when the order was filled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `expired_at`       | date-time \| null            | Timestamp when the order expired.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `canceled_at`      | date-time \| null            | Timestamp when the order was canceled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `failed_at`        | date-time \| null            | Timestamp when the order failed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `replaced_at`      | date-time \| null            | Timestamp when the order was replaced.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `replaced_by`      | string \| null               | The order ID that replaced this order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `replaces`         | string \| null               | The order ID that this order replaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `asset_id`         | string                       | **Required.** Asset ID (For options, represents the option contract ID).                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `symbol`           | string                       | **Required.** Asset symbol. Length ≥ 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `asset_class`      | string                       | Category of the asset. Options: `us_equity`, `us_option`, `crypto`.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `notional`         | string \| null               | Ordered notional amount. If entered, `qty` will be null. Can take up to 9 decimal points.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `qty`              | string \| null               | Ordered quantity. If entered, `notional` will be null. Can take up to 9 decimal points.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `filled_qty`       | string                       | Filled quantity. Length ≥ 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `filled_avg_price` | string \| null               | Filled average price.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `order_class`      | string                       | Order classes supported by Alpaca based on the security type:<br>**Equity trading:** `simple` (or ""), `oco`, `oto`, `bracket`.<br>**Options trading:** `simple` (or "").<br>**Crypto trading:** `simple` (or "").                                                                                                                                                                                                                                                                                                                   |
| `type`             | string                       | **Required.** Order type supported by Alpaca based on the security type:<br>**Equity trading:** `market`, `limit`, `stop`, `stop_limit`, `trailing_stop`.<br>**Options trading:** `market`, `limit`, `stop`, `stop_limit`.<br>**Crypto trading:** `market`, `limit`, `stop_limit`.                                                                                                                                                                                                                                    |
| `side`             | string                       | **Required.** Order side: `buy`, `sell`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `time_in_force`    | string                       | **Required.** Time-In-Force values supported by Alpaca based on the security type:<br>**Equity trading:** `day`, `gtc`, `opg`, `cls`, `ioc`, `fok`.<br>**Options trading:** `day`.<br>**Crypto trading:** `gtc`, `ioc`.<br><br>**Descriptions:**<br>`day`: Valid only on the day it is live.<br>`gtc`: Good until canceled.<br>`opg`: Market on open.<br>`cls`: Market on close.<br>`ioc`: Immediate or cancel.<br>`fok`: Fill or kill. |
| `limit_price`     | string \| null               | Limit price for the order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `stop_price`      | string \| null               | Stop price for the order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `status`          | string                       | Current status of the order. Possible values:<br>`new`, `partially_filled`, `filled`, `done_for_day`, `canceled`, `expired`, `replaced`, `pending_cancel`, `pending_replace`, `accepted`, `pending_new`, `accepted_for_bidding`, `stopped`, `rejected`, `suspended`, `calculated`.                                                                                                                                                                                                                                                                                     |
| `extended_hours`  | boolean                      | If `true`, eligible for execution outside regular trading hours.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `legs`            | array \| null                | Array of `Order` objects associated with this order (for non-simple `order_class` orders). Otherwise, `null`.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `trail_percent`   | string \| null               | Percent value away from the high water mark for trailing stop orders.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `trail_price`     | string \| null               | Dollar value away from the high water mark for trailing stop orders.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `hwm`             | string \| null               | Highest (lowest) market price seen since the trailing stop order was submitted.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `position_intent` | string                       | Desired position strategy. Options: `buy_to_open`, `buy_to_close`, `sell_to_open`, `sell_to_close`.                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## Error Responses

The API may return standard HTTP error codes to indicate issues with requests. Common error status codes include:

- `400 Bad Request`: The request was invalid or cannot be served. Check the request parameters.
- `401 Unauthorized`: Authentication failed or user does not have permissions for the requested operation.
- `403 Forbidden`: The request is understood, but it has been refused or access is not allowed.
- `404 Not Found`: The requested resource could not be found.
- `500 Internal Server Error`: An error occurred on the server. Retry the request or contact support if the issue persists.

Each error response typically includes a message detailing the reason for the error.

**Error Response Body Example**

```json
{
  "error": "Description of the error."
}
```

---

## Notes

- **Order Lifecycle:** An order may transition through various statuses during its lifecycle. Users should monitor order statuses to track the progress and outcome of their orders.
- **Concurrency:** When performing operations that modify positions or orders, consider potential concurrency issues and ensure idempotency where applicable.
- **Rate Limiting:** Be aware of any rate limits imposed by the API to avoid throttling or temporary bans.