import { useEffect, useState } from 'react';
import type { Product } from '../types';

export default function ProductsPage() {
  const role = localStorage.getItem('role') || '';
  const canManage = ['manager', 'admin'].includes(role);
  const isAdmin = role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  
  // Create Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modals State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const loadProducts = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCategory) params.set('category', filterCategory);
    const response = await fetch(`/api/products?${params.toString()}`);
    setProducts(await response.json());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        category, 
        stock: Number(stock), 
        unitPrice: Number(unitPrice), 
        imageUrl 
      })
    });
    setName('');
    setCategory('');
    setStock('');
    setUnitPrice('');
    setImageUrl('');
    loadProducts();
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;
    await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName, 
        category: editCategory, 
        stock: Number(editStock), 
        unitPrice: Number(editUnitPrice), 
        imageUrl: editImageUrl 
      })
    });
    setEditingProduct(null);
    loadProducts();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadProducts();
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category || '');
    setEditStock(product.stock.toString());
    setEditUnitPrice(product.unitPrice?.toString() || '');
    setEditImageUrl(product.imageUrl || '');
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">P</div>
          <h2 className="page-title">Medicine Management</h2>
        </div>
        <span className="chip">Medicine master</span>
      </section>

      <p className="page-subtitle" style={{ marginBottom: 18 }}>Manage medicine masters used for orders, samples, and inventory planning.</p>

      <div className="panel-grid">
        {canManage ? <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Add Product</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 14 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" required />
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" />
            <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" type="number" required />
            <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Unit price" type="number" />
            <button type="submit" style={{ gridColumn: '1 / -1' }}>Save Product</button>
          </form>
        </section> : null}

        <section className="panel" style={{ gridColumn: canManage ? 'auto' : '1 / -1' }}>
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Inventory List</h3>
            <div className="stacked-actions">
              <input style={{ width: 180 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines" />
              <input style={{ width: 180 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} placeholder="Filter by category" />
              <button type="button" className="btn-ghost" onClick={loadProducts}>Search</button>
            </div>
          </div>

          {products.length ? (
            <div className="table-shell">
              <div className="table-header">
                <div>Product</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Actions</div>
              </div>
              {products.map((product) => (
                <div className="table-row" key={product.id}>
                  <div>
                    <h4>{product.name}</h4>
                    <p>Price: {product.unitPrice || '—'}</p>
                  </div>
                  <div>{product.category || 'General'}</div>
                  <div><span className="chip">{product.stock}</span></div>
                  <div className="table-actions">
                    <button type="button" className="btn-ghost" onClick={() => setViewingProduct(product)}>View</button>
                    {canManage && <button type="button" className="btn-ghost" onClick={() => openEditModal(product)}>Edit</button>}
                    {isAdmin && <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(product.id)}>Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No products found yet.</div>}
        </section>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Product</h3>
            <form onSubmit={handleEditSubmit} className="form-grid" style={{ marginTop: 14 }}>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Product name" required />
              <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category" />
              <input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="Image URL" />
              <input value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder="Stock" type="number" required />
              <input value={editUnitPrice} onChange={(e) => setEditUnitPrice(e.target.value)} placeholder="Unit price" type="number" />
              
              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="btn-ghost" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button type="submit">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {viewingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Product Details</h3>
            {viewingProduct.imageUrl && (
              <img src={viewingProduct.imageUrl} alt={viewingProduct.name} className="img-preview" />
            )}
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{viewingProduct.name}</span></div>
              <div className="detail-row"><span className="detail-label">ID</span><span className="detail-value">{viewingProduct.id}</span></div>
              <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{viewingProduct.category || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Unit Price</span><span className="detail-value">{viewingProduct.unitPrice || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Stock</span><span className="detail-value">{viewingProduct.stock}</span></div>
              <div className="detail-row"><span className="detail-label">Created At</span><span className="detail-value">{viewingProduct.createdAt || '—'}</span></div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setViewingProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
