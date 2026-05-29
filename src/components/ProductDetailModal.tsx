import React, { useState } from 'react';
import { X, ShieldCheck, Hash, ArrowRight, MessageSquareCode, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  orders: Order[];
  onReserveDirect: (customerName: string, queuingNumber: number, quantity: number) => Promise<void>;
  initialMode: 'view' | 'reserve';
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  orders,
  onReserveDirect,
  initialMode
}: ProductDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'reserve'>(initialMode);
  const [customerName, setCustomerName] = useState('');
  const [queuingNumberInput, setQueuingNumberInput] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(false);
  const [assignedQueue, setAssignedQueue] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync mode with initial mode when model opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCustomerName('');
      setQueuingNumberInput('');
      setQuantity(1);
      setSuccessOrder(false);
      setAssignedQueue(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Resolve list of currently occupied queuing numbers
  const occupiedNumbers = orders.map(o => Number(o.queuingNumber)).filter(n => !isNaN(n));

  // Auto-generate 4 recommended free queue numbers for quick selection
  const suggestions: number[] = [];
  for (let i = 1; i <= 100; i++) {
    if (!occupiedNumbers.includes(i)) {
      suggestions.push(i);
      if (suggestions.length >= 4) break;
    }
  }

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
      setErrorMsg(`Queuing number #${num} is already used by another active hold.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onReserveDirect(customerName.trim(), num, quantity);
      setAssignedQueue(num);
      setSuccessOrder(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not save reservation. Please try again.');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] overflow-y-auto font-sans flex items-center justify-center min-h-screen px-4 py-8">
        {/* Backdrop filter with realistic instagram-style deep blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xl transition-opacity"
        />

        {/* Modal content body container */}
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-[#FBF9FD] rounded-3xl shadow-2xl border border-purple-100/50 z-10 max-h-[90vh] md:max-h-none flex flex-col md:block"
        >
          {/* Close button inside modal container */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-stone-900/10 hover:bg-stone-900/20 text-stone-700 hover:text-stone-900 rounded-full p-2 cursor-pointer transition-colors focus:outline-none"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success screen inner view */}
          {successOrder ? (
            <div className="p-8 text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 mx-auto mb-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <ShieldCheck className="w-9 h-9 animate-pulse text-emerald-600" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight mb-2">
                Reservation Confirmed!
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto mb-6">
                Excellent selection! We have set aside <strong>{quantity} pc{quantity > 1 ? 's' : ''}</strong> of <strong>{product.name}</strong> for you. Stock has been locked.
              </p>

              <div className="bg-white border border-purple-100 rounded-2xl p-5 font-mono text-xs text-purple-950/90 max-w-sm mx-auto mb-6 text-left shadow-xs">
                <div className="font-bold border-b border-purple-100 pb-2.5 mb-2.5 uppercase text-purple-800 text-center tracking-wider flex items-center justify-center gap-1.5 text-sm">
                  <Hash className="w-4 h-4 text-purple-600" /> Assigned Queue: #{assignedQueue}
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-stone-500">Item Name:</span>
                  <span className="font-sans font-bold text-stone-850">{product.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-stone-500">Reserved Qty:</span>
                  <span className="font-bold text-stone-850">{quantity} pc{quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-stone-500">Total Price:</span>
                  <span className="font-sans font-extrabold text-purple-700">₱{product.price * quantity}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Expiry Time:</span>
                  <span className="text-amber-700 font-bold">24 Hours (RESTORES STOCK)</span>
                </div>
                <div className="text-[10px] text-purple-400 pt-2.5 border-t border-purple-100/50 mt-2 text-center leading-relaxed">
                  Provide queue number <strong>#{assignedQueue}</strong> to the cashier upon pick-up and hand-over payment.
                </div>
              </div>

              <button
                onClick={handleClose}
                className="bg-purple-900 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-purple-800 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Main Dual Column Layout */
            <div className="flex flex-col md:flex-row h-full">
              {/* Left Column: Big Product Image Display (takes 45% minimum) */}
              <div className="w-full md:w-1/2 bg-stone-900/5 relative aspect-square md:aspect-auto md:min-h-[480px] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-stone-100">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover max-h-[300px] md:max-h-none"
                />
                {/* Category Floating Pill */}
                <span className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-sm shadow-md">
                  {product.category}
                </span>
              </div>

              {/* Right Column: Interaction Form Panel */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-[600px]">
                <div>
                  {/* Title & Stats */}
                  <div className="mb-4">
                    <h2 className="font-sans text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-tight mb-2">
                      {product.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-sans font-black text-purple-600">
                        ₱{product.price}
                      </span>
                      <span className="text-xs text-stone-500 font-medium bg-stone-100/80 border border-stone-200/50 py-1 px-2.5 rounded-md">
                        {product.stock} pcs left in stock
                      </span>
                    </div>
                  </div>

                  {/* Product description paragraph */}
                  <p className="text-stone-600 text-sm leading-relaxed mb-6 font-sans">
                    {product.description || 'No description provided. Experience our premium high-quality local products curated with love and careful selection.'}
                  </p>

                  {/* Mode-conditional Interaction Blocks */}
                  {mode === 'view' ? (
                    /* VIEW MODE CONTROLS */
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setMode('reserve')}
                          className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-850 text-white font-semibold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-98"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Reserve This Item Now</span>
                        </button>
                        <button
                          onClick={handleClose}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs py-3.5 px-4 rounded-xl text-center cursor-pointer transition-colors"
                        >
                          Keep Browsing Catalog
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* RESERVE/CHECKOUT MODE CONTROLS */
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-stone-100 animate-slide-up">
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-900/90 mb-1 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                        Fill Reservation Details
                      </div>

                      {/* Error Banner inside Form */}
                      {errorMsg && (
                        <div className="bg-red-50 text-red-800 text-xs py-2.5 px-3 rounded-lg border border-red-200 flex items-center justify-between font-medium">
                          <span>{errorMsg}</span>
                          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 font-bold px-1">&times;</button>
                        </div>
                      )}

                      {/* Quantity selector */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1.5 font-bold">
                          Select Quantity to Reserve
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 border border-stone-200 bg-white rounded-md p-1">
                            <button
                              type="button"
                              disabled={quantity <= 1}
                              onClick={() => setQuantity(quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-black text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-mono font-extrabold text-purple-950">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= product.stock}
                              onClick={() => setQuantity(quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-sm font-black text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono text-xs text-stone-500 font-medium">
                            Subtotal: <strong className="text-purple-600 text-sm">₱{product.price * quantity}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Input: Customer Name */}
                      <div>
                        <label htmlFor="modal-name-input" className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1.5 font-bold">
                          Owner Reservation Name
                        </label>
                        <input
                          id="modal-name-input"
                          type="text"
                          required
                          placeholder="Juan Dela Cruz"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-white border border-purple-150 rounded-xl text-xs py-3 px-3.5 text-stone-850 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-sans shadow-2xs"
                        />
                      </div>

                      {/* Input: Hold Queue Number */}
                      <div>
                        <label htmlFor="modal-queue-input" className="block text-[10px] font-mono uppercase text-purple-400 tracking-wider mb-1.5 font-bold">
                          Hold Queue Number (1-100)
                        </label>
                        <div className="relative">
                          <input
                            id="modal-queue-input"
                            type="number"
                            required
                            min="1"
                            max="100"
                            placeholder="Select any free queue number e.g. 5"
                            value={queuingNumberInput}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setQueuingNumberInput(val);
                            }}
                            className={`w-full bg-white border rounded-xl text-xs py-3 px-3.5 focus:outline-none focus:ring-1 text-stone-850 font-mono shadow-2xs ${
                              queuingNumberInput && occupiedNumbers.includes(Number(queuingNumberInput))
                                ? 'border-red-400 focus:ring-red-500'
                                : 'border-purple-150 focus:ring-purple-500'
                            }`}
                          />
                          {queuingNumberInput && occupiedNumbers.includes(Number(queuingNumberInput)) && (
                            <span className="absolute right-3.5 top-3 text-[9px] font-mono font-bold text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded select-none">
                              IN USE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Suggestions list chips */}
                      {suggestions.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-purple-400 tracking-wide block mb-1.5 font-bold">
                            Quick selection of available queue numbers:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setQueuingNumberInput(num)}
                                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                  queuingNumberInput === num
                                    ? 'bg-purple-800 text-white border-purple-800'
                                    : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-150/80 shadow-2xs'
                                }`}
                              >
                                #{num}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Submission Buttons Row */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setMode('view')}
                          className="w-1/3 text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-semibold py-3.5 px-3 rounded-xl text-center cursor-pointer transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || (queuingNumberInput !== '' && occupiedNumbers.includes(Number(queuingNumberInput)))}
                          className="w-2/3 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:opacity-95 text-white text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-md active:scale-98"
                        >
                          {isSubmitting ? (
                            <span>Holding...</span>
                          ) : (
                            <>
                              <span>Confirm Instant Hold</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
