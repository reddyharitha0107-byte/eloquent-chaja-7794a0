"use client";

import { useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Check, CircleCheck, Clock3, Headset, Radio, ShieldCheck, Store as StoreIcon, TrendingUp, Zap, RefreshCw, ChevronRight, Wallet, Sparkles, CheckCheck } from "lucide-react";
import type { City, Snapshot, SystemEvent, Store } from "@/lib/types";
import { confidence } from "@/lib/types";
import { ActivityChart, Sparkline } from "./charts";
import { ConfidenceBadge, relativeTime, SectionHeading } from "./ui";

export function EventTable({ events, compact = true }: { events: SystemEvent[]; compact?: boolean }) {
  const icons = { inventory: RefreshCw, refund: Wallet, deflection: ShieldCheck, order: CheckCheck, insight: Sparkles };
  return <div className="table-scroll"><table className={`event-table ${compact ? "compact-table" : ""}`}>
    <thead><tr><th>TIME</th><th>EVENT TRIGGER</th><th>ORDER ID</th><th>AUTOMATED ACTION</th></tr></thead>
    <tbody>{events.length ? events.map(event => {
      const Icon = icons[event.type as keyof typeof icons] ?? Activity;
      return <tr className="event-row" key={event.id}><td><span suppressHydrationWarning>{new Date(event.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })}</span><small>IST · {relativeTime(event.createdAt)}</small></td><td><div className="event-trigger"><span className={`event-icon event-${event.type}`}><Icon size={14} /></span><span>{event.trigger}</span></div></td><td><span className="order-code">{event.orderId ?? "—"}</span></td><td><span className="action-check"><CircleCheck size={13} />{event.action}</span></td></tr>;
    }) : <tr><td colSpan={4}><div className="table-empty"><Radio size={22} /><span>No events here yet. Try an action in the merchant view.</span></div></td></tr>}</tbody>
  </table></div>;
}

export default function Operations({ snapshot, city, openEvents, openNetwork, openInsights, selectStore, live, testCheckout, canAct }: { snapshot: Snapshot; city: City; openEvents: () => void; openNetwork: () => void; openInsights: () => void; selectStore: (store: Store) => void; live: boolean; testCheckout: () => void; canAct: boolean }) {
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [eventFilter, setEventFilter] = useState("all");
  const localStores = snapshot.stores.filter(store => city === "All cities" || store.city === city);
  const storeIds = new Set(localStores.map(store => store.id));
  const localEvents = snapshot.events.filter(event => storeIds.has(event.storeId));
  const localOrders = new Set(snapshot.orders.filter(order => storeIds.has(order.storeId)).map(order => order.id));
  const localTickets = snapshot.tickets.filter(ticket => localOrders.has(ticket.orderId));
  const verified = localStores.filter(store => confidence(store.lastInventorySync) >= 85).length;
  const syncedPercent = localStores.length ? (verified / localStores.length * 100).toFixed(1) : "0";
  const totals = snapshot.totals?.filter(total => city === "All cities" || total.city === city);
  const resolved = totals ? totals.reduce((total, current) => total + current.autoResolved, 0) : localTickets.filter(ticket => ticket.autoResolved).length;
  const deflected = totals ? totals.reduce((total, current) => total + current.deflected, 0) : localEvents.filter(event => event.type === "deflection").length;
  const visibleEvents = localEvents.filter(event => eventFilter === "all" || event.type === eventFilter).slice(0, 5);
  const stats = [
    { title: "Repeat purchase rate", value: "27", suffix: "%", Icon: TrendingUp, color: "mint", detail: "14 pts below previous baseline", trend: "down", foot: "Recovery target: 41%", down: true },
    { title: "Automated inventory sync", value: syncedPercent, suffix: "%", Icon: RefreshCw, color: "blue", detail: `${verified} of ${localStores.length} stores verified`, trend: "up", foot: "Fresh data. Fewer surprises.", down: false },
    { title: "Ghost orders prevented", value: String(deflected).padStart(2, "0"), suffix: "", Icon: ShieldCheck, color: "amber", detail: "Stopped before checkout", trend: "up", foot: "No charge. No cancellation.", down: false },
    { title: "AI-resolved support tickets", value: String(resolved).padStart(2, "0"), suffix: "", Icon: Headset, color: "violet", detail: "Resolved without a support queue", trend: "up", foot: "9.2h baseline → automated", down: false },
  ];
  return <div className="view-enter operations-view">
    <div className="metric-grid">{stats.map(stat => <article className="metric-card" key={stat.title}>
      <div className="metric-top"><span>{stat.title}</span><span className={`metric-icon icon-${stat.color}`}><stat.Icon size={18} /></span></div>
      <div className="metric-value">{stat.value}<span>{stat.suffix}</span><Sparkline tone={stat.down ? "amber" : "green"} downward={stat.down} /></div>
      <div className={`metric-detail ${stat.trend === "down" ? "detail-amber" : "detail-green"}`}>{stat.trend === "down" ? <ArrowDownRight size={13} /> : <Check size={13} />}{stat.detail}</div>
      <div className="metric-foot">{stat.title === "Ghost orders prevented" ? <button className="metric-test-button" onClick={testCheckout} disabled={!canAct}>Test checkout protection<ArrowUpRight size={10} /></button> : stat.foot}</div>
    </article>)}</div>

    <div className="overview-grid">
      <section className="panel activity-panel">
        <div className="section-heading"><div><h2>Inventory, getting smarter.</h2><p>A fresher catalog is the first step to a trusted order.</p></div><div className="mini-tabs"><button className={period === "today" ? "selected" : ""} onClick={() => setPeriod("today")}>Today</button><button className={period === "week" ? "selected" : ""} onClick={() => setPeriod("week")}>7 days</button></div></div>
        <div className="chart-summary"><div><strong>{syncedPercent}<span>%</span></strong><span className="chart-caption">verified store coverage</span></div><div className="chart-legend"><span><i className="legend-dot green" />Verified inventory</span><span><i className="legend-dot amber" />Awaiting confirmation</span></div></div>
        <ActivityChart period={period} />
        <div className="chart-bottom"><span><CircleCheck size={14} /> Live coverage from your workspace</span><span>Trend illustration · demo data</span></div>
      </section>

      <section className="engine-panel">
        <div className="engine-top"><span className="eyebrow">YOUR DIGITAL ORCHESTRATOR</span><span className="engine-live"><span className="status-dot" />{live ? "Online" : "Preview"}</span></div>
        <h2>Less friction.<br />More neighborhood.</h2>
        <p>One engine connecting the dots,<br />so your team doesn’t have to.</p>
        <div className="engine-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="orbit-node node-one"><StoreIcon size={14} /></span><span className="orbit-node node-two"><ShieldCheck size={14} /></span><span className="orbit-node node-three"><Headset size={14} /></span><div className="engine-core"><Zap size={28} fill="currentColor" /></div></div>
        <div className="engine-pipelines"><span><span className="status-dot" />Inventory sync</span><span><span className="status-dot" />Order protection</span><span><span className="status-dot" />Instant resolution</span></div>
        <button className="engine-link" onClick={openInsights}>Meet the intelligence behind it<ArrowUpRight size={15} /></button>
      </section>

      <section className="panel stream-panel">
        <SectionHeading title="The orchestration stream" subtitle="Every trigger. Every fix. All in one place." action="View all" onAction={openEvents} />
        <div className="stream-toolbar"><div className="filter-tabs">{[{ id: "all", name: "All events" }, { id: "inventory", name: "Inventory" }, { id: "refund", name: "Refunds" }].map(filter => <button key={filter.id} className={eventFilter === filter.id ? "selected" : ""} onClick={() => setEventFilter(filter.id)}>{filter.name}</button>)}</div><span className="live-stream"><span className="status-dot" />{live ? "Live feed" : "Sample feed"}</span></div>
        <EventTable events={visibleEvents} />
        <div className="stream-footer"><span><Zap size={13} />Automated decisions. A human-readable trail.</span><span>{localEvents.length} events</span></div>
      </section>

      <section className="panel store-panel">
        <SectionHeading title="Neighborhood pulse" subtitle={`${localStores.length} stores. One connected network.`} action="" />
        <div className="store-health-summary"><div><strong>{verified}</strong><span>in sync</span></div><div className="health-bar">{localStores.map(store => <span key={store.id} className={confidence(store.lastInventorySync) >= 85 ? "healthy" : "stale"} />)}</div><span>{localStores.length - verified} need a nudge</span></div>
        <div className="store-health-list">{localStores.slice(0, 4).map((store, storeIndex) => <button className="store-health-item" key={store.id} onClick={() => selectStore(store)}><span className={`store-avatar avatar-${storeIndex % 3}`}><StoreIcon size={18} /></span><div><strong>{store.name}</strong><span>{store.city} · {relativeTime(store.lastInventorySync)}</span></div><span className={`tiny-status ${confidence(store.lastInventorySync) >= 85 ? "good" : "warn"}`}><span className="status-dot" />{confidence(store.lastInventorySync) >= 85 ? "Synced" : "Stale"}</span></button>)}</div>
        <button className="network-link" onClick={openNetwork}>Explore your store network<ArrowRight size={15} /></button>
      </section>
    </div>

    <div className="impact-strip"><span className="impact-symbol"><Sparkles size={21} /></span><div><strong>Big impact. A lighter footprint.</strong><span>No dark stores. No large teams. Just smarter coordination.</span></div><div className="impact-budget"><span>IMPLEMENTATION CEILING</span><strong>₹25 lakh <span>/ digital-first</span></strong></div><button className="text-button" onClick={openInsights}>Our approach<ArrowUpRight size={15} /></button></div>
  </div>;
}
