# TicketHub System Design

## 1. Requirements

### Functional

- Browse and search events; view event details and a live seat map.
- Join the sale queue, hold available seats, pay for a hold, and view or cancel tickets.
- Send order confirmations and release seats when holds expire or payment fails.

### Non-functional

- **Speed:** normal event and seat reads should be fast; during a sale, return queue and seat-state updates promptly.
- **Correctness:** a seat can have at most one active hold or completed sale; payments and order updates must be idempotent.
- **Fairness:** use a visible, first-come-first-served virtual queue, admit buyers at a controlled rate, limit seats per account, and prevent refreshes from jumping the queue.
- **Availability and security:** multiple app instances, backups, encrypted connections, authenticated purchases, and auditable order changes.

## 2. Traffic estimates

Assumptions: one day is 86,400 seconds; normal-day page views are spread evenly for the average; the sale's 200,000 visitors each make at least one seat-purchase attempt during the ten-minute window. These are average rates, not a claim that traffic is perfectly uniform.

### Normal day

- Page views: `50,000 visitors x 10 pages = 500,000 views/day`.
- Average page/API reads: `500,000 / 86,400 = 5.79 requests/second`.
- Ticket sales: `5,000 / 86,400 = 0.058 sales/second` on average.

### Popular concert sale

- Purchase attempts: `200,000 people / 600 seconds = 333.3 attempts/second` during the first ten minutes.
- There are 20,000 seats, so demand is `10 people per seat`; only one in ten attempts can ultimately buy a seat if everyone requests one.
- The purchase-attempt rate is about `333.3 / 5.79 = 57.6x` the normal average page-read rate. Browsing traffic may raise the request rate further, so the queue and load tests should allow headroom.

The big sale is a short, read-and-write contention spike. Cache event details and static seat-map data, but always verify seat availability and reserve seats on the authoritative database.

## 3. API

All purchase endpoints require authentication. Mutating requests accept an `Idempotency-Key` so retrying a timed-out request cannot create a second order or charge.

- `GET /events?query=&date=` - Search upcoming events; `200 OK`.
- `GET /events/{eventId}` - Read event details and venue information; `200 OK`.
- `GET /events/{eventId}/seats` - Read seat availability and prices; `200 OK`.
- `POST /events/{eventId}/holds` - Request a short hold for seat IDs; `201 Created` when all requested seats are held, otherwise `409 Conflict`.
  Example body: `{"seatIds":[101,102]}`.
- `POST /orders/{orderId}/payment` - Pay for an active hold; `200 OK` for a confirmed payment, `402 Payment Required` if declined.
  Example body: `{"paymentMethodToken":"tok_example"}`.
- `GET /users/me/tickets` - List the authenticated user's confirmed tickets; `200 OK`.
- `DELETE /holds/{holdId}` - Release the user's unexpired hold; `204 No Content`.

## 4. Data model

- **users** (`user_id` PK, `email` UNIQUE, `created_at`): account and buyer identity.
- **events** (`event_id` PK, `title`, `venue`, `starts_at`, `sale_opens_at`): event catalogue and sale schedule.
- **seats** (`seat_id` PK, `event_id` FK, `section`, `row_label`, `seat_number`, `price`, `state`, `hold_order_id` nullable FK, `hold_expires_at` nullable): one inventory record per event seat; `UNIQUE(event_id, section, row_label, seat_number)` prevents duplicate seat definitions.
- **orders** (`order_id` PK, `user_id` FK, `event_id` FK, `status`, `idempotency_key`, `created_at`, `expires_at`): purchase attempt and hold/payment state; `UNIQUE(user_id, idempotency_key)` makes retries safe.
- **order_items** (`order_id` FK, `seat_id` FK, `price_paid`, composite PK `(order_id, seat_id)`, `UNIQUE(seat_id)`): associates seats with orders and records the final price.

A user can have many orders, and an event has many seats and orders: these are one-to-many relationships. Orders and seats are many-to-many in the general order model, represented by `order_items`; the unique `seat_id` rule ensures a seat appears in at most one committed order. Seat state and its current hold are tracked on the seat inventory row so competing requests can claim it atomically. Expired or cancelled holds clear `hold_order_id` and expiry before the seat becomes available again; confirmed sales remain assigned to their order.

## 5. Architecture

```text
                 +-------------------+
                 | Web / Mobile App  |
                 +---------+---------+
                           |
                    +------v------+
                    | DNS / CDN   |---- static assets and cached event data
                    +------+------+
                           |
                    +------v------+
                    | API Gateway |
                    +------+------+
                           |
              +------------v-------------+
              | Virtual Waiting Room     |
              | FIFO queue + rate control|
              +------------+-------------+
                           |
                    +------v------+
                    | Load Balancer|
                    +---+-------+--+
                        |       |
                  +-----v--+ +--v-----+
                  | App 1  | | App 2  |  ... stateless instances
                  +--+--+--+ +--+--+--+
                     |         |
             reads   |         | writes / seat holds
                +----v---+  +--v----------------+
                | Cache |  | Primary SQL DB    |
                +--------+  | seats/orders      |
                            +--+-------------+---+
                               |             |
                         replication       events
                               |             v
                         +-----v----+   +---+-------+
                         | Read     |   | Job Queue |
                         | Replica  |   +---+-------+
                         +----------+       |
                                      +-----v------+
                                      | Workers    |
                                      | expiry,    |
                                      | payment,   |
                                      | email      |
                                      +------------+
```

### Components

- **Web/mobile app:** Lets buyers browse events, join the queue, choose seats, and manage tickets.
- **DNS/CDN:** Resolves service names and serves static assets and cacheable event information close to buyers.
- **API gateway:** Authenticates requests, validates basic input, and applies rate limits.
- **Virtual waiting room:** Preserves queue order and releases buyers at a rate the inventory database can handle.
- **Load balancer:** Routes admitted requests to healthy application instances.
- **App instances:** Run the stateless event, hold, order, and ticket APIs so capacity can scale horizontally.
- **Cache:** Speeds up event details and non-authoritative seat-map display, but never decides who owns a seat.
- **Primary SQL database:** Serializes seat claims and commits orders transactionally as the source of truth.
- **Read replica:** Serves catalogue and ticket-history reads to reduce load on the primary.
- **Job queue:** Buffers asynchronous payment, notification, and hold-expiry work during bursts.
- **Workers:** Process queued jobs, retry transient failures, and release expired holds safely.

## 6. Preventing double-booking and trade-offs

### Seat reservation correctness

When a buyer requests seats, the application starts a database transaction and conditionally changes each requested seat from `available` to `held`, setting the order ID and a short expiry. The update succeeds only where the current state is still `available`. The application checks that every requested seat changed; if even one did not, it rolls back the whole transaction and returns `409 Conflict`. The primary database serializes concurrent writes, so two buyers cannot both change the same seat from available. On payment success, one transaction marks the order paid, changes its held seats to sold, and inserts order items; uniqueness constraints are a final guard against duplicate assignment. Payment uses the same idempotency key on retries. A worker releases only seats whose hold still belongs to the expired order, preventing an old expiry job from releasing a newer buyer's hold.

### Trade-offs

- **Fair queue versus instant access:** A FIFO waiting room is fairer and protects the database, but some buyers wait longer and queue operations add infrastructure; publish queue position and estimated wait so the process is visible.
- **Strong consistency versus availability:** Keeping seat reservations on one authoritative SQL primary prevents conflicting sales, but writes depend on primary health; use synchronous transaction commits, automated failover, and reject purchases briefly rather than sell uncertain inventory.
- **Short versus long holds:** Short holds return abandoned seats quickly, but buyers may lose seats while completing payment; make the expiry visible and allow a limited, safe payment grace period without releasing a seat already being finalized.
- **Cached seat maps versus freshness:** Cached maps improve speed but may briefly show stale availability; label them as indicative and recheck atomically when a hold is requested.
