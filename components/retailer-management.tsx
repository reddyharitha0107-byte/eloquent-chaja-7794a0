"use client";

import { useCallback, useState, type FormEvent } from "react";
import { ArrowUpRight, Award, CircleCheck, LoaderCircle, Pencil, Search, ShieldCheck, Store as StoreIcon, TrendingUp } from "lucide-react";
import type { City, Store } from "@/lib/types";
import { rupees } from "@/lib/types";
import type { NovaEngine } from "./use-nova";
import { BestSellerBadge, ConfidenceBadge } from "./ui";
import Modal from "./modal";

function RetailerEditor({ store, engine, close }: { store: Store; engine: NovaEngine; close: () => void }) {
  const [name, setName] = useState(store.name);
  const [owner, setOwner] = useState(store.owner);
  const [address, setAddress] = useState(store.address);
  const [category, setCategory] = useState(store.category);
  const [accepting, setAccepting] = useState(store.isAcceptingOrders);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await engine.mutate("stores/profile", { storeId: store.id, name, owner, address, category, accepting }, "Retailer details saved across all three perspectives.");
    if (result) close();
  }
  return <Modal title="Keep the neighborhood up to date." eyebrow="EDIT RETAILER · DEMO ADMIN" close={close}>
    <p className="modal-intro">Update {store.name} in {store.city}. Changes are saved to your private demo workspace.</p>
    <form className="retailer-edit-form" onSubmit={save}>
      <div className="retailer-edit-fields">{[{ id: "name", title: "Retailer name", value: name, setter: setName, max: 100 }, { id: "owner", title: "Owner name", value: owner, setter: setOwner, max: 100 }, { id: "address", title: "Address / neighborhood", value: address, setter: setAddress, max: 200 }, { id: "category", title: "Store category", value: category, setter: setCategory, max: 60 }].map(field => <label key={field.id} htmlFor={`retailer-${field.id}`}>{field.title}<input id={`retailer-${field.id}`} value={field.value} onChange={event => field.setter(event.target.value)} required maxLength={field.max} disabled={!!engine.busy} /></label>)}</div>
      <label className="retailer-availability-choice"><input type="checkbox" checked={accepting} onChange={event => setAccepting(event.target.checked)} disabled={!!engine.busy} /><span><strong>Accepting new orders</strong><small>Turning this off pauses checkout, without cancelling existing orders.</small></span></label>
      <div className="retailer-edit-actions"><button type="button" className="button button-outline" disabled={!!engine.busy} onClick={close}>Cancel</button><button className="button button-primary" disabled={!engine.ready || !!engine.busy}>{engine.busy === "stores/profile" ? <LoaderCircle className="spin" size={16} /> : <CircleCheck size={16} />}Save retailer</button></div>
    </form>
  </Modal>;
}

export default function RetailerManagement({ engine, city, visitStore }: { engine: NovaEngine; city: City; visitStore: (store: Store) => void }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Store | null>(null);
  const closeEditor = useCallback(() => setEditing(null), []);
  const { snapshot, ready, busy, mutate } = engine;
  const stores = snapshot.stores.filter(store => city === "All cities" || store.city === city);
  const sales = snapshot.retailerSales ?? [];
  const ranked = stores.map(store => ({ store, sales: sales.find(total => total.storeId === store.id) ?? { completedOrders: 0, revenue: 0 } }))
    .sort((first, second) => second.sales.revenue - first.sales.revenue || second.sales.completedOrders - first.sales.completedOrders || first.store.name.localeCompare(second.store.name));
  const filtered = ranked.map((retailer, index) => ({ ...retailer, rank: index + 1 })).filter(({ store }) => `${store.name} ${store.owner} ${store.city}`.toLowerCase().includes(query.trim().toLowerCase()));
  const revenue = ranked.reduce((total, retailer) => total + retailer.sales.revenue, 0);
  const completedOrders = ranked.reduce((total, retailer) => total + retailer.sales.completedOrders, 0);

  return <section className="panel retailer-management" aria-labelledby="retailer-management-title">
    <div className="section-heading"><div><span className="eyebrow"><Award size={13} />DEMO ADMIN CONTROL ROOM</span><h2 id="retailer-management-title">Great retailers deserve a little recognition.</h2><p>Check performance, update storefronts, and award Best Seller badges.</p></div><span className="badge badge-green"><TrendingUp size={12} />Completed-sales ranking</span></div>
    <div className="retailer-summary"><div><strong>{stores.length}</strong><span>retailers in view</span></div><div><strong>{completedOrders}</strong><span>completed demo orders</span></div><div><strong>{rupees(revenue)}</strong><span>completed demo sales</span></div><div><strong>{stores.filter(store => store.bestSeller).length}</strong><span>Best Seller awards</span></div></div>
    <div className="retailer-toolbar"><p><ShieldCheck size={15} />Lifetime demo sales · delivered, non-refunded orders only · includes initial samples</p><label className="retailer-search"><Search size={16} /><input aria-label="Search retailers" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a retailer…" maxLength={100} /></label></div>
    {!ready && <div className="retailer-preview-note" role="status">Waiting for the database connection. Preview retailers cannot be edited or awarded badges.</div>}
    <div className="table-scroll"><table className="retailer-table"><thead><tr><th scope="col">RANK / RETAILER</th><th scope="col">COMPLETED SALES</th><th scope="col">STOCK & STATUS</th><th scope="col">RECOGNITION</th><th scope="col">MANAGE</th></tr></thead><tbody>{filtered.map(({ store, sales: total, rank }) => <tr key={store.id}>
      <td><div className="retailer-identity"><span className={`retailer-rank ${total.completedOrders ? "rank-selling" : ""}`}>{total.completedOrders ? `#${rank}` : "—"}</span><div><strong>{store.name}</strong><small>{store.owner} · {store.city}</small></div></div></td>
      <td><strong className="retailer-revenue">{rupees(total.revenue)}</strong><small>{total.completedOrders} completed order{total.completedOrders === 1 ? "" : "s"}</small></td>
      <td><ConfidenceBadge score={store.syncConfidenceScore} compact /><small>{store.isAcceptingOrders ? "Accepting orders" : "Orders paused"}</small></td>
      <td><div className="retailer-award">{store.bestSeller ? <BestSellerBadge /> : <span className="retailer-unawarded">{total.completedOrders ? "Ready for recognition" : "No completed sales yet"}</span>}<button className="retailer-badge-button" disabled={!ready || !!busy || (!store.bestSeller && !total.completedOrders)} onClick={() => mutate("stores/badge", { storeId: store.id, bestSeller: !store.bestSeller }, store.bestSeller ? "Best Seller badge removed." : "Best Seller badge awarded. Customers and merchants see it live.")} aria-label={`${store.bestSeller ? "Remove" : "Award"} Best Seller badge ${store.bestSeller ? "from" : "to"} ${store.name}`}><Award size={13} />{store.bestSeller ? "Remove badge" : "Award badge"}</button></div></td>
      <td><div className="retailer-actions"><button className="button button-outline" disabled={!ready || !!busy} onClick={() => setEditing(store)} aria-label={`Edit ${store.name}`}><Pencil size={13} />Update</button><button className="icon-button" onClick={() => visitStore(store)} aria-label={`Open ${store.name} merchant workspace`}><ArrowUpRight size={17} /></button></div></td>
    </tr>)}</tbody></table></div>
    {!filtered.length && <div className="empty-state"><StoreIcon size={27} /><h3>No retailers match that search.</h3><p>Try another name or choose a different city.</p></div>}
    <p className="retailer-footnote">Awards are manually selected in this demo, not independent certifications. Ranking uses the entire workspace history, not just the latest 100 orders.</p>
    {editing && <RetailerEditor key={editing.id} store={editing} engine={engine} close={closeEditor} />}
  </section>;
}
