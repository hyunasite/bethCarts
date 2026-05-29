import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingBag, Clock } from 'lucide-react';

export default function AnnouncementBanner() {
  const messages = [
    { 
      text: "Welcome to J&J Sari-Sari Store", 
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0 text-amber-250" /> 
    },
    { 
      text: "Reserve Item you want", 
      icon: <ShoppingBag className="w-3.5 h-3.5 text-purple-300 shrink-0" /> 
    },
    { 
      text: "Add to cart", 
      icon: <ShoppingBag className="w-3.5 h-3.5 text-indigo-300 shrink-0" /> 
    }
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div 
      className="bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-950 text-white font-sans text-xs font-semibold py-2.5 px-4 text-center overflow-hidden relative min-h-[38px] flex items-center justify-center border-b border-indigo-950/45 shadow-sm" 
      id="local-mode-alert"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="flex items-center justify-center gap-2 w-full select-none"
        >
          {messages[index].icon}
          <span className="tracking-wide">{messages[index].text}</span>
          {messages[index].icon}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
