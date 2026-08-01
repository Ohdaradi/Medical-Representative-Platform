import { useEffect, useState } from 'react';
import type { Sample, Doctor, Product } from '../types';

type SampleTab = 'issue' | 'history';

export default function SamplesPage() {
  const role = localStorage.getItem('role') || '';
  const canIssue = ['admin', 'manager', 'rep'].includes(role);
  const [tab, setTab] = useState<SampleTab>('issue');

  const [samples, setSamples] = useState<Sample[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [inventory, setInventory] = useState<any>(null);

  // Issue Form Fields
  const [productId, setProductId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // View Modal State
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    const [samplesRes, inventoryRes, productsRes, doctorsRes] = await Promise.all([
      fetch('/api/samples'),
      fetch('/api/samples/inventory'),
      fetch('/api/products'),
      fetch('/api/doctors?showAll=true')
    ]);
    setSamples(await samplesRes.json());
    setInventory(await inventoryRes.json());
    setProducts(await productsRes.json());
    setDoctors(await doctorsRes.json());
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.id === Number(productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!productId || !doctorId) {
      setFormError('Please select both a medicine and a doctor.');
      return;
    }

    const res = await fetch('/api/samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: Number(productId),
        doctorId: Number(doctorId),
        quantity: Number(quantity),
        batchNumber: batchNumber || undefined,
        expiryDate: expiryDate || undefined,
        remarks: remarks || undefined
      })
    });

    if (!res.ok) {
      const d = await res.json();
      setFormError(d.message || 'Failed to issue sample');
      return;
    }

    setFormSuccess('Sample issued successfully.');
    setProductId(''); setDoctorId(''); setQuantity('');
    setBatchNumber(''); setExpiryDate(''); setRemarks('');
    loadData();
    setTimeout(() => setFormSuccess(''), 3500);
  };

  const handleReissue = (sample: Sample) => {
    setProductId(sample.productId.toString());
    setDoctorId(sample.doctorId?.toString() || '');
    setFormError(''); setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSamples = statusFilter ? samples.filter((s) => s.status === statusFilter) : samples;

  return (
    <div>
      {/* Header */}
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">S</div>
          <h2 className="page-title">Sample Issuance</h2>
        </div>
        <span className="chip">Inventory control</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        Issue drug samples to doctors with full inventory tracking and automatic stock deduction.
      </p>

      {/* Tabs (rep only) */}
      {role === 'rep' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {([['issue', '💊 Issue Sample'], ['history', '📋 Sample History']] as [SampleTab, string][]).map(([t, label]) => (
            <button key={t} type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '8px 22px', borderRadius: 999, fontSize: '0.9rem',
                background: tab === t ? 'linear-gradient(135deg, var(--accent), var(--accent-strong))' : 'var(--surface)',
                color: tab === t ? '#fff' : 'var(--muted)',
                border: `1px solid ${tab === t ? 'transparent' : 'var(--border)'}`,
                boxShadow: tab === t ? '0 4px 12px rgba(15,118,110,0.25)' : 'none', margin: 0
              }}>{label}</button>
          ))}
        </div>
      )}

      {/* Low Stock Alert Banner */}
      {inventory?.lowStock?.length > 0 && (
        <div style={{
          padding: '12px 18px', borderRadius: 14, marginBottom: 18,
          background: 'rgba(180,35,24,0.07)', border: '1px solid rgba(180,35,24,0.2)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontWeight: 700, color: '#b42318', fontSize: '0.9rem' }}>
            ⚠ Low Stock Alert
          </span>
          <span style={{ color: '#b42318', fontSize: '0.88rem' }}>
            {inventory.lowStock.map((p: any) => `${p.name} (${p.stock} left)`).join(' · ')}
          </span>
        </div>
      )}

      <div className="panel-grid">
        {/* Issue Sample Form */}
        {canIssue && (role !== 'rep' || tab === 'issue') && (
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Issue Sample</h3>
            <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 14, fontSize: '0.88rem' }}>
              Select a medicine and doctor. Issue date and representative are captured automatically.
            </p>

            <form onSubmit={handleSubmit} className="form-grid">
              {/* Medicine Dropdown */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Medicine *
                </label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                  <option value="">Select Medicine</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.category ? `(${p.category})` : ''} — Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected medicine info */}
              {selectedProduct && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: '0.88rem',
                  background: selectedProduct.stock < 10 ? 'rgba(180,35,24,0.07)' : 'rgba(15,118,110,0.06)',
                  border: `1px solid ${selectedProduct.stock < 10 ? 'rgba(180,35,24,0.2)' : 'rgba(15,118,110,0.15)'}`,
                  color: selectedProduct.stock < 10 ? '#b42318' : 'var(--accent-strong)'
                }}>
                  Available stock: <strong>{selectedProduct.stock}</strong> units
                  {selectedProduct.stock < 10 && ' — Low stock warning'}
                </div>
              )}

              {/* Doctor Dropdown */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Doctor *
                </label>
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.specialty ? ` · ${d.specialty}` : ''}{d.city ? ` · ${d.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Quantity *
                </label>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.stock}
                  required
                />
              </div>

              {/* Batch Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Batch Number
                </label>
                <input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2025-001"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Expiry Date
                </label>
                <input
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  type="date"
                />
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes about this sample issuance…"
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Auto-filled info notice */}
              <div style={{
                padding: '10px 14px', borderRadius: 12, fontSize: '0.84rem',
                background: 'rgba(15,118,110,0.05)', border: '1px solid rgba(15,118,110,0.12)',
                color: 'var(--muted)'
              }}>
                📋 <strong>Issued To</strong> and <strong>Issue Date &amp; Time</strong> are captured automatically from the selected doctor and your login session.
              </div>

              {formError && (
                <div style={{ color: '#b42318', fontWeight: 600, fontSize: '0.9rem' }}>{formError}</div>
              )}
              {formSuccess && (
                <div style={{ color: '#067647', fontWeight: 600, fontSize: '0.9rem' }}>{formSuccess}</div>
              )}

              <button type="submit" style={{ gridColumn: '1 / -1' }}>Issue Sample</button>
            </form>
          </section>
        )}

        {/* Samples List */}
        {(role !== 'rep' || tab === 'history') && (
          <section className="panel">
            <div className="page-toolbar" style={{ marginBottom: 12 }}>
              <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>
                {role === 'rep' ? 'Sample History' : 'Issued Samples'}
              </h3>
              <div className="stacked-actions">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', padding: '0.5rem 0.9rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="issued">Issued</option>
                  <option value="distributed">Distributed</option>
                </select>
                <span className="chip">{filteredSamples.length} records</span>
              </div>
            </div>

            {filteredSamples.length ? (
              <div className="table-shell">
                <div className="table-header" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(140px,1fr) minmax(160px,1fr) auto' }}>
                  <div>Medicine · Doctor</div>
                  <div>Batch / Expiry</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {filteredSamples.map((sample) => (
                  <div className="table-row" key={sample.id} style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(140px,1fr) minmax(160px,1fr) auto' }}>
                    <div>
                      <h4>{sample.product?.name || `Product #${sample.productId}`}</h4>
                      <p>
                        Qty: {sample.quantity}
                        {sample.doctor && ` · Dr. ${sample.doctor.name}`}
                      </p>
                      {sample.issuedTo && !sample.doctor && (
                        <p style={{ fontSize: '0.82rem' }}>Issued to: {sample.issuedTo}</p>
                      )}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                      {sample.batchNumber ? <div>{sample.batchNumber}</div> : <div>—</div>}
                      {sample.expiryDate ? (
                        <div>{new Date(sample.expiryDate).toLocaleDateString()}</div>
                      ) : (
                        <div style={{ color: 'var(--border)' }}>No expiry</div>
                      )}
                    </div>
                    <div>
                      <span className="chip" style={sample.status === 'distributed' ? { background: 'rgba(6,118,71,0.1)', color: '#067647' } : {}}>
                        {sample.status}
                      </span>
                      {sample.issuedAt && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                          {new Date(sample.issuedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="table-actions">
                      <button type="button" className="btn-ghost" onClick={() => setViewingSample(sample)}>View</button>
                      {canIssue && (
                        <button type="button" className="btn-ghost" onClick={() => handleReissue(sample)}>Reissue</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No samples issued yet.</div>
            )}
          </section>
        )}
      </div>

      {/* Inventory Snapshot */}
      <div className="panel-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Inventory Snapshot</h3>
            <span className="chip">{inventory?.products?.length ?? 0} medicines</span>
          </div>
          <div className="list-grid">
            {inventory?.products?.slice(0, 6)?.map((item: any) => (
              <div className="data-card" key={item.id}>
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.category || 'General'}</p>
                </div>
                <span
                  className="chip"
                  style={item.stock < 10 ? { background: 'rgba(180,35,24,0.1)', color: '#b42318' } : {}}
                >
                  {item.stock} units
                </span>
              </div>
            ))}
          </div>
        </section>

        {inventory?.lowStock?.length > 0 && (
          <section className="panel">
            <div className="page-toolbar" style={{ marginBottom: 12 }}>
              <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Low Stock Alerts</h3>
              <span className="chip" style={{ background: 'rgba(180,35,24,0.1)', color: '#b42318' }}>
                {inventory.lowStock.length} items
              </span>
            </div>
            <div className="list-grid">
              {inventory.lowStock.map((item: any) => (
                <div className="data-card" key={item.id}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>Stock below minimum threshold</p>
                  </div>
                  <span className="chip" style={{ background: 'rgba(180,35,24,0.1)', color: '#b42318' }}>
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sample Detail Modal */}
      {viewingSample && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Sample Details — #{viewingSample.id}</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Medicine</span>
                <span className="detail-value">{viewingSample.product?.name || `ID ${viewingSample.productId}`}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Issued To (Doctor)</span>
                <span className="detail-value">{viewingSample.doctor?.name || viewingSample.issuedTo || '—'}</span>
              </div>
              {viewingSample.doctor?.specialty && (
                <div className="detail-row">
                  <span className="detail-label">Specialty</span>
                  <span className="detail-value">{viewingSample.doctor.specialty}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">{viewingSample.quantity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">{viewingSample.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch Number</span>
                <span className="detail-value">{viewingSample.batchNumber || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry Date</span>
                <span className="detail-value">
                  {viewingSample.expiryDate ? new Date(viewingSample.expiryDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Issue Date</span>
                <span className="detail-value">
                  {viewingSample.issuedAt ? new Date(viewingSample.issuedAt).toLocaleString() : '—'}
                </span>
              </div>
              {(viewingSample as any).remarks && (
                <div className="detail-row">
                  <span className="detail-label">Remarks</span>
                  <span className="detail-value">{(viewingSample as any).remarks}</span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setViewingSample(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
