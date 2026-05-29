import React, { useState } from 'react';
import { 
  Lock, 
  Sliders, 
  RefreshCw, 
  Plus, 
  ShoppingBag, 
  History, 
  AlertTriangle, 
  ArrowRight, 
  CircleAlert, 
  Trash2, 
  Edit3, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Package, 
  Layers, 
  Upload, 
  Eye, 
  CheckCircle, 
  X, 
  UserCheck 
} from 'lucide-react';
import { Product, Order, DatabaseStatus, Sale } from '../types';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  sales: Sale[];
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onAddProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (productId: string, fields: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onMarkAsSoldAndPaid: (orderId: string) => Promise<void>;
  onReleaseReservation: (orderId: string) => Promise<void>;
  onResetAll: () => Promise<void>;
  dbStatus: DatabaseStatus;
}

export default function AdminPanel({
  products,
  orders,
  sales,
  onUpdateStock,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onMarkAsSoldAndPaid,
  onReleaseReservation,
  onResetAll,
  dbStatus
}: AdminPanelProps) {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('jj_sarisari_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [authError, setAuthError] = useState(false);

  // Drag and drop states for image upload
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');

  // Editing product states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'available' | 'reserved' | 'sold'>('available');
  const [editImage, setEditImage] = useState('');

  // New product form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(50);
  const [newProdStock, setNewProdStock] = useState(5);
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Clothes');

  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // --- Calculations for Earning Statistics ---
  const totalEarnings = sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalActiveReservations = orders.length;

  // Calendar dates matching criteria
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
  const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

  const todayEarnings = sales
    .filter(sale => new Date(sale.createdAt).getTime() >= startOfToday)
    .reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  const weeklyEarnings = sales
    .filter(sale => new Date(sale.createdAt).getTime() >= startOfWeek)
    .reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  const monthlyEarnings = sales
    .filter(sale => new Date(sale.createdAt).getTime() >= startOfMonth)
    .reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'bluu2026') {
      setIsAuthenticated(true);
      setAuthError(false);
      try {
        localStorage.setItem('jj_sarisari_admin_authenticated', 'true');
      } catch (err) {
        console.error('Error writing to localStorage', err);
      }
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    try {
      localStorage.removeItem('jj_sarisari_admin_authenticated');
    } catch (err) {
      console.error('Error removing from localStorage', err);
    }
  };

  // Convert File to Base64 hook
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please drop an image file only.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageBase64(reader.result);
        setNewProdImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = newProdImage || uploadedImageBase64;
    
    if (!newProdName.trim() || !finalImage.trim() || !newProdDesc.trim()) {
      setFormError('Please supply a name, Description, and either paste an Image URL or drop/select an image file.');
      return;
    }

    setFormError(null);
    setFormSuccess(false);

    try {
      await onAddProduct({
        name: newProdName,
        price: Number(newProdPrice),
        stock: Number(newProdStock),
        image: finalImage,
        description: newProdDesc,
        category: newProdCategory
      });
      setFormSuccess(true);
      
      // Reset fields
      setNewProdName('');
      setNewProdPrice(50);
      setNewProdStock(5);
      setNewProdImage('');
      setNewProdDesc('');
      setUploadedImageBase64('');
    } catch (err: any) {
      setFormError(err.message || 'Could not insert product.');
    }
  };

  const handleResetTrigger = async () => {
    const confirmation = window.confirm(
      'Are you absolutely sure you want to restore default products, wipe active reservations, and flush sales history?'
    );
    if (!confirmation) return;

    setIsResetting(true);
    try {
      await onResetAll();
      alert('Database restore complete.');
    } catch (err: any) {
      alert('Reset issue: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Product Editing Handles
  const startEditing = (p: Product) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditStock(p.stock);
    setEditCategory(p.category);
    setEditDescription(p.description);
    setEditStatus(p.status || (p.stock > 0 ? 'available' : 'reserved'));
    setEditImage(p.image);
  };

  const cancelEditing = () => {
    setEditingProductId(null);
  };

  const saveProductEdit = async () => {
    if (!editName.trim() || !editDescription.trim() || !editImage.trim()) {
      alert('Please fill out Name, Description, and Image coordinates.');
      return;
    }

    try {
      // Determine auto status if stock adjusts
      let finalStatus = editStatus;
      if (editStock > 0 && editStatus === 'reserved') {
        finalStatus = 'available';
      } else if (editStock === 0 && editStatus === 'available') {
        finalStatus = 'reserved';
      }

      await onUpdateProduct(editingProductId!, {
        name: editName,
        price: Number(editPrice),
        stock: Number(editStock),
        category: editCategory,
        description: editDescription,
        status: finalStatus,
        image: editImage
      });
      
      setEditingProductId(null);
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDeleteTrigger = async (productId: string, name: string) => {
    const confirmation = window.confirm(`Are you sure you want to delete "${name}" permanently?`);
    if (!confirmation) return;

    try {
      await onDeleteProduct(productId);
    } catch (err: any) {
      alert('Delete issue: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    /* Gate Screen */
    return (
      <div className="max-w-md mx-auto my-12" id="admin-auth-gate">
        <div className="bg-white p-8 rounded-2xl border border-purple-150/40 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-900 rounded-xl text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            {/* iOS Styled "Admin Access Gate" font styling requested */}
            <h2 
              className="text-xl font-bold tracking-tight text-purple-950 font-sans"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              Admin Access Gate
            </h2>
            <p className="text-purple-600/60 text-xs mt-1.5 font-sans leading-relaxed">
              Log in to regulate stocks, configure items, and view logged shopper accounts.
            </p>
          </div>

          {authError && (
            <div className="mb-4 bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <CircleAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>Mismatch passcode credentials. Please try again.</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-passcode-field" className="block text-[10px] font-mono text-purple-400 uppercase tracking-wider mb-1.5 font-bold">
                Passcode Verification
              </label>
              <input
                id="admin-passcode-field"
                type="password"
                required
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-purple-50/30 border border-purple-205 rounded-xl tracking-widest text-purple-950 py-2.5 px-4 text-center text-sm placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:opacity-95 active:scale-98 transition-all text-white text-sm py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              Verify Credentials
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Help Code Info */}
          <div className="mt-8 pt-6 border-t border-purple-100/50 text-center">
            <p className="text-purple-800/60 text-[11px] leading-relaxed font-sans">
              Please use the passcode <strong className="font-mono text-xs text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded leading-none">bluu2026</strong> to unlock dashboard controls.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* Authenticated Dashboard Screen */
  return (
    <div className="space-y-8 animate-fade-in" id="admin-active-dashboard">
      
      {/* 💰 SALES & EARNINGS SYSTEM WIDGETS */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            SALES & EARNINGS METRICS
          </h3>
          <button
            onClick={handleLogout}
            className="text-[10px] font-mono tracking-wide px-3 py-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-lg transition-all cursor-pointer font-bold uppercase shadow-2xs"
          >
            Sign Out Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/20 p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold block tracking-wider mb-1">
              Total Earnings
            </span>
            <div>
              <span className="text-xl font-extrabold text-emerald-950 block font-sans">₱{totalEarnings}</span>
              <span className="text-[9px] font-mono text-emerald-400">Total received cash</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-purple-450 uppercase font-bold block tracking-wider mb-1">
              Today's Earnings
            </span>
            <div>
              <span className="text-xl font-extrabold text-purple-950 block font-sans">₱{todayEarnings}</span>
              <span className="text-[9px] font-mono text-purple-400">Daily sales</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-purple-450 uppercase font-bold block tracking-wider mb-1">
              Weekly Sales
            </span>
            <div>
              <span className="text-xl font-extrabold text-purple-950 block font-sans">₱{weeklyEarnings}</span>
              <span className="text-[9px] font-mono text-purple-400">Last 7 days</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-purple-450 uppercase font-bold block tracking-wider mb-1">
              Monthly Sales
            </span>
            <div>
              <span className="text-xl font-extrabold text-purple-950 block font-sans">₱{monthlyEarnings}</span>
              <span className="text-[9px] font-mono text-purple-400">Last 30 days</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-purple-450 uppercase font-bold block tracking-wider mb-1">
              Items Sold & Paid
            </span>
            <div>
              <span className="text-xl font-extrabold text-purple-950 block font-sans">{totalItemsSold} pcs</span>
              <span className="text-[9px] font-mono text-purple-400">Paid and checked out</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-purple-450 uppercase font-bold block tracking-wider mb-1">
              Active Holds
            </span>
            <div>
              <span className="text-xl font-extrabold text-fuchsia-700 block font-sans">{totalActiveReservations} holds</span>
              <span className="text-[9px] font-mono text-fuchsia-400">Expiring in 24 hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stock Levels & Quick stock change */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stock Controller */}
          <div className="bg-white rounded-xl border border-purple-150/40 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-705" />
                <h3 className="font-sans text-base font-bold tracking-tight text-purple-950" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  Stock Controller
                </h3>
              </div>
              <button
                disabled={isResetting}
                onClick={handleResetTrigger}
                className="flex items-center gap-1.5 text-[10px] font-mono tracking-wide px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-all cursor-pointer disabled:opacity-40 font-semibold uppercase"
              >
                <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                RESET ALL TABLES
              </button>
            </div>

            {/* Inventory List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-50/20 border-b border-purple-100 text-[10px] font-mono uppercase text-purple-450 tracking-wider">
                    <th className="py-3 px-6 font-semibold">Boutique Item</th>
                    <th className="py-3 px-4 font-semibold text-center">Unit Price</th>
                    <th className="py-3 px-4 font-semibold text-center">Manual Status</th>
                    <th className="py-3 px-6 font-semibold text-right">Stock Count</th>
                    <th className="py-3 px-6 font-semibold text-center">Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/50">
                  {products.map((p) => {
                    const lowStockClass = p.stock === 0 ? 'bg-red-50/25' : p.stock <= 2 ? 'bg-fuchsia-50/15' : '';
                    const isBeingEdited = editingProductId === p.id;
                    const calculatedStatus = p.stock > 0 ? 'available' : (p.status === 'sold' ? 'sold' : 'reserved');
                    
                    if (isBeingEdited) {
                      return (
                        <tr key={p.id} className="bg-purple-50/30">
                          <td className="py-4 px-6" colSpan={5}>
                            <div className="space-y-3 p-2 bg-white rounded-lg border border-purple-200 my-1">
                              <span className="text-[10px] font-mono font-bold text-purple-700 block uppercase">Editing: {p.name}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Product Name</label>
                                  <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)} 
                                    className="w-full border rounded px-2 py-1 text-xs font-sans text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Price (₱)</label>
                                  <input 
                                    type="number" 
                                    value={editPrice} 
                                    onChange={(e) => setEditPrice(Number(e.target.value))} 
                                    className="w-full border rounded px-2 py-1 text-xs font-mono text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Stock</label>
                                  <input 
                                    type="number" 
                                    value={editStock} 
                                    onChange={(e) => setEditStock(Number(e.target.value))} 
                                    className="w-full border rounded px-2 py-1 text-xs font-mono text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Direct Status</label>
                                  <select 
                                    value={editStatus} 
                                    onChange={(e: any) => setEditStatus(e.target.value)} 
                                    className="w-full border rounded px-2 py-1 text-xs font-sans text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="available">Available (Green)</option>
                                    <option value="reserved">Reserved (Yellow)</option>
                                    <option value="sold">Sold (Red)</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Description</label>
                                  <input 
                                    type="text" 
                                    value={editDescription} 
                                    onChange={(e) => setEditDescription(e.target.value)} 
                                    className="w-full border rounded px-2 py-1 text-xs font-sans text-purple-955 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-purple-400 block mb-0.5 uppercase">Category</label>
                                  <select 
                                    value={editCategory} 
                                    onChange={(e) => setEditCategory(e.target.value)} 
                                    className="w-full border rounded px-2 py-1 text-xs font-sans text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="Clothes">Clothes</option>
                                    <option value="Slippers">Slippers</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                                <button 
                                  onClick={cancelEditing} 
                                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={saveProductEdit} 
                                  className="px-3 py-1 bg-purple-700 hover:bg-purple-805 text-white text-xs font-medium rounded cursor-pointer"
                                >
                                  Save Coordinates
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={p.id} className={`hover:bg-purple-50/15 transition-colors ${lowStockClass}`}>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded border border-purple-100/60 shrink-0 shadow-3xs"
                              loading="lazy"
                            />
                            <div>
                              <div className="font-sans font-bold text-xs text-purple-950 mb-0.5 leading-snug">{p.name}</div>
                              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-purple-600 px-1.5 py-0.5 bg-purple-50 rounded">
                                {p.category}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-xs font-bold text-purple-900">₱{p.price}</span>
                        </td>

                        {/* Explicit Status Controls */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-full ${
                            calculatedStatus === 'available' ? 'bg-green-100 text-green-700' :
                            calculatedStatus === 'reserved' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              calculatedStatus === 'available' ? 'bg-green-500' :
                              calculatedStatus === 'reserved' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}></span>
                            {calculatedStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {p.stock === 0 && (
                              <span className="text-[8px] font-mono uppercase font-extrabold text-red-700 bg-red-100/85 px-1 rounded transform scale-90 mr-0.5">
                                Sold Out
                              </span>
                            )}
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={p.stock}
                              onChange={(e) => onUpdateStock(p.id, Number(e.target.value))}
                              className="w-14 bg-white border border-purple-200 rounded text-center text-xs py-1 px-1 font-mono hover:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 text-purple-950 font-bold"
                            />
                          </div>
                        </td>

                        {/* Edit & Delete Action Column */}
                        <td className="py-3.5 px-6 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEditing(p)}
                              title="Edit Details"
                              className="p-1 text-purple-650 hover:bg-purple-50 rounded border border-transparent hover:border-purple-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(p.id, p.name)}
                              title="Delete Item"
                              className="p-1 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shopper Handover Ledger (Active hold queue reservations) */}
          <div className="bg-white rounded-xl border border-purple-150/40 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-705" />
                <h3 className="font-sans text-base font-bold tracking-tight text-purple-950" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  Shopper Handover Ledger (Active Reservations)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-purple-450 uppercase font-bold py-0.5 px-2 bg-purple-50 rounded-md">
                {orders.length} ACTIVE holds
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-10 text-center text-purple-400/75 text-xs font-sans">
                No active shopper reservation queue holds logged.
              </div>
            ) : (
              <div className="divide-y divide-purple-100/50">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-5 hover:bg-purple-50/10 last:border-0 text-xs font-sans text-purple-900/80">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-purple-950">{ord.customerName}</span>
                          <span className="font-mono text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Queue No: #{ord.queuingNumber}
                          </span>
                        </div>
                        <span className="text-[9px] text-purple-400 font-mono block mt-1">ID: {ord.id}</span>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-extrabold text-purple-900 block">₱{ord.totalPrice}</span>
                        <span className="text-[10px] text-purple-450 font-mono block">
                          {new Date(ord.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="bg-purple-50/20 rounded-lg p-3.5 border border-purple-100/60 mb-4">
                      <div className="font-mono text-[9px] uppercase text-purple-450 tracking-wider font-extrabold mb-1.5">Hold Items:</div>
                      <div className="space-y-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[11px] text-purple-800">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span className="font-bold">₱{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ledger Action Buttons (Satisfies Sales confirmatory clicked requirements) */}
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={async () => {
                          const conf = window.confirm(`Release this reservation for ${ord.customerName}? This cancels the queue # ${ord.queuingNumber} and restores items stock.`);
                          if (!conf) return;
                          await onReleaseReservation(ord.id);
                        }}
                        className="px-3 py-1.5 border border-stone-200 text-stone-605 bg-white hover:bg-stone-50 hover:border-stone-300 rounded-lg text-[10px] uppercase font-bold tracking-wide transition-colors cursor-pointer"
                      >
                        Release & Cancel Hold
                      </button>
                      <button
                        onClick={async () => {
                          const conf = window.confirm(`Mark items as Sold & Paid for ${ord.customerName}? This will register ₱${ord.totalPrice} to Total Earnings and complete checkout.`);
                          if (!conf) return;
                          await onMarkAsSoldAndPaid(ord.id);
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark as Sold & Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales History Log (Transactions Registry) */}
          <div className="bg-white rounded-xl border border-purple-150/40 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-sans text-base font-bold tracking-tight text-purple-950" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  Confirmed Sales Registry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 uppercase font-extrabold py-0.5 px-2 bg-emerald-50 rounded-md">
                {sales.length} transactions
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="p-10 text-center text-purple-400/75 text-xs font-sans">
                No paid checkout transactions loaded yet. Click "Mark as Sold & Paid" in holds queue to ledger earnings.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/15 border-b border-emerald-100 text-[10px] font-mono uppercase text-emerald-700 tracking-wider">
                      <th className="py-2.5 px-6 font-semibold">Boutique Item Sold</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Sales Price</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Qty</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Product Total</th>
                      <th className="py-2.5 px-6 font-semibold text-right">Transaction Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/30">
                    {sales.map((sl) => (
                      <tr key={sl.id} className="hover:bg-emerald-50/5 transition-colors">
                        <td className="py-3 px-6">
                          <span className="font-sans font-bold text-xs text-purple-950">{sl.productName}</span>
                          <span className="text-[8px] font-mono text-purple-400 block tracking-widest">{sl.id}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-xs text-purple-900 font-medium">₱{sl.price}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-sans text-xs text-purple-800 font-semibold">{sl.quantity} pc</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono text-xs text-emerald-705 font-extrabold">₱{sl.price * sl.quantity}</span>
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-[10px] text-purple-450">
                          {new Date(sl.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Add new curated product card form */}
        <div className="space-y-4">
          <div className="bg-[#FAF8FD] p-6 rounded-xl border border-purple-150/40 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-purple-700" />
              <h3 className="font-sans text-base font-extrabold tracking-tight text-purple-955">
                Add New Boutique Item
              </h3>
            </div>

            {formSuccess && (
              <div className="mb-4 bg-emerald-50 text-emerald-900 border border-emerald-150 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Product added successfully! Catalog synchronized.</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-150">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddNewProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-purple-440 tracking-wider mb-1 font-bold">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ceramic Mug, Candle, Scarf..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2.5 px-3 text-purple-955 placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2 px-3 text-purple-955 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2 px-3 text-purple-955 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                  Art Category
                </label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2.5 px-3 text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                >
                  <option value="Clothes">Clothes</option>
                  <option value="Slippers">Slippers</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* DRAG AND DROP COMPUTER IMAGE FIELD (Admin Only) */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wide mb-1 font-bold">
                  Release Product Image
                </label>
                
                {/* Visual drag area dropzone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 relative ${
                    dragOver 
                      ? 'border-purple-600 bg-purple-100/40' 
                      : 'border-purple-200 bg-purple-50/25 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  {uploadedImageBase64 ? (
                    <div className="space-y-2">
                      <img 
                        src={uploadedImageBase64} 
                        alt="Preview" 
                        className="max-h-24 mx-auto rounded object-cover border border-purple-100"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setUploadedImageBase64('');
                          if (newProdImage.startsWith('data:image')) {
                            setNewProdImage('');
                          }
                        }}
                        className="text-[9px] font-mono uppercase text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <X className="w-3 h-3" /> Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-purple-400 mx-auto animate-bounce" />
                      <p className="text-[11px] text-purple-800 font-sans font-medium">
                        Drag & Drop image from computer
                      </p>
                      <p className="text-[9px] text-purple-400 font-sans">or click to browse local files</p>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-purple-100"></div>
                  <span className="flex-shrink mx-3 text-[9px] font-mono uppercase text-purple-400 tracking-wide font-semibold">Or paste image URL</span>
                  <div className="flex-grow border-t border-purple-100"></div>
                </div>

                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage.startsWith('data:image') ? '' : newProdImage}
                  onChange={(e) => {
                    setNewProdImage(e.target.value);
                    setUploadedImageBase64('');
                  }}
                  className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2 px-3 text-purple-955 placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                  Text Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write clear dimensions, fabric type, or condition coordinates..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2 px-3 text-purple-955 placeholder-purple-305 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-xs py-2.5 px-4 rounded-lg font-medium hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-md"
              >
                Create Boutique Record
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
