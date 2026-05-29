import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Sparkles, Search, Store } from 'lucide-react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartModal from './components/CartModal';
import AdminPanel from './components/AdminPanel';
import AnnouncementBanner from './components/AnnouncementBanner';
import { Product, Order, CartItem, DatabaseStatus, Sale } from './types';
import { 
  getDatabaseStatus, 
  onProductsChange, 
  onOrdersChange, 
  onSalesChange,
  reserveProducts, 
  updateStock, 
  addProduct, 
  editProduct,
  deleteProduct,
  markReservationAsSoldAndPaid,
  releaseReservation,
  checkExpiredReservations,
  resetDatabase 
} from './db';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<'shop' | 'admin'>('shop');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loader status
  const [isLoading, setIsLoading] = useState(true);
  
  // Toasts
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  
  // Database connection mode trackers
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    isCloud: false,
    isConnected: false,
    projectId: null
  });

  // Loader automatic timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Expiry sweep check triggered on load & periodically
  useEffect(() => {
    const runSweep = () => {
      checkExpiredReservations().then((expiredCount) => {
        if (expiredCount > 0) {
          showToast(`Sweep complete: Freed ${expiredCount} expired holds back to store inventory.`);
        }
      }).catch(err => console.error('Expiry sweep failed', err));
    };

    // Run custom timeout sweep shortly after loading completes
    const runTimeoutId = setTimeout(runSweep, 2000);

    // Run sweep every 45 seconds thereafter
    const intervalId = setInterval(runSweep, 45000);

    return () => {
      clearTimeout(runTimeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Load status and live records subscriptions
  useEffect(() => {
    // Collect status configuration
    setDbStatus(getDatabaseStatus());

    // Subscribe to product alterations in database in real-time
    const unsubscribeProducts = onProductsChange((latestProducts) => {
      setProducts(latestProducts);
    });

    // Subscribe to order registers
    const unsubscribeOrders = onOrdersChange((latestOrders) => {
      setOrders(latestOrders);
    });

    // Subscribe to sales records
    const unsubscribeSales = onSalesChange((latestSales) => {
      setSales(latestSales);
    });

    // Load cart from sessionStorage to persist items locally during tab refresh
    try {
      const savedCart = sessionStorage.getItem('jj_sarisari_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('sessionStorage error reading cart data', e);
    }

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeSales();
    };
  }, []);

  // Sync cart adjustments back to sessionStorage
  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    try {
      sessionStorage.setItem('jj_sarisari_cart', JSON.stringify(updatedCart));
    } catch (e) {
      console.error('sessionStorage write error', e);
    }
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    let updatedCart: CartItem[] = [];

    if (existingIndex > -1) {
      // Remove if they click a product already in cart
      updatedCart = cart.filter((item) => item.productId !== product.id);
      showToast(`Removed "${product.name}" from your holds.`);
    } else {
      // Add to holds
      if (product.stock <= 0) {
        showToast(`Sorry! "${product.name}" is sold out.`);
        return;
      }
      updatedCart = [...cart, { productId: product.id, quantity: 1 }];
      showToast(`Added "${product.name}" to cart.`);
    }
    saveCart(updatedCart);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} units of "${product.name}" are available.`);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const handleRemoveCartItem = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const updatedCart = cart.filter((item) => item.productId !== productId);
    saveCart(updatedCart);
    if (prod) {
      showToast(`Removed "${prod.name}" from holds.`);
    }
  };

  const handleReserveCheckout = async (name: string, queuingNumber: number) => {
    // Invoke main reserve function
    await reserveProducts(cart, name, queuingNumber);
    // On complete success: clear cart
    saveCart([]);
    showToast("Items successfully reserved!");
  };

  const handleReserveDirect = async (product: Product, name: string, queuingNumber: number, quantity: number) => {
    // Generate a direct cart list for this single item
    const directCart: CartItem[] = [{ productId: product.id, quantity }];
    await reserveProducts(directCart, name, queuingNumber);
    showToast(`"${product.name}" successfully reserved!`);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.message]);

  const categories = ['All Categories', 'Clothes', 'Slippers', 'Accessories', 'Other'];
  
  // Filter products by both category selection and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All Categories' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- PULSING FULLSCREEN LOADER VIEW ---
  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-tr from-purple-950 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center font-sans antialiased relative" 
        id="shop-loader"
      >
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl relative">
            <Store className="w-12 h-12 text-purple-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          
          <div className="animate-bounce select-none">
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-purple-150 to-indigo-150 bg-clip-text text-transparent">
              Cart
            </h2>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50 bg-white/5 py-1.5 px-4 rounded-full border border-white/5 backdrop-blur-xs w-48 mx-auto font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Welcome shopping</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-200/65 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* Dynamic Fading Announcement Banner at absolute top */}
      <AnnouncementBanner />

      {/* Navbar segment */}
      <Navbar 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenShop={() => setCurrentView('shop')}
        currentView={currentView}
        dbStatus={dbStatus}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full md:scroll-smooth">
        {currentView === 'shop' ? (
          /* Storefront Main View */
          <div className="space-y-6" id="storefront-shop-view">
            
            {/* Elegant Row Welcome Hero Banner Card */}
            <div className="bg-gradient-to-r from-white via-purple-50/25 to-indigo-50/40 rounded-2xl border border-purple-100/60 p-8 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left max-w-md select-none">
                <h1 className="font-sans text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  Welcome to J&J
                </h1>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  Browse our latest arrivals and reserve for pickup within 24 hours. No login required.
                </p>
              </div>

              {/* Responsive Category Pills on Right */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 max-w-lg">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-600 border-purple-600 text-white font-semibold shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35'
                        : 'bg-white hover:bg-slate-50 border-stone-200/65 shadow-sm hover:shadow-md text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search products bar - aligned right */}
            <div className="flex justify-end pr-1">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-stone-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-stone-850 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder-stone-400 shadow-md hover:shadow-lg focus:shadow-lg hover:border-stone-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-100/60 p-8 text-stone-400 font-sans text-sm">
                No articles matches your query. Restock or edit items inside Admin Panel.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" id="smooth-scroll-grid">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    isAdded={cart.some((item) => item.productId === p.id)}
                    onReserveInstant={(product) => {
                      const alreadyInCart = cart.some((item) => item.productId === product.id);
                      if (!alreadyInCart) {
                        // Add to holds list
                        const quantityInCart = 1;
                        if (product.stock > 0) {
                          saveCart([...cart, { productId: product.id, quantity: quantityInCart }]);
                        } else {
                          showToast(`Sorry! "${product.name}" is sold out.`);
                          return;
                        }
                      }
                      setIsCartOpen(true);
                    }}
                    orders={orders}
                    onReserveDirect={handleReserveDirect}
                  />
                ))}
              </div>
            )}

          </div>
        ) : (
          /* Admin View segment */
          <div className="space-y-6" id="admin-panel-view">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-purple-500 uppercase font-bold">System Operator Console</span>
                <h1 className="font-sans font-extrabold text-2xl text-purple-950 mt-0.5">Boutique Inventory Office</h1>
              </div>
              <button
                onClick={() => setCurrentView('shop')}
                className="text-xs border border-purple-300 rounded-lg px-4 py-2 hover:bg-purple-50 text-purple-700 hover:border-purple-400 transition-all cursor-pointer font-medium"
              >
                Back to Shop
              </button>
            </div>

            <AdminPanel
              products={products}
              orders={orders}
              sales={sales}
              onUpdateStock={async (productId, newStock) => {
                await updateStock(productId, newStock);
              }}
              onAddProduct={async (data) => {
                await addProduct(data);
              }}
              onUpdateProduct={async (productId, fields) => {
                await editProduct(productId, fields);
                showToast("Product details updated.");
              }}
              onDeleteProduct={async (productId) => {
                await deleteProduct(productId);
                showToast("Product deleted from database.");
              }}
              onMarkAsSoldAndPaid={async (orderId) => {
                await markReservationAsSoldAndPaid(orderId);
                showToast("Hold logged as complete, revenue updated.");
              }}
              onReleaseReservation={async (orderId) => {
                await releaseReservation(orderId);
                showToast("Reservation canceled. Restocked item back to catalog.");
              }}
              onResetAll={async () => {
                await resetDatabase();
              }}
              dbStatus={dbStatus}
            />
          </div>
        )}
      </main>

      {/* Elegant, simple visual footer matching mockup screenshot details */}
      <footer className="mt-auto border-t border-stone-200/50 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left select-none">
            <span className="font-sans font-extrabold text-xs text-slate-800 block">
              J&J Sari-Sari Store
            </span>
            <span className="text-[10px] text-slate-455 text-slate-400 font-sans">
              Owned by Bluu
            </span>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              © 2026 Reservation System
            </span>
          </div>

          <div className="text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-purple-650 font-bold text-xs">
              <span className="text-purple-600 font-bold mt-0.5">📞</span>
              <span>0917-123-4567</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Local Pickup Only
            </span>
          </div>
        </div>
      </footer>

      {/* Cart Modal Container */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={products}
        orders={orders}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onReserve={handleReserveCheckout}
      />

      {/* Global Elegant Toast Alerts */}
      <div 
        className={`fixed bottom-5 right-5 z-50 bg-purple-950 text-white text-xs font-mono font-medium tracking-wide py-3 px-4 rounded-xl border border-purple-900 shadow-xl flex items-center gap-3 transition-all duration-350 transform ${
          toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.95] pointer-events-none'
        }`}
        id="applet-hud-toast"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
        <span>{toast.message}</span>
        <button 
          onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          className="text-purple-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
