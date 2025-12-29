import React, { useState } from 'react';
import { Plus, Coffee, Home, Bed, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionMenuProps {
  onCreateEvent: (type: 'call' | 'date' | 'sleep') => void;
  onCheckIn: (status: string) => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onCreateEvent, onCheckIn }) => {
  const [isOpen, setIsOpen] = useState(false);

  const checkins = [
    { icon: Home, label: 'Got Home', color: 'indigo' },
    { icon: Coffee, label: 'Coffee Break', color: 'amber' },
    { icon: Bed, label: 'Waking Up', color: 'sky' },
    { icon: Zap, label: 'Busy', color: 'rose' },
  ];

  const handleCheckIn = (label: string) => {
      onCheckIn(label);
      setIsOpen(false);
  };

  return (
    <div className="absolute bottom-10 right-8 flex flex-col items-end pointer-events-auto z-50">
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    className="flex flex-col gap-3 mb-4 items-end"
                >
                    {/* Quick Check-ins */}
                    <div className="flex flex-col gap-2 p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                        <span className="text-[7px] uppercase tracking-[0.2em] text-white/30 px-2 mb-1">Quick Check-in</span>
                        {checkins.map((c, i) => (
                            <motion.button
                                key={c.label}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                                onClick={() => handleCheckIn(c.label)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors group"
                            >
                                <c.icon size={14} className={`text-${c.color}-400 group-hover:scale-110 transition-transform`} />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{c.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Event Types */}
                    <div className="flex gap-2">
                        {['call', 'date'].map((type) => (
                            <button 
                                key={type}
                                onClick={() => { onCreateEvent(type as any); setIsOpen(false); }}
                                className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-full border border-white/5 transition-all text-[9px] font-bold uppercase tracking-widest"
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border transition-all duration-500 relative ${isOpen ? 'bg-white text-slate-900 rotate-45 border-white' : 'bg-white/5 backdrop-blur-xl text-white border-white/10 hover:bg-white/10'}`}
        >
          <Plus size={24} strokeWidth={2} />
        </motion.button>
    </div>
  );
};