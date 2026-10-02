"use client";

import { useState } from "react";
import { ArrowRight, CheckCheck, CircleCheck, MessageCircle, MoreHorizontal, Package, Phone, Plus, Send, ShieldCheck, Store as StoreIcon, X, Zap, RefreshCw, LoaderCircle, ShoppingBag, PauseCircle } from "lucide-react";
import type { Product, Order } from "@/lib/types";
import { rupees } from "@/lib/types";
import type { NovaEngine } from "./use-nova";
import ProductArt from "./product-art";
import { ConfidenceBadge, relativeTime } from "./ui";

export default function Merchant({ engine, storeId, setStoreId }: { engine: NovaEngine; storeId: string; setStoreId: (id: string) => void }) {
  const { snapshot, ready, busy, mutate, refresh } = engine;
  const store = snapshot.stores.find(candidate => candidate.id === storeId) ?? snapshot.stores[0];
  const catalog = snapshot.products.filter(product => product.storeId === store.id);
  const [selectedId, setSelectedId] = useState(`${storeId}-butter`);
  const selectedProduct = catalog.find(product => product.id === selectedId) ?? catalog[0];
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<{ text: string; confirmation: string }[]>([]);
  const [showOrder, setShowOrder] = useState(true);
  const pending = snapshot.orders.find(order => order.storeId === store.id && order.status === "pending");
  const latestOrder = snapshot.orders.find(order => order.storeId === store.id);
  const availableCount = catalog.filter(product => product.isAvailable && product.quantity > 0).length;

  async function reply(text: string) {
    if (!selectedProduct) return;
    const result = await mutate<{ product: Product; message: string }>("webhook/whatsapp", { text, productId: selectedProduct.id }, text === "1" ? "Stock confirmed. Your online catalog is up to date." : "Product hidden. Every shopper sees the update instantly.");
    if (result) { setReplies(previous => [...previous, { text: text === "1" ? "1 — Yes, in stock" : "2 — No, sold out", confirmation: result.message }]); setMessage(""); }
  }

  async function sendMessage() {
    if (!["1", "2"].includes(message.trim())) { engine.notify("This simulator accepts 1 for in stock or 2 for sold out.", true); return; }
    await reply(message.trim());
  }

  async function incomingOrder() {
    if (pending) { setShowOrder(true); return; }
    const product = catalog.find(candidate => candidate.isAvailable && candidate.visible && candidate.quantity > 0);
    if (!product) { engine.notify("Confirm a product is in stock before creating an order request.", true); return; }
    const result = await mutate<{ order: Order }>("orders/create", { productId: product.id, quantity: 1 }, "A new demo order is waiting for your response.");
    if (result) setShowOrder(true);
  }

  return <div className="view-enter merchant-view">
    <div className="workspace-context"><div className="context-store"><span className="store-avatar"><StoreIcon size={20} /></span><div><label htmlFor="merchant-store">YOUR STOREFRONT</label><select id="merchant-store" value={store.id} onChange={event => { setStoreId(event.target.value); setReplies([]); setSelectedId(""); setShowOrder(true); }}>{snapshot.stores.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></div><ConfidenceBadge score={store.syncConfidenceScore} /></div><button className="button button-outline" onClick={incomingOrder} disabled={!ready || !!busy || (!store.isAcceptingOrders && !pending)}><ShoppingBag size={16} />{pending ? "Review incoming order" : "Simulate incoming order"}</button></div>
    <div className="merchant-grid">
      <section className="panel conversation-panel">
        <div className="section-heading"><div><h2>Your shop, one reply away.</h2><p>Zero dashboards to maintain. Just a conversation.</p></div><span className="simulator-tag">WhatsApp simulator</span></div>
        <div className="phone-shell">
          <div className="phone-status"><strong>9:41</strong><div><span className="signal-bars">▂▄▆</span><span className="phone-battery" /></div></div>
          <div className="whatsapp-header"><span className="bot-avatar"><Zap size={22} fill="currentColor" /></span><div><strong>Nova Sync Bot <ShieldCheck size={13} /></strong><span>Always here for your neighborhood</span></div><Phone size={17} /><MoreHorizontal size={19} /></div>
          <div className="chat-thread"><span className="chat-date">TODAY</span><div className="chat-bubble"><p>Hi {store.owner}! <span className="wave-text">Good to check in.</span></p><p>We noticed you usually sell out of <strong>{selectedProduct?.name} {selectedProduct?.unit}</strong> on Friday afternoons.</p><p>Do you have it in stock right now?</p><span className="chat-timestamp">Nova Sync · delivered <CheckCheck size={12} /></span></div>
            <div className="chat-bubble reply-bubble"><p>Reply <strong>1</strong> for Yes, <strong>2</strong> for No.<br />We’ll take care of the rest.</p><div className="chat-reply-buttons"><button onClick={() => reply("1")} disabled={!ready || !!busy}>{busy === "webhook/whatsapp" ? <LoaderCircle size={15} className="spin" /> : <CircleCheck size={15} />}1 · Yes, in stock</button><button onClick={() => reply("2")} disabled={!ready || !!busy}><X size={15} />2 · No, sold out</button></div></div>
            {replies.map((entry, index) => <div className="chat-exchange" key={`${selectedProduct?.id}-${index}`}><div className="chat-bubble outgoing"><p>{entry.text}</p><span className="chat-timestamp">Just now <CheckCheck size={12} /></span></div><div className="chat-bubble confirmation-bubble"><CircleCheck size={17} /><p>{entry.confirmation}</p></div></div>)}
            <div className="chat-security"><ShieldCheck size={11} />Securely orchestrated by Nova Sync</div>
          </div>
          <form className="chat-input" onSubmit={event => { event.preventDefault(); void sendMessage(); }}><input aria-label="Reply to the stock check with 1 or 2" value={message} onChange={event => setMessage(event.target.value)} placeholder="Type 1 or 2…" maxLength={50} disabled={!ready || !!busy} /><button type="submit" aria-label="Send reply" disabled={!ready || !!busy || !message}><Send size={18} /></button></form>
        </div>
        <div className="conversation-note"><span className="note-icon"><Zap size={16} /></span><p>A single reply updates your storefront, protects checkout, and creates an audit trail. <strong>No manual catalog edits.</strong></p></div>
      </section>

      <section className="panel catalog-panel"><div className="section-heading"><div><span className="eyebrow">THE LIVE MIRROR</span><h2>Your online shelves.</h2><p>What your customers see, in real time.</p></div><button className="icon-button" onClick={() => refresh()} aria-label="Refresh catalog"><RefreshCw size={17} /></button></div>
        <div className="catalog-toolbar"><div className="filter-tabs">{[{ id: "all", title: `All products (${catalog.length})` }, { id: "available", title: "In stock" }, { id: "unavailable", title: "Out of stock" }].map(tab => <button className={filter === tab.id ? "selected" : ""} onClick={() => setFilter(tab.id)} key={tab.id}>{tab.title}</button>)}</div><span className="live-stream"><span className="status-dot" />{ready ? "Live catalog" : "Preview"}</span></div>
        <div className="merchant-product-grid">{catalog.filter(product => filter === "all" || (filter === "available" ? product.isAvailable && product.quantity > 0 : !product.isAvailable || product.quantity === 0)).map(product => {
          const inStock = product.isAvailable && product.quantity > 0;
          return <button className={`merchant-product ${!inStock ? "product-oos" : ""} ${selectedProduct?.id === product.id ? "product-selected" : ""}`} key={product.id} onClick={() => { setSelectedId(product.id); setReplies([]); }} aria-label={`Ask about ${product.name}, ${inStock ? "in stock" : "out of stock"}`}><div className="product-image-wrap"><ProductArt kind={product.kind} /><span className={`badge ${inStock ? "badge-white" : "badge-red"}`}><span className="status-dot" />{inStock ? "In stock" : "Out of stock"}</span>{selectedProduct?.id === product.id && <span className="selected-check"><CheckCheck size={13} /></span>}</div><div className="product-body"><strong>{product.name}</strong><span>{product.unit}</span><div className="product-price"><strong>{rupees(product.price)}</strong><small>{inStock ? `${product.quantity} units` : "0 units"}</small></div><div className={`visibility-label ${!product.visible ? "hidden-label" : ""}`}><span className="status-dot" />{product.visible ? "Visible in storefront" : "Hidden from storefront"}</div></div></button>;
        })}</div>
        {filter === "unavailable" && availableCount === catalog.length && <div className="empty-state"><CircleCheck size={30} /><h3>All stocked up.</h3><p>Every product is currently available. Try replying “2” to see a live stock update.</p></div>}
        <div className="catalog-bottom"><ShieldCheck size={15} /><span>Click a product to check its stock in the simulator.</span><span suppressHydrationWarning>Synced {relativeTime(store.lastInventorySync)}</span></div>
      </section>
    </div>
    <div className={`merchant-availability ${!store.isAcceptingOrders ? "store-paused" : ""}`}><span className="availability-icon">{store.isAcceptingOrders ? <CircleCheck size={22} /> : <PauseCircle size={22} />}</span><div><strong>{store.isAcceptingOrders ? "Walk-ins piling up? Your storefront can wait." : "Take a breath. Your storefront is paused."}</strong><p>{store.isAcceptingOrders ? "Pause new orders when the shop gets busy. We’ll guide shoppers to a nearby alternative." : "New checkout requests are blocked until you’re ready. Existing orders keep their audit trail."}</p></div><button className="button button-outline" disabled={!ready || !!busy} onClick={() => mutate("stores/status", { storeId: store.id, accepting: !store.isAcceptingOrders }, store.isAcceptingOrders ? "New orders paused. Take care of your walk-ins." : "You’re accepting neighborhood orders again.")}>{store.isAcceptingOrders ? "Pause new orders" : "Resume accepting orders"}</button></div>
    {pending && showOrder && <div className="order-popup" role="dialog" aria-labelledby="order-popup-title"><div className="order-popup-top"><span className="eyebrow"><span className="status-dot" />INCOMING ORDER REQUEST</span><button className="icon-button" aria-label="Minimize incoming order" onClick={() => setShowOrder(false)}><X size={17} /></button></div><div className="order-popup-title"><span><ShoppingBag size={24} /></span><div><h3 id="order-popup-title">A neighbor is waiting.</h3><p>{pending.id} · {pending.customer}</p></div><strong>{rupees(pending.amount)}</strong></div><div className="order-items">{pending.items.map(item => <span key={item.productId}>{item.quantity} × {item.name}</span>)}</div><div className="order-popup-note"><ShieldCheck size={13} />Rejecting safely triggers an automated simulated refund.</div><div className="order-popup-actions"><button className="button button-primary" disabled={!ready || !!busy} onClick={() => mutate("orders/accept", { orderId: pending.id }, "Order accepted. Your shopper has been notified.")}>{busy === "orders/accept" ? <LoaderCircle size={16} className="spin" /> : <CheckCheck size={16} />}Accept order</button><button className="button button-reject" disabled={!ready || !!busy} onClick={() => mutate("orders/cancel", { orderId: pending.id, reason: "merchant_busy" }, "Simulated refund dispatched. Support ticket resolved automatically.")}>{busy === "orders/cancel" ? <LoaderCircle size={16} className="spin" /> : <X size={16} />}Reject · too busy</button></div></div>}
    {!pending && latestOrder && <div className="last-order-note"><CircleCheck size={15} />Latest request {latestOrder.id}: {latestOrder.status}.{latestOrder.refundStatus === "completed" ? " Simulated refund completed; support ticket automatically closed." : " Your customer sees the confirmation instantly."}</div>}
  </div>;
}
