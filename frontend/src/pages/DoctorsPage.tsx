import { useEffect, useState } from 'react';
import type { Doctor } from '../types';

export default function DoctorsPage() {
  const role = localStorage.getItem('role') || '';
  const canAdd = role === 'admin';
  const canEdit = ['manager', 'admin'].includes(role);
  const canDelete = role === 'admin';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [territory, setTerritory] = useState('');

  // State for Modals/Editing
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<any>(null); // Details object
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadDoctors = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cityFilter) params.set('city', cityFilter);
    if (specialtyFilter) params.set('specialty', specialtyFilter);
    
    const response = await fetch(`/api/doctors?${params.toString()}`);
    const data = await response.json();
    setDoctors(data);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const resetForm = () => {
    setName('');
    setCity('');
    setSpecialty('');
    setHospital('');
    setPhone('');
    setEmail('');
    setTerritory('');
    setEditingDoctor(null);
  };

  const handleCreateOrUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name, city, specialty, hospital, phone, email, territory };
    
    if (editingDoctor) {
      await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    resetForm();
    loadDoctors();
  };

  const handleEditClick = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setCity(doctor.city || '');
    setSpecialty(doctor.specialty || '');
    setHospital(doctor.hospital || '');
    setPhone(doctor.phone || '');
    setEmail(doctor.email || '');
    setTerritory(doctor.territory || '');
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadDoctors();
  };

  const handleView = async (id: number) => {
    const res = await fetch(`/api/doctors/${id}`);
    const data = await res.json();
    setViewingDoctor(data);
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">D</div>
          <h2 className="page-title">Doctor Management</h2>
        </div>
        <span className="chip">Master data</span>
      </section>

      <p className="page-subtitle" style={{ marginBottom: 18 }}>Maintain doctor master data for territory planning and field visits.</p>

      <div className="panel-grid">
        {canAdd || (canEdit && editingDoctor) ? (
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.1rem' }}>{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</h3>
            <form onSubmit={handleCreateOrUpdate} className="form-grid" style={{ marginTop: 14 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Doctor name" required />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty" />
              <input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              <input value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="Territory" />
              
              <div className="stacked-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit">{editingDoctor ? 'Update Doctor' : 'Save Doctor'}</button>
                {editingDoctor && (
                  <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
                )}
              </div>
            </form>
          </section>
        ) : null}

        <section className="panel" style={{ gridColumn: (canAdd || canEdit) ? '1 / -1' : 'auto' }}>
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Doctor Directory</h3>
            <div className="stacked-actions">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name" style={{ width: 150 }} />
              <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Filter city" style={{ width: 130 }} />
              <input value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} placeholder="Filter specialty" style={{ width: 140 }} />
              <button type="button" className="btn-ghost" onClick={loadDoctors}>Search</button>
            </div>
          </div>

          {doctors.length ? (
            <div className="table-shell">
              <div className="table-header">
                <div>Doctor</div>
                <div>City / Specialty</div>
                <div>Contact</div>
                <div>Territory</div>
                <div>Actions</div>
              </div>
              {doctors.map((doctor) => (
                <div className="table-row" key={doctor.id}>
                  <div>
                    <h4>{doctor.name}</h4>
                    <p>ID {doctor.id}</p>
                  </div>
                  <div>{doctor.city || '—'} · {doctor.specialty || '—'}</div>
                  <div>{doctor.phone || '—'}<br/>{doctor.email || '—'}</div>
                  <div>{doctor.territory || '—'}</div>
                  <div className="table-actions">
                    <button type="button" className="btn-ghost" onClick={() => handleView(doctor.id)}>View</button>
                    {canEdit && <button type="button" className="btn-ghost" onClick={() => handleEditClick(doctor)}>Edit</button>}
                    {canDelete && <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(doctor.id)}>Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No doctors found yet.</div>}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this doctor? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Doctor Details Modal */}
      {viewingDoctor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Doctor Details</h3>
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{viewingDoctor.name}</span></div>
              <div className="detail-row"><span className="detail-label">City</span><span className="detail-value">{viewingDoctor.city || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Specialty</span><span className="detail-value">{viewingDoctor.specialty || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Hospital</span><span className="detail-value">{viewingDoctor.hospital || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Territory</span><span className="detail-value">{viewingDoctor.territory || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{viewingDoctor.phone || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{viewingDoctor.email || '—'}</span></div>
            </div>

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Visits</h4>
            {viewingDoctor.visits && viewingDoctor.visits.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {viewingDoctor.visits.map((v: any) => (
                  <li key={v.id}>{v.visitDate?.substring(0,10)} - {v.outcome || v.status}</li>
                ))}
              </ul>
            ) : <p style={{ margin: 0, color: 'var(--muted)' }}>No visits found.</p>}

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Orders</h4>
            {viewingDoctor.orders && viewingDoctor.orders.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {viewingDoctor.orders.map((o: any) => (
                  <li key={o.id}>Order #{o.id} - Qty: {o.quantity} - {o.status}</li>
                ))}
              </ul>
            ) : <p style={{ margin: 0, color: 'var(--muted)' }}>No orders found.</p>}

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Samples</h4>
            {viewingDoctor.samples && viewingDoctor.samples.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {viewingDoctor.samples.map((s: any) => (
                  <li key={s.id}>Sample #{s.id} - Qty: {s.quantity} - {s.status}</li>
                ))}
              </ul>
            ) : <p style={{ margin: 0, color: 'var(--muted)' }}>No samples found.</p>}

            <div className="modal-actions">
              <button type="button" onClick={() => setViewingDoctor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
