# 👟 HypeDrop - Real-Time Inventory System

HypeDrop is a high-performance, real-time sneaker release platform. The system ensures fairness through atomic transactions and builds user excitement through live WebSocket updates.

## 🛠 Tech Stack

* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI.
* **State Management:** React Context API (Auth) + Socket.io-client.
* **Backend:** Node.js, Express, Socket.io.
* **Database:** PostgreSQL with Prisma ORM.

---

## 🏗 Key Architectural Choices

### 1. Concurrency: Preventing the "Double-Sell"

In a high-traffic drop, the biggest risk is **Race Conditions** when two users attempt to reserve the last item at the exact same millisecond.

To solve this, we implemented **Pessimistic Row-Level Locking** in the database.

* **How it works:** When a reservation request hits the server, we use a raw SQL query: `SELECT * FROM "Drop" WHERE id = ${dropId} FOR UPDATE`.
* **The Result:** This "locks" the specific sneaker row in PostgreSQL. Any other concurrent request for the same sneaker is forced to wait until the first transaction is committed or rolled back. We check the stock *inside* this lock, making it physically impossible to oversell the inventory.

### 2. The 60-Second "Hold & Release" Logic

We needed a way to hold inventory for serious buyers without letting "ghost" reservations permanently deplete the stock.

* **The Hold:** Upon a successful reservation, a record is created with a `status` of `PENDING` and an `expiresAt` timestamp set to 60 seconds in the future.
* **The Background Worker:** The backend runs a "Sweeper Service" (cron-like interval). Every 5 seconds, it queries the database for any `PENDING` reservations that have passed their `expiresAt` time.
* **The Recovery:** Expired reservations are deleted, and the inventory is incremented back. A `STOCK_UPDATED` event is immediately broadcasted via **Socket.io**, making the item "pop" back into stock for all users on the dashboard without a page refresh.

---

## 🚦 Getting Started

### 1. Database Schema

Ensure your PostgreSQL instance is running. Our Prisma schema should look like this:

```prisma
// schema.prisma
model User {
  id           String        @id @default(uuid())
  username     String        @unique
  password     String
  reservations Reservation[]
  purchases    Purchase[]
}

model Drop {
  id             String        @id @default(uuid())
  name           String
  price          Float
  totalStock     Int
  availableStock Int 
  createdAt      DateTime      @default(now())
  reservations   Reservation[]
  purchases      Purchase[]
}

model Reservation {
  id        String   @id @default(uuid())
  userId    String
  dropId    String
  expiresAt DateTime
  status    String   @default("PENDING") // PENDING, BOUGHT, EXPIRED
  drop      Drop     @relation(fields: [dropId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model Purchase {
  id        String   @id @default(uuid())
  userId    String
  dropId    String
  createdAt DateTime @default(now())
  drop      Drop     @relation(fields: [dropId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

```

### 2. Backend Setup

2. Set up your `.env` with `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.
3. Run migrations: `npx prisma migrate dev`.
4. Start server: `npm run dev`.

---

Thanks

---