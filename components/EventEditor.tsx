import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Phone, Video, Moon, Clock, Minus, Plus } from 'lucide-react';
import { CalendarEvent, UserProfile } from '../types';
import { formatTime, MINUTES_IN_DAY, getHour, getSkyColor, getTimeOfDay } from '../utils/timeUtils';

interface EventEditorProps {
  initialEvent: CalendarEvent;
  localUser: UserProfile;
  remoteUser: UserProfile;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const EventEditor: React.FC<EventEditorProps> = ({
  initialEvent,
  localUser,
  remoteUser,
  onSave,
  onDelete,
  onClose
}) => {
  const [event, setEvent] = useState<CalendarEvent>(initialEvent);
  const [isDragging, setIsDragging] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Time Scrubbing Logic
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    const newMinutes = Math.floor(percentage * MINUTES_IN_DAY);
    setEvent(prev => ({ ...prev, utcMinutes: newMinutes }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={20} />;
      case 'date': return <Video size={20} />;
      case 'sleep': return <Moon size={20} />;
      default: return <Clock size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'call': return 'Voice Call';
      case 'date': return 'Video Date';
      case 'sleep': return 'Sleep Sync';
      default: return 'Event';
    }
  };

  // Calculated Times
  const localMinutes = (event.utcMinutes + localUser.timezoneOffset * 60 + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const remoteMinutes = (event.utcMinutes + remoteUser.timezoneOffset * 60 + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  
  const localColor = getSkyColor(getTimeOfDay(localMinutes));
  const remoteColor = getSkyColor(getTimeOfDay(remoteMinutes));

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/5">
          <h3 className="text-white font-serif tracking-widest text-lg">
            {initialEvent.id.includes('draft') ? 'NEW EVENT' : 'EDIT EVENT'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          
          {/* Type Selector */}
          <div className="flex justify-center gap-4">
            {['call', 'date', 'sleep'].map((t) => (
              <button
                key={t}
                onClick={() => setEvent(prev => ({ ...prev, type: t as any, title: t === 'call' ? 'Call' : t === 'date' ? 'Date Night' : 'Sleep Sync' }))}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 w-24
                  ${event.type === t 
                    ? 'bg-white/10 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'bg-transparent border-white/5 text-white/30 hover:bg-white/5'}`}
              >
                {getTypeIcon(t)}
                <span className="text-[9px] uppercase tracking-widest font-bold">{t}</span>
              </button>
            ))}
          </div>

          {/* Time Scrubber */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-white/40 tracking-widest mb-1">{localUser.name}</span>
                  <span className="text-3xl font-light font-serif text-white tabular-nums" style={{ textShadow: `0 0 20px ${localColor}` }}>
                    {formatTime(localMinutes)}
                  </span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-white/40 tracking-widest mb-1">{remoteUser.name}</span>
                  <span className="text-3xl font-light font-serif text-white tabular-nums" style={{ textShadow: `0 0 20px ${remoteColor}` }}>
                    {formatTime(remoteMinutes)}
                  </span>
               </div>
            </div>

            <div 
              ref={scrubberRef}
              className="h-12 bg-white/5 rounded-xl border border-white/10 relative cursor-ew-resize touch-none overflow-hidden group"
              onPointerDown={(e) => { setIsDragging(true); handlePointerMove(e); e.currentTarget.setPointerCapture(e.pointerId); }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setIsDragging(false)}
            >
               {/* Background Gradients to represent day/night roughly */}
               <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-900 via-sky-500 to-indigo-900" />
               
               {/* Scrubber Handle */}
               <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_white] z-10"
                  style={{ left: `${(event.utcMinutes / MINUTES_IN_DAY) * 100}%` }}
               >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-full shadow-lg" />
               </div>

               {/* Ticks */}
               {Array.from({ length: 25 }).map((_, i) => (
                 <div key={i} className="absolute bottom-0 h-2 w-[1px] bg-white/20" style={{ left: `${(i / 24) * 100}%` }} />
               ))}
            </div>
            <div className="text-center text-[10px] text-white/30 uppercase tracking-widest">
               Drag to adjust time
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
             <input 
                value={event.title}
                onChange={(e) => setEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-center font-serif tracking-wide"
                placeholder="Event Title"
             />
             
             <div className="flex items-center justify-center gap-6 p-2">
                <button 
                  onClick={() => setEvent(prev => ({ ...prev, duration: Math.max(15, prev.duration - 15) }))}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
                >
                   <Minus size={16} />
                </button>
                <div className="flex flex-col items-center w-24">
                   <span className="text-xl font-mono text-white tabular-nums">{event.duration}</span>
                   <span className="text-[9px] text-white/30 uppercase tracking-widest">Minutes</span>
                </div>
                <button 
                  onClick={() => setEvent(prev => ({ ...prev, duration: prev.duration + 15 }))}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
                >
                   <Plus size={16} />
                </button>
             </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
             {onDelete && !event.id.includes('draft') && (
               <button 
                  onClick={() => onDelete(event.id)}
                  className="flex-1 py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition uppercase tracking-widest text-xs font-bold"
               >
                 Delete
               </button>
             )}
             <button 
                onClick={() => onSave(event)}
                className="flex-[2] py-4 rounded-xl bg-white text-slate-900 hover:bg-gray-200 transition uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-white/10"
             >
                <Check size={16} />
                Save Event
             </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};