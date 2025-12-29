
import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionMenuProps {
  onCreateEvent: (type: 'call' | 'date' | 'sleep') => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onCreateEvent }) => {
  // We default to 'call' as the entry point, but the user can change this immediately inside the editor.
  const handlePress = () => {
    onCreateEvent('call');
  };

  return (
    <div className="absolute bottom-8 right-6 flex flex-col items-end pointer-events-auto z-30">
        <motion.button
          onClick={handlePress}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] border transition-all duration-300 group relative bg-white/10 backdrop-blur-xl text-white border-white/20 hover:bg-white/20 hover:border-white/40"
        >
          {/* Subtle Glow Ring */}
          <span className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20 pointer-events-none" />
          
          <Plus size={32} strokeWidth={1.5} />
        </motion.button>
    </div>
  );
};
