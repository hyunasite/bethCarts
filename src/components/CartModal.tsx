import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Hash } from 'lucide-react';
import { CartItem, Product, Order } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onReserve: (customerName: string, queuingNumber: number) => Promise<void>;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  products,
  orders,
  onUpdateQuantity,
  onRemoveItem,
  onReserve
}: CartModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [queuingNumberInput, setQueuingNumberInput] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<boolean>(false);
  const [assignedQueue, setAssignedQueue] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Resolve CartItem -> Product helper
  const cartDetails = cart.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      product: p,
      subtotal: p ? p.price * item.quantity : 0
    };
  }).filter(item => !!item.product) as {
    productId: string;
    quantity: number;
    product: Product;
    subtotal: number;
  }[];

  const totalPrice = cartDetails.reduce((sum, item) => sum + item.subtotal, 0);

  // Map engaged numbers
  const occupiedNumbers = orders.map(o => Number(o.queuingNumber)).filter(n => !isNaN(n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please supply a reservation contact name.');
      return;
    }

    if (!queuingNumberInput) {
      setErrorMsg('Please select or specify a queuing number.');
      return;
    }

    const num = Number(queuingNumberInput);
    if (num < 1 || num > 100) {
      setErrorMsg('Queuing number must reside between 1 and 100.');
      return;
    }

    if (occupiedNumbers.includes(num)) {
      setErrorMsg(`Queuing number ${num} is already used by another active hold. Please select another free number.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onReserve(customerName, num);
      setAssignedQueue(num);
      setSuccessOrder(true);
      setCustomerName('');
      setQueuingNumberInput('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Validation issue: Could not save reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(false);
    setAssignedQueue(null);
    setErrorMsg(null);
    onClose();
  };

  // Quick helper to suggest 4 immediate unassigned numbers
  const suggestions: number[] = [];
  for (let i = 1; i <= 100; i++) {
    if (!occupiedNumbers.includes(i)) {
      suggestions.push(i);
      if (suggestions.length >= 4) break;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" role="dialog" aria-modal="true" id="cart-modal">
      {/* Backdrop overlay */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-purple-950/45 backdrop-blur-xs transition-opacity" 
        aria-hidden="true"
      ></div>

      {/* Centering container */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 relative z-10 pointer-events-none">
        
        {/* Trick to center modal in tailwind handles */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel body */}
        <div className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-[#FBF9FD] rounded-2xl shadow-2xl border border-purple-150/40 pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-700" />
              <h2 className="font-serif text-lg font-medium text-purple-950">
                {successOrder ? 'Reservation Confirmed' : 'Your Reservation Cart'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6">
            {successOrder ? (
              /* Success Panel View */
              <div className="text-center py-6" id="reservation-success-pane">
                <div className="w-14 h-14 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 border border-purple-100">
                  <ShieldCheck className="w-8 h-8 animate-pulse text-emerald-600" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-purple-950 tracking-tight mb-2">
                  Reserved successfully!
                </h3>
                <p className="text-purple-900/60 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                  Fine goods have been set aside for you. Stock deduction has been initiated and queue allocated.
                </p>
                <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4 font-mono text-[11px] text-purple-900/80 max-w-sm mx-auto mb-6 text-left">
                  <div className="font-bold border-b border-purple-100 pb-1.5 mb-1.5 uppercase text-purple-800 text-center tracking-wider flex items-center justify-center gap-1">
                    <Hash className="w-4 h-4 text-purple-700" /> Assigned Queue Hold: #{assignedQueue}
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Ledger State:</span>
                    <span className="text-emerald-700 font-bold uppercase">ACTIVE & SAVED</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Expiry Period:</span>
                    <span className="text-amber-700 font-bold">24 Hours (RESTORES STOCK)</span>
                  </div>
                  <div className="text-[10px] text-purple-400 pt-1.5 border-t border-purple-150 mt-1.5 text-center leading-snug">
                    Provide queue #<strong>{assignedQueue}</strong> to cashier for handover payment and pick-up.
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="bg-purple-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-purple-800 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cartDetails.length === 0 ? (
              /* Empty Cart View */
              <div className="text-center py-10" id="empty-cart-pane font-sans">
                <div className="w-12 h-14 mx-auto mb-4 text-purple-250">
                  <ShoppingBag className="w-full h-full stroke-1 text-purple-300" />
                </div>
                <h3 className="font-sans text-lg font-bold text-purple-950 mb-2">My Reservation Cart is Empty</h3>
                <p className="text-purple-650/60 text-xs mb-6 max-w-xs mx-auto">
                  Browse our collections and add products to secure priority hold status.
                </p>
                <button
                  onClick={handleClose}
                  className="border border-purple-300 text-purple-700 px-5 py-2 rounded-xl text-xs font-medium hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              /* Cart List & Checkout View */
              <div id="active-cart-pane">
                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-4 bg-red-50 text-red-805 text-xs py-2 px-3 rounded-lg border border-red-200 flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4 max-h-[170px] overflow-y-auto pr-2 mb-4 scrollbar-thin">
                  {cartDetails.map((item) => (
                    <div 
                      key={item.productId}
                      className="flex items-center gap-3 py-2 border-b border-purple-50 last:border-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded object-cover border border-purple-100/60 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-grow">
                        <h4 className="font-sans text-purple-950 font-bold text-xs tracking-tight line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-purple-400 text-[10px] font-mono block">
                          ₱{item.product.price} each (Stock: {item.product.stock} left)
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 border border-purple-150 bg-white rounded-md p-1 scale-90">
                        <button
                          disabled={item.quantity <= 1}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-purple-500 hover:text-purple-900 disabled:opacity-30 disabled:hover:text-purple-500 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-mono font-medium text-purple-800">
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= item.product.stock}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-purple-500 hover:text-purple-900 disabled:opacity-30 disabled:hover:text-purple-500 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="p-1.5 rounded-md text-purple-400 hover:text-red-500 hover:bg-neutral-50 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Price Card */}
                <div className="bg-purple-50/50 rounded-lg p-3.5 font-mono text-purple-900/90 text-xs flex justify-between items-center border border-purple-100 mb-6">
                  <span>Total Est. Ledger Value:</span>
                  <span className="font-sans text-sm font-semibold text-purple-950">₱{totalPrice}</span>
                </div>

                {/* Reservation checkout parameters form (NAME ONLY and QUEUING NUMBER) */}
                <form onSubmit={handleSubmit} className="border-t border-purple-100 pt-5">
                  <div className="font-sans text-xs font-bold uppercase tracking-wider text-purple-950 mb-3">
                    Submit Hold Credentials
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label htmlFor="customer-name-field" className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                        Reservation Name
                      </label>
                      <input
                        id="customer-name-field"
                        type="text"
                        required
                        placeholder="Juan Dela Cruz"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-lg text-xs py-2 px-3 text-purple-950 placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-sans"
                      />
                    </div>
                    <div>
                      <label htmlFor="customer-queue-field" className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1 font-bold">
                        Hold Queue Number (1-100)
                      </label>
                      <div className="relative">
                        <input
                          id="customer-queue-field"
                          type="number"
                          required
                          min="1"
                          max="100"
                          placeholder="e.g. 7"
                          value={queuingNumberInput}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setQueuingNumberInput(val);
                          }}
                          className={`w-full bg-white border rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 text-purple-955 font-mono ${
                            queuingNumberInput && occupiedNumbers.includes(Number(queuingNumberInput))
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-purple-200 focus:ring-purple-500'
                          }`}
                        />
                        {queuingNumberInput && occupiedNumbers.includes(Number(queuingNumberInput)) && (
                          <span className="absolute right-2 top-2 text-[8px] font-mono font-bold text-red-500 uppercase bg-red-50 px-1 rounded select-none">
                            IN USE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Available Number Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-5 select-none">
                      <span className="text-[9px] font-mono uppercase text-purple-400 tracking-wide block mb-1.5 font-bold">
                        Quick available queuing numbers:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setQueuingNumberInput(num)}
                            className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md border transition-all cursor-pointer ${
                              queuingNumberInput === num
                                ? 'bg-purple-800 text-white border-purple-800'
                                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            #{num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (queuingNumberInput !== '' && occupiedNumbers.includes(Number(queuingNumberInput)))}
                    className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:opacity-95 text-white text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium cursor-pointer transition-transform duration-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-md"
                  >
                    <span>{isSubmitting ? 'Securing Holds...' : 'Confirm Items Handover Hold'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
