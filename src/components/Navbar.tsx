import React from 'react';
import { ShoppingBag, Settings, Database, Wifi, WifiOff, Store } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenShop: () => void;
  currentView: 'shop' | 'admin';
  dbStatus: DatabaseStatus;
}

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenShop,
  currentView,
  dbStatus
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg text-white transition-all duration-300 group-hover:scale-105 shadow-sm">
              <Store className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-sans text-base font-bold tracking-tight text-slate-800 block leading-none">
                J&J Sari-Sari Store
              </span>
            </div>
          </button>

          {/* Configuration Modes & DB Pill - Hidden on small mobile screens */}
          <div className="hidden sm:flex items-center gap-4">
            <div 
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-mono transition-all uppercase tracking-wide bg-gradient-to-r from-purple-50/80 to-indigo-50/70 border-purple-200/50 text-purple-700"
              title={
                dbStatus.isCloud 
                  ? "Connected to real-time Cloud Firestore database."
                  : "Running in Sandbox Local Storage mode locally."
              }
              id="db-status-pill"
            >
              {dbStatus.isCloud ? (
                <>
                  <Wifi className="w-3 h-3 animate-pulse text-emerald-500" />
                  <span>Cloud Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-purple-400" />
                  <span>Sandbox Mode</span>
                </>
              )}
            </div>
          </div>

          {/* Interaction Menu buttons (Admin, Cart) */}
          <div className="flex items-center gap-3">
            {/* Admin Panel button - White, bordered, with cog icon in mockup */}
            <button
              onClick={currentView === 'admin' ? onOpenShop : onOpenAdmin}
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
              id="nav-admin-btn"
              title="Admin Panel"
            >
              <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            <div className="w-[1px] h-5 bg-stone-200 mx-1"></div>

            {/* Shopping Bag Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/50 transition-all cursor-pointer focus:outline-none"
              aria-label="Open Cart"
              id="nav-cart-btn"
            >
              <ShoppingBag className="w-5 h-5 text-stone-700 stroke-[1.8px]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-purple-600 text-white text-[9px] font-mono rounded-full font-bold animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only Notice Banner */}
      <div className="sm:hidden flex items-center justify-center py-1 bg-purple-50 text-purple-750 text-[10px] font-mono border-t border-purple-100">
        <Database className="w-2.5 h-2.5 mr-1 text-purple-500" />
        {dbStatus.isCloud ? (
          <span className="text-emerald-700 font-bold">Cloud Sync Node Online</span>
        ) : (
          <span>Local Device Sandbox (Offline Host)</span>
        )}
      </div>
    </header>
  );
}
