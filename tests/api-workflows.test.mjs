import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = "http://localhost:8889";
const productId = "ramesh-butter";
const storeId = "ramesh";
const testOptions = { timeout: 90_000 };

async function createSession() {
  let cookie = "";

  async function request(path, { method = "GET", body, origin = baseUrl, expectedStatus = 200 } = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}/api/v1${path}`, {
        method,
        headers: {
          ...(cookie ? { Cookie: cookie } : {}),
          ...(method !== "GET" ? { Origin: origin, "Content-Type": "application/json" } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error("API request failed. Start Netlify Dev on port 8889 with a linked Netlify Database site.");
    }

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      assert.ok(/(?:^|;\s*)HttpOnly(?:;|$)/i.test(setCookie), "Workspace cookies must be HTTP-only.");
      assert.ok(/SameSite=Strict/i.test(setCookie), "Local HTTP cookies must use SameSite Strict.");
      const workspaceCookie = setCookie.match(/(?:^|,\s*)(nova_workspace=[^;]+)/);
      assert.ok(Boolean(workspaceCookie), "The API must set a workspace cookie.");
      cookie = workspaceCookie[1];
    }

    if (expectedStatus !== null) {
      assert.equal(response.status, expectedStatus, `${method} ${path} returned an unexpected status.`);
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The API did not return JSON. Use Netlify Dev rather than standalone Next.js.");
    }
    return { status: response.status, data, headers: response.headers };
  }

  const initial = await request("/state");
  assert.ok(Boolean(cookie), "A new session must receive a workspace cookie.");
  assert.equal(initial.headers.get("cache-control"), "no-store");
  return {
    initial: initial.data,
    request,
    state: async () => (await request("/state")).data,
    post: async (path, body, expectedStatus = 200) => (await request(path, { method: "POST", body, expectedStatus })).data,
  };
}

function productFrom(snapshot, selectedId = productId) {
  const product = snapshot.products.find(candidate => candidate.id === selectedId);
  assert.ok(Boolean(product), "The expected sample product must exist.");
  return product;
}

function orderFrom(snapshot, orderId) {
  const order = snapshot.orders.find(candidate => candidate.id === orderId);
  assert.ok(Boolean(order), "The order must be persisted in the session snapshot.");
  return order;
}

async function confirmStock(session) {
  await session.post("/webhook/whatsapp", { productId, text: "1" });
  return productFrom(await session.state());
}

async function createOrder(session, quantity = 1) {
  return (await session.post("/orders/create", { productId, quantity, price: 1, amount: 1 }, 201)).order;
}

test("checkout uses persisted prices and acceptance retries do not reserve stock twice", testOptions, async () => {
  const session = await createSession();
  const product = await confirmStock(session);
  const order = await createOrder(session, 2);
  assert.equal(order.amount, product.price * 2);
  assert.equal(order.items[0].price, product.price);
  assert.equal(order.status, "pending");
  assert.equal(productFrom(await session.state()).quantity, product.quantity - 2);

  await session.post("/orders/accept", { orderId: order.id });
  await session.post("/orders/accept", { orderId: order.id });
  const accepted = await session.state();
  assert.equal(orderFrom(accepted, order.id).status, "accepted");
  assert.equal(productFrom(accepted).quantity, product.quantity - 2);
  assert.equal(accepted.events.filter(event => event.orderId === order.id && event.trigger === "Merchant accepted order").length, 1);

  await session.post("/orders/cancel", { orderId: order.id, reason: "customer_request" });
  assert.equal(productFrom(await session.state()).quantity, product.quantity);
});

test("simultaneous cancellations issue one simulated refund and resolve one ticket", testOptions, async () => {
  const session = await createSession();
  const product = await confirmStock(session);
  const order = await createOrder(session, 2);
  const results = await Promise.all([
    session.post("/orders/cancel", { orderId: order.id, reason: "customer_request" }),
    session.post("/orders/cancel", { orderId: order.id, reason: "customer_request" }),
  ]);
  assert.deepEqual(results.map(result => result.alreadyProcessed).sort(), [false, true]);
  for (const result of results) {
    assert.equal(result.simulated, true);
    assert.equal(result.order.refundReference, `SIM-${order.id}`);
    assert.equal(result.order.refundStatus, "completed");
  }
  const snapshot = await session.state();
  assert.equal(orderFrom(snapshot, order.id).status, "cancelled");
  assert.equal(productFrom(snapshot).quantity, product.quantity);
  const tickets = snapshot.tickets.filter(ticket => ticket.orderId === order.id);
  assert.equal(tickets.length, 1);
  assert.equal(tickets[0].status, "closed");
  assert.equal(tickets[0].autoResolved, true);
  assert.equal(snapshot.events.filter(event => event.orderId === order.id && event.type === "refund").length, 1);
  await session.post("/orders/accept", { orderId: order.id }, 409);
});

test("sold-out stock blocks checkout and disappears from catalog search", testOptions, async () => {
  const session = await createSession();
  const before = await session.state();
  await session.post("/webhook/whatsapp", { productId, text: "2" });
  await session.post("/orders/create", { productId, quantity: 1 }, 409);
  const snapshot = await session.state();
  const product = productFrom(snapshot);
  assert.equal(product.isAvailable, false);
  assert.equal(product.visible, false);
  assert.equal(product.quantity, 0);
  assert.equal(snapshot.orders.length, before.orders.length);
  assert.equal(snapshot.events.filter(event => event.type === "deflection").length, before.events.filter(event => event.type === "deflection").length + 1);
  const catalog = (await session.request("/catalog/search?q=Amul%20Butter&city=Bengaluru")).data;
  assert.ok(!catalog.products.some(candidate => candidate.id === productId));
  assert.ok(catalog.alternatives.length > 0);
});

test("cancellation releases a reservation without reversing explicit sold-out flags", testOptions, async () => {
  const session = await createSession();
  await confirmStock(session);
  const order = await createOrder(session, 2);
  await session.post("/webhook/whatsapp", { productId, text: "2" });
  await session.post("/orders/accept", { orderId: order.id }, 409);
  await session.post("/orders/cancel", { orderId: order.id, reason: "inventory_mismatch" });
  const product = productFrom(await session.state());
  assert.equal(product.quantity, 2);
  assert.equal(product.isAvailable, false);
  assert.equal(product.visible, false);
  await session.post("/orders/create", { productId, quantity: 1 }, 409);
});

test("merchant-busy cancellation pauses checkout until the store resumes", testOptions, async () => {
  const session = await createSession();
  await confirmStock(session);
  const order = await createOrder(session);
  await session.post("/orders/cancel", { orderId: order.id, reason: "merchant_busy" });
  assert.equal((await session.state()).stores.find(store => store.id === storeId).isAcceptingOrders, false);
  await session.post("/orders/create", { productId, quantity: 1 }, 409);
  await session.post("/stores/status", { storeId, accepting: true });
  const resumedOrder = await createOrder(session);
  await session.post("/orders/cancel", { orderId: resumedOrder.id, reason: "customer_request" });
});

test("concurrent checkout cannot oversell inventory", testOptions, async () => {
  const session = await createSession();
  const product = await confirmStock(session);
  assert.equal(product.quantity, 12);
  const results = await Promise.all(Array.from({ length: 3 }, () => session.request("/orders/create", {
    method: "POST", body: { productId, quantity: 5 }, expectedStatus: null,
  })));
  assert.deepEqual(results.map(result => result.status).sort(), [201, 201, 409]);
  assert.equal(productFrom(await session.state()).quantity, 2);
  for (const result of results.filter(candidate => candidate.status === 201)) {
    await session.post("/orders/cancel", { orderId: result.data.order.id, reason: "customer_request" });
  }
  assert.equal(productFrom(await session.state()).quantity, product.quantity);
});

test("invalid quantities, stale inventory and foreign origins cannot create orders", testOptions, async () => {
  const session = await createSession();
  for (const quantity of [0, 6, 1.5, "1"]) {
    await session.post("/orders/create", { productId, quantity }, 400);
  }
  await session.post("/orders/create", { productId: "missing-product", quantity: 1 }, 404);
  await session.post("/orders/create", { productId: "corner-shop-coffee", quantity: 1 }, 409);
  await session.request("/webhook/whatsapp", {
    method: "POST", body: { productId, text: "2" }, origin: "https://example.invalid", expectedStatus: 403,
  });
  const snapshot = await session.state();
  assert.equal(snapshot.orders.length, session.initial.orders.length);
  assert.equal(productFrom(snapshot).isAvailable, true);
});

test("separate cookies isolate orders and stock while snapshots omit workspace identifiers", testOptions, async () => {
  const first = await createSession();
  const second = await createSession();
  await confirmStock(first);
  const order = await createOrder(first);
  await second.post("/orders/accept", { orderId: order.id }, 404);
  await second.post("/orders/cancel", { orderId: order.id, reason: "customer_request" }, 404);
  await first.post("/webhook/whatsapp", { productId, text: "2" });
  const firstSnapshot = await first.state();
  const secondSnapshot = await second.state();
  assert.equal(productFrom(firstSnapshot).isAvailable, false);
  assert.equal(productFrom(secondSnapshot).isAvailable, true);
  assert.ok(!secondSnapshot.orders.some(candidate => candidate.id === order.id));
  for (const snapshot of [firstSnapshot, secondSnapshot]) {
    assert.ok(!/"workspace(?:Id|_id)"/.test(JSON.stringify(snapshot)), "Snapshots must not expose workspace identifiers.");
  }
  await first.post("/orders/cancel", { orderId: order.id, reason: "customer_request" });
});
