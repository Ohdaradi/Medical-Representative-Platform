import { useEffect, useState } from 'react';
import type { Order, Doctor, Product } from '../types';

type OrderTab = 'create' | 'history';

export default function OrdersPage() {
  const role = localStorage.getItem('role') || 'rep';
  const canApprove = ['manager', 'admin'].includes(role);

  const [tab, setTab] = useState<OrderTab>('create');
  const [products, setProducts] = useState<Product[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Create Order
  const [doctorId, setDoctorId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const signOrder = async (orderId: number) => {
    const signatureName = window.prompt('Enter your full name to electronically sign this order');
    if (!signatureName) return;
    await fetch(`/api/orders/${orderId}/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signatureName }) });
    loadOrders();
  };

  const cancelOrder = async (orderId: number) => {
    const cancelReason = window.prompt('Enter reason for cancellation');
    if (cancelReason === null) return;
    await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: cancelReason }) });
    loadOrders();
  };

  const approveOrder = async (orderId: number, status: 'approved' | 'rejected') => {
    await fetch(`/api/orders/${orderId}/${status === 'approved' ? 'approve' : 'reject'}`, { method: 'POST' });
    loadOrders();
  };

  const loadOrders = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await fetch(`/api/orders?${params.toString()}`);
    if (res.ok) setOrders(await res.json());
  };

  const loadData = async () => {
    const [productsRes, doctorsRes] = await Promise.all([fetch('/api/products'), fetch('/api/doctors?showAll=true')]);
    if (productsRes.ok) setProducts(await productsRes.json());
    if (doctorsRes.ok) setDoctors(await doctorsRes.json());
    await loadOrders();
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadOrders(); }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, productId, quantity, status: 'pending' })
    });
    setDoctorId(''); setProductId(''); setQuantity('');
    loadOrders();
    if (role === 'rep') setTab('history');
  };

  const handleView = async (id: number) => {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) setViewingOrder(await res.json());
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: '#f59e0b', approved: '#16a34a', rejected: '#dc2626', cancelled: 'var(--muted)', confirmed: '#16a34a' };
    const color = map[s] || 'var(--muted)';
    return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${color}1a`, color }}>{s}</span>;
  };

  const tabs: { key: OrderTab; label: string }[] = role === 'rep'
    ? [{ key: 'create', label: '📦 Create Order' }, { key: 'history', label: '📋 Order History' }]
    : [{ key: 'create', label: '📦 All Orders' }, { key: 'history', label: '📋 History' }];

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">O</div>
          <h2 className="page-title">Orders</h2>
        </div>
        <span className="chip">Order management</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>Submit product requests, track approvals, and review order history.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button key={t.key} type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 22px', borderRadius: 999, fontSize: '0.9rem',
              background: tab === t.key ? 'linear-gradient(135deg, var(--accent), var(--accent-strong))' : 'var(--surface)',
              color: tab === t.key ? '#fff' : 'var(--muted)',
              border: `1px solid ${tab === t.key ? 'transparent' : 'var(--border)'}`,
              boxShadow: tab === t.key ? '0 4px 12px rgba(15,118,110,0.25)' : 'none',
              margin: 0
            }}>{t.label}</button>
        ))}
      </div>

      {/* CREATE ORDER TAB */}
      {tab === 'create' && (
        <div className="panel-grid">
          {role === 'rep' && (
            <section className="panel">
              <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Submit New Order</h3>
              <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 14 }}>
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                  <option value="">Select Doctor</option>
                  {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                  <option value="">Select Product</option>
                  {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                </select>
                <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" type="number" required />
                <button type="submit">Submit Order</button>
              </form>
            </section>
          )}

          <section className="panel" style={{ gridColumn: role === 'rep' ? 'auto' : '1 / -1' }}>
            <div className="page-toolbar" style={{ marginBottom: 12 }}>
              <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Available Products</h3>
              <div className="stacked-actions">
                <input style={{ width: 200 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" />
                <button type="button" className="btn-ghost" onClick={loadData}>Search</button>
              </div>
            </div>
            <div className="table-shell">
              <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
                <div>Product</div><div>Category</div><div>Price</div><div>Stock</div><div></div>
              </div>
              {products.map((product) => (
                <div className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }} key={product.id}>
                  <div><h4>{product.name}</h4></div>
                  <div>{product.category || 'General'}</div>
                  <div>₹{product.unitPrice}</div>
                  <div><span className="chip">{product.stock}</span></div>
                  <div>{product.stock < 10 && <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Low Stock</span>}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ORDER HISTORY TAB */}
      {tab === 'history' && (
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 14 }}>
            <h3 className="page-title" style={{ fontSize: '1.05rem', marginBottom: 0 }}>Order History</h3>
            <div className="stacked-actions">
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button type="button" className="btn-ghost" onClick={loadOrders}>Filter</button>
            </div>
          </div>
          {orders.length ? (
            <div className="table-shell">
              <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
                <div>Order</div><div>Doctor</div><div>Qty</div><div>Status</div><div>Actions</div>
              </div>
              {orders.map((order) => (
                <div className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }} key={order.id}>
                  <div>
                    <h4>#{order.id} — {order.product?.name || `Product #${order.productId}`}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div>{order.doctor?.name || `Doctor #${order.doctorId}`}</div>
                  <div>{order.quantity}</div>
                  <div>{statusBadge(order.status)}</div>
                  <div className="table-actions">
                    <button type="button" className="btn-ghost" onClick={() => handleView(order.id)}>View</button>
                    {role === 'rep' && !['cancelled', 'approved', 'rejected'].includes(order.status) && (
                      <button type="button" className="btn-ghost" onClick={() => cancelOrder(order.id)}>Cancel</button>
                    )}
                    {canApprove && order.status === 'pending' && (
                      <>
                        <button type="button" className="btn-ghost" onClick={() => approveOrder(order.id, 'approved')}>Approve</button>
                        <button type="button" className="btn-ghost" onClick={() => approveOrder(order.id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {role === 'rep' && order.status === 'approved' && (
                      <button type="button" className="btn-ghost" onClick={() => signOrder(order.id)}>
                        {order.signedAt ? '✅ Signed' : 'E-Sign'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No orders found.</div>}
        </section>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Order Details</h3>
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">Order ID</span><span className="detail-value">#{viewingOrder.id}</span></div>
              <div className="detail-row"><span className="detail-label">Doctor</span><span className="detail-value">{viewingOrder.doctor?.name || `ID ${viewingOrder.doctorId}`}</span></div>
              <div className="detail-row"><span className="detail-label">Product</span><span className="detail-value">{viewingOrder.product?.name || `ID ${viewingOrder.productId}`}</span></div>
              <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{viewingOrder.quantity}</span></div>
              <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{viewingOrder.status}</span></div>
              <div className="detail-row"><span className="detail-label">Created</span><span className="detail-value">{viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString() : '—'}</span></div>
              {viewingOrder.signedAt && <>
                <div className="detail-row"><span className="detail-label">Signed By</span><span className="detail-value">{viewingOrder.signatureName}</span></div>
                <div className="detail-row"><span className="detail-label">Signed At</span><span className="detail-value">{new Date(viewingOrder.signedAt).toLocaleString()}</span></div>
              </>}
              {viewingOrder.cancelReason && <>
                <div className="detail-row"><span className="detail-label">Cancel Reason</span><span className="detail-value">{viewingOrder.cancelReason}</span></div>
              </>}
            </div>
            <div className="modal-actions"><button type="button" onClick={() => setViewingOrder(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
