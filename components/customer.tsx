"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CircleCheck, Clock3, Heart, Leaf, LoaderCircle, MapPin, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Store as StoreIcon, Truck, Wallet, Zap } from "lucide-react";
import type { City, Order, SearchResult, Product } from "@/lib/types";
import { confidence, matchesProduct, rupees } from "@/lib/types";
import type { NovaEngine } from "./use-nova";
import { BestSellerBadge, ConfidenceBadge, StatusBadge } from "./ui";
import ProductArt from "./product-art";

export default function Customer({ engine, city, query, setQuery, onOrderStore }: { engine: NovaEngine; city: City; query: string; setQuery: (value: string) => void; onOrderStore: (storeId: string) => void }) {
  const { snapshot, ready, busy, mutate, notify } = engine;
  const [storeFilter, setStoreFilter] = useState("all");
  const [category, setCategory] = useState("All essentials");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const localStores = snapshot.stores.filter(store => city === "All cities" || store.city === city);
  const localIds = new Set(localStores.map(store => store.id));
  const acceptingStoreIds = new Set(localStores.filter(store => store.isAcceptingOrders).map(store => store.id));
  const revision = snapshot.events[0]?.id;

  useEffect(() => { setStoreFilter("all"); setShowAll(false); }, [city]);
  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const parameters = new URLSearchParams({ q: query, city });
        if (storeFilter !== "all") parameters.set("storeId", storeFilter);
        const response = await fetch(`/api/v1/catalog/search?${parameters}`, { signal: abort.signal });
        if (!response.ok) throw new Error("Search is temporarily unavailable. Your catalog is still visible; try again.");
        const result = await response.json() as SearchResult;
        if (!abort.signal.aborted) setSearchResult(result);
      } catch (error) { if (!abort.signal.aborted) notify(error instanceof Error ? error.message : "Unable to search right now.", true); }
      finally { if (!abort.signal.aborted) setSearching(false); }
    }, 350);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [query, city, storeFilter, ready, revision, notify]);

  const available = snapshot.products.filter(product => acceptingStoreIds.has(product.storeId) && (storeFilter === "all" || product.storeId === storeFilter) && product.isAvailable && product.visible && product.quantity > 0 && confidence(product.lastInventorySync) >= 60);
  const directMatches = available.filter(product => matchesProduct(product, query));
  const fallback = Boolean(query.trim() && directMatches.length === 0);
  const availableIds = new Set(available.map(product => product.id));
  const recommendations = searchResult?.isFallback ? searchResult.alternatives.filter(product => availableIds.has(product.id)) : [];
  const candidates = fallback ? recommendations.length ? recommendations : available.filter(product => product.category === "Local finds").concat(available.filter(product => product.category !== "Local finds")) : directMatches;
  const products = candidates.filter(product => category === "All essentials" || product.category === category);
  const displayedProducts = showAll ? products : products.slice(0, 8);
  const order = snapshot.orders.find(candidate => candidate.id === trackedOrderId) ?? snapshot.orders.find(candidate => candidate.customer === "You · Demo shopper") ?? snapshot.orders.find(candidate => candidate.id === "NC-48302") ?? snapshot.orders.find(candidate => localIds.has(candidate.storeId));
  const trackedStore = snapshot.stores.find(store => store.id === order?.storeId);
  const refundProcessing = busy === "orders/cancel";

  async function quickOrder(product: Product) {
    const result = await mutate<{ order: Order }>("orders/create", { productId: product.id, quantity: 1 }, "Demo order placed. Switch to Merchant view to accept or reject it.");
    if (result) { setTrackedOrderId(result.order.id); onOrderStore(result.order.storeId); document.getElementById("order-tracker")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  return <div className="view-enter customer-view">
    <section className="shopper-banner"><div><span className="eyebrow"><MapPin size={13} />YOUR NEIGHBORHOOD, DELIVERED</span><h2>Fresh from around the corner.</h2><p>Real local stores. Stock you can trust. No unwelcome surprises.</p><div className="shopper-promises"><span><ShieldCheck size={14} />Stock checked at checkout</span><span><Truck size={14} />20–30 min estimate</span><span><Heart size={14} />Local by nature</span></div></div><div className="shopper-banner-art" aria-hidden="true"><div className="shopper-store-roof" /><div className="shopper-store"><StoreIcon size={47} /><span>YOUR LOCAL</span></div><span className="floating-leaf"><Leaf size={22} /></span><span className="floating-check"><Check size={20} /></span></div></section>
    <div className="shopper-search-row"><div className="shopper-search"><Search size={19} /><input aria-label="Search local products" value={query} onChange={event => { setQuery(event.target.value); setShowAll(false); }} placeholder="Find butter, fresh bread, or a little local discovery…" maxLength={120} />{searching ? <LoaderCircle size={16} className="spin" /> : <span className="search-shortcut">LOCAL FINDS</span>}</div><label className="shopper-store-select"><StoreIcon size={16} /><select aria-label="Filter by store" value={storeFilter} onChange={event => setStoreFilter(event.target.value)}><option value="all">All nearby stores</option>{localStores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label></div>
    <div className="store-tiles">{localStores.slice(0, 3).map((store, storeIndex) => <button className={`store-tile ${storeFilter === store.id ? "store-tile-selected" : ""}`} key={store.id} onClick={() => setStoreFilter(current => current === store.id ? "all" : store.id)}><span className={`store-avatar avatar-${storeIndex}`}><StoreIcon size={20} /></span><div><strong>{store.name}</strong><span>{store.address}</span>{store.bestSeller && <BestSellerBadge />}{store.isAcceptingOrders ? <ConfidenceBadge score={store.syncConfidenceScore} /> : <span className="badge badge-amber">Orders paused · store busy</span>}</div><ArrowUpRight size={16} /></button>)}</div>
    <div className="shopper-categories">{["All essentials", "Dairy", "Bakery", "Produce", "Local finds"].map(value => <button className={value === category ? "selected" : ""} onClick={() => setCategory(value)} key={value}>{value === "Local finds" && <Sparkles size={14} />}{value}</button>)}</div>
    {fallback ? <div className="fallback-banner"><span><Sparkles size={23} /></span><div><h3>A little detour. A local discovery.</h3><p>Sorry, “{query}” is temporarily unavailable nearby. Based on your preferences, here are unique items available right now at your neighborhood stores.</p></div><span className="badge badge-green">Smart alternatives</span></div> : <div className="products-section-heading"><div><h2>{category === "Local finds" ? "Only in your neighborhood." : query ? `Found around the corner` : "Your everyday favorites."}</h2><p>{query ? `Available matches for “${query}”` : "A little closer. A lot fresher."}</p></div><span>{products.length} available products</span></div>}
    <div className="shopper-product-grid">{displayedProducts.map(product => {
      const store = snapshot.stores.find(candidate => candidate.id === product.storeId);
      return <article className="shopper-product" key={product.id}><div className="product-image-wrap"><ProductArt kind={product.kind} /><span className="badge badge-white"><span className="status-dot" />In stock</span>{product.category === "Local finds" && <span className="local-find-marker"><Sparkles size={13} /></span>}</div><div className="product-body"><span className="product-store"><StoreIcon size={11} />{store?.name}</span>{store?.bestSeller && <BestSellerBadge />}<h3>{product.name}</h3><span>{product.unit}</span><div className="product-price"><strong>{rupees(product.price)}</strong><button className="quick-order-button" disabled={!ready || !!busy} onClick={() => quickOrder(product)} aria-label={`Place a demo order for ${product.name}`}><Plus size={15} />Quick order</button></div></div></article>;
    })}</div>
    {!products.length && <div className="empty-state"><ShoppingBag size={32} /><h3>A quiet shelf, not a dead end.</h3><p>Try another category or nearby store to discover something in stock.</p><button className="button button-outline" onClick={() => { setCategory("All essentials"); setStoreFilter("all"); setQuery(""); }}>Explore all local essentials<ArrowRight size={15} /></button></div>}
    {products.length > 8 && !showAll && <div className="show-more"><button className="button button-outline" onClick={() => setShowAll(true)}>Show all {products.length} products<ArrowRight size={15} /></button></div>}
    <div className="shopper-bottom-grid"><section className="panel order-tracker" id="order-tracker"><div className="section-heading"><div><span className="eyebrow">NO GUESSWORK</span><h2>Your order, in the open.</h2></div>{order && <StatusBadge status={refundProcessing ? "processing" : order.status} />}</div>{order ? <><div className="tracked-order-summary"><span className="order-bag"><ShoppingBag size={23} /></span><div><strong>{order.id}</strong><span>{trackedStore?.name} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</span></div><strong>{rupees(order.amount)}</strong></div><div className={`refund-state ${order.refundStatus === "completed" ? "refund-completed" : ""}`}>
      {refundProcessing ? <><LoaderCircle size={22} className="spin" /><div><strong>Processing your simulated refund…</strong><p>The gateway and support resolver run in parallel.</p></div></> : order.refundStatus === "completed" ? <><CircleCheck size={24} /><div><strong>Refund Dispatched Instantly via Nova Sync Engine</strong><p>Completed in {((order.refundDurationMs ?? 400) / 1000).toFixed(1)} seconds · support ticket auto-resolved</p><span>Simulation reference: {order.refundReference}</span></div></> : <><PackageCheck size={24} /><div><strong>{order.status === "delivered" ? "Your demo order is delivered." : order.status === "accepted" ? "Your neighborhood store accepted your order." : "Waiting for your store to confirm."}</strong><p>{order.status === "delivered" ? "Delivery completion was simulated. No real delivery or payment took place." : order.status === "accepted" ? "Estimated delivery: 20–30 minutes. Status changes appear here live." : "No mystery cancellations. We’ll show every update right here."}</p></div></>}
    </div>{["pending", "accepted"].includes(order.status) && <button className="button button-outline simulate-issue" disabled={!ready || !!busy} onClick={() => mutate("orders/cancel", { orderId: order.id, reason: "driver_unavailable" }, "Simulated refund completed. No support queue required.")}><Zap size={15} />Simulate delivery issue<ArrowRight size={15} /></button>}<div className="simulation-note"><ShieldCheck size={12} />Demo checkout and payment gateway. No real charges or payouts.</div></> : <div className="empty-state"><ShoppingBag size={28} /><p>Place a quick order to see its live status here.</p></div>}</section>
    <section className="trust-note"><span className="trust-note-icon"><ShieldCheck size={27} /></span><h2>Trust isn’t a feature.<br />It’s the whole point.</h2><p>We confirm stock before checkout, tell you when data needs a refresh, and automate refunds when things don’t go to plan.</p><div><CircleCheck size={16} />Your money never sits in a support queue.</div><span>NOVA SYNC · LOCAL COMMERCE, IN SYNC</span></section></div>
  </div>;
}
