import React from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Video, Moon, Clock, ChevronRight } from 'lucide-react';
import { UserProfile, CalendarEvent } from '../types';
import { formatTime } from '../utils/timeUtils';

interface SharedTimelineProps {
  events: CalendarEvent[];
  localUser: UserProfile;
  remoteUser: UserProfile;
  onEditEvent: (event: CalendarEvent) => void;
  onClose: () => void;
}

export const SharedTimeline: React.FC<SharedTimelineProps> = ({
  events,
  localUser,
  remoteUser,
  onEditEvent,
  onClose
}) => {
  const sortedEvents = [...events].sort((a, b) => {
    if (a.dayOffset !== b.dayOffset) return a.dayOffset - b.dayOffset;
    return a.utcMinutes - b.utcMinutes;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={14} />;
      case 'date': return <Video size={14} />;
      case 'sleep': return <Moon size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getThemeClass = (type: string) => {
     switch (type) {
        case 'call': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
        case 'date': return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
        case 'sleep': return 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30';
        default: return 'text-white bg-white/10 border-white/20';
     }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-0 right-0 z-50">
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition backdrop-blur-md">
            <X size={20} />
         </button>
      </div>

      <div className="text-center pt-2 mb-6 flex-shrink-0">
        <h2 className="font-serif text-2xl text-white tracking-[0.2em] font-light">TIMELINE</h2>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mt-2">Shared Moments</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative px-1">
        
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-6 mt-12 opacity-50">
             <div className="w-16 h-16 rounded-full border border-white/5 bg-white/5 flex items-center justify-center animate-pulse">
                <Clock size={24} />
             </div>
             <p className="text-xs tracking-widest uppercase text-center px-8 leading-loose">
               No events synced.<br/>
               Tap + to create one.
             </p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {sortedEvents.map((event) => {
              const localTime = formatTime(event.utcMinutes + localUser.timezoneOffset * 60);
              const remoteTime = formatTime(event.utcMinutes + remoteUser.timezoneOffset * 60);
              const theme = getThemeClass(event.type);

              return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEditEvent(event)}
                  className={`relative group cursor-pointer rounded-2xl border p-4 flex items-center justify-between transition-all ${theme} hover:bg-white/5`}
                >
                   {/* Local Side */}
                   <div className="flex flex-col items-start min-w-[60px]">
                      <span className="text-sm font-serif font-medium tracking-wide">{localTime}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-50">{localUser.location.split(',')[0]}</span>
                   </div>

                   {/* Center Info */}
                   <div className="flex flex-col items-center flex-1 px-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${theme.split(' ')[1]}`}>
                         {getEventIcon(event.type)}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{event.title}</span>
                      <span className="text-[9px] opacity-50 mt-0.5">{event.duration} min</span>
                   </div>

                   {/* Remote Side */}
                   <div className="flex flex-col items-end min-w-[60px]">
                      <span className="text-sm font-serif font-medium tracking-wide">{remoteTime}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-50">{remoteUser.location.split(',')[0]}</span>
                   </div>
                   
                   {/* Edit Hint */}
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                      <ChevronRight size={16} className="text-white/50" />
                   </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};