import React, { useState, useEffect } from 'react';
import { UserProfile, CalendarEvent } from './types';
import { HelixView } from './components/HelixView';
import { TimeWheel } from './components/TimeWheel';
import { ActionMenu } from './components/ActionMenu';
import { SettingsModal } from './components/SettingsModal';
import { SharedTimeline } from './components/SharedTimeline';
import { EventEditor } from './components/EventEditor';
import { BackgroundEffects } from './components/BackgroundEffects';
import { getTimeOfDay, getRelativeTimeDiff, isUserBusy, isUserSleeping, getWeather, getCountdown } from './utils/timeUtils';
import { Settings, Calendar, X, MapPin, Sparkles, Clock, Edit2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const INITIAL_USER_A: UserProfile = {
  id: 'u1',
  name: 'Alex',
  location: 'Taipei',
  timezoneOffset: 8,
  avatarColor: 'bg-indigo-500',
  busySlots: [9, 10, 11, 13, 14, 15, 16, 17, 18], 
  sleepSlots: [23, 0, 1, 2, 3, 4, 5, 6, 7],
};

const INITIAL_USER_B: UserProfile = {
  id: 'u2',
  name: 'Jamie',
  location: 'London',
  timezoneOffset: 0, 
  avatarColor: 'bg-rose-500',
  busySlots: [9, 10, 11, 12, 14, 15, 16, 17], 
  sleepSlots: [23, 0, 1, 2, 3, 4, 5, 6],
};

export default function App() {
  const [localUser, setLocalUser] = useState<UserProfile>(INITIAL_USER_A);
  const [remoteUser, setRemoteUser] = useState<UserProfile>(INITIAL_USER_B);
  const [currentTimeUTC, setCurrentTimeUTC] = useState<number>(0);
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [realTimeUTC, setRealTimeUTC] = useState<number>(0);
  const [isLive, setIsLive] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeModal, setActiveModal] = useState<'none' | 'calendar' | 'timejump' | 'settings-local' | 'settings-remote'>('none');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  const [nextMeetingDate, setNextMeetingDate] = useState<string>("2025-05-24");

  const localWeather = getWeather(currentTimeUTC, localUser.timezoneOffset, localUser.location);
  const remoteWeather = getWeather(currentTimeUTC, remoteUser.timezoneOffset, remoteUser.location);
  const localTimeOfDay = getTimeOfDay(currentTimeUTC + localUser.timezoneOffset * 60);
  const remoteTimeOfDay = getTimeOfDay(currentTimeUTC + remoteUser.timezoneOffset * 60);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
      setRealTimeUTC(utcMin);
      if (isLive && !editingEvent && activeModal === 'none') {
          setCurrentTimeUTC(utcMin);
      }
    };
    tick(); 
    const interval = setInterval(tick, 1000); 
    return () => clearInterval(interval);
  }, [isLive, editingEvent, activeModal]);

  const handleCheckIn = (status: string) => {
      setLocalUser(prev => ({ ...prev, currentStatus: status }));
      setTimeout(() => setLocalUser(prev => ({ ...prev, currentStatus: undefined })), 3 * 60 * 60 * 1000);
  };

  const handleSaveEvent = (savedEvent: CalendarEvent) => {
    setEvents(prev => {
       const exists = prev.find(e => e.id === savedEvent.id);
       if (exists) return prev.map(e => e.id === savedEvent.id ? savedEvent : e);
       return [...prev, { ...savedEvent, id: Date.now().toString() }];
    });
    setEditingEvent(null);
    setActiveModal('calendar');
  };

  const renderUserHUD = (user: UserProfile, isRight: boolean, weather: any) => {
     let status = "AVAILABLE";
     if (isUserSleeping(user, currentTimeUTC)) status = "RESTING";
     else if (isUserBusy(user, currentTimeUTC)) status = "OCCUPIED";

     return (
       <div onClick={() => setActiveModal(isRight ? 'settings-remote' : 'settings-local')} className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'} cursor-pointer group pointer-events-auto transition-all hover:opacity-100 duration-500 max-w-[140px]`}>
          <div className={`flex items-center gap-2 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg shrink-0 overflow-hidden relative transition-transform group-hover:scale-110">
                {user.avatarImage ? (
                  <img src={user.avatarImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{user.avatarEmoji || user.name[0]}</span>
                )}
                
                {user.currentStatus && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />}
                
                {/* Edit overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Edit2 size={12} className="text-white/80" />
                </div>
             </div>
             <div className="overflow-hidden">
                <h2 className="text-lg font-serif font-light text-white tracking-widest leading-none mb-0.5 truncate group-hover:text-white/80 transition-colors">{user.name}</h2>
                <div className="flex items-center gap-1 text-white/40 text-[7px] uppercase tracking-[0.2em] font-medium">
                   <MapPin size={6} />
                   <span className="truncate">{user.location.split(',')[0]}</span>
                </div>
             </div>
          </div>
          {user.currentStatus && (
              <div className="mt-1 px-2 py-0.5 bg-white/10 rounded-full border border-white/5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <span className="text-[7px] text-white/80 font-bold uppercase tracking-widest">{user.currentStatus}</span>
              </div>
          )}
          <div className={`flex items-center gap-2 mt-2 px-1 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
             <div className="flex items-center gap-1 text-white/60">
                <weather.icon size={10} />
                <span className="text-[9px] font-mono">{weather.temp}°</span>
             </div>
             <span className={`text-[8px] font-bold tracking-[0.1em] px-1.5 py-0.5 rounded-full bg-white/5 ${status === 'RESTING' ? 'text-indigo-300' : status === 'OCCUPIED' ? 'text-slate-400' : 'text-emerald-300'}`}>
                {status}
             </span>
          </div>
       </div>
     );
  };

  const isTimeSynced = Math.abs(currentTimeUTC - realTimeUTC) < 1 && dayOffset === 0;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <BackgroundEffects localWeather={localWeather} remoteWeather={remoteWeather} localTimeOfDay={localTimeOfDay} remoteTimeOfDay={remoteTimeOfDay} />
      
      <div className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ${activeModal !== 'none' || editingEvent ? 'opacity-0 blur-md' : 'opacity-100'}`}>
         {/* Top HUD Area */}
         <div className="absolute top-12 left-6 right-6 flex justify-between items-start pt-safe">
            {renderUserHUD(localUser, false, localWeather)}
            {renderUserHUD(remoteUser, true, remoteWeather)}
         </div>

         {/* Time Difference Hint */}
         <div className="absolute top-24 left-1/2 -translate-x-1/2 opacity-20 text-white text-[9px] font-bold tracking-[0.3em] mt-2">
            {getRelativeTimeDiff(localUser.timezoneOffset, remoteUser.timezoneOffset)}
         </div>

         {/* Calendar Trigger */}
         <div className="absolute bottom-10 left-8 pointer-events-auto">
             <button onClick={() => setActiveModal('calendar')} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all shadow-2xl backdrop-blur-md">
                <Calendar size={20} strokeWidth={1.5} />
             </button>
         </div>

         {/* Controls */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-4">
             <div className={`transition-all duration-500 ${!isTimeSynced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button onClick={() => { const now = new Date(); setCurrentTimeUTC(now.getUTCHours() * 60 + now.getUTCMinutes()); setDayOffset(0); setIsLive(true); }} className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-[8px] uppercase tracking-[0.4em] hover:bg-white/20 transition-all shadow-xl">
                   Return to Sync
                </button>
             </div>
             <button onClick={() => { setActiveModal('timejump'); setIsLive(false); }} className="h-10 px-8 rounded-full bg-black/40 backdrop-blur-2xl border border-white/5 hover:bg-white/5 transition-all shadow-2xl flex items-center gap-4">
                <Settings size={12} className="text-white/30" />
                <span className="text-[9px] font-bold tracking-[0.3em] text-white/50 uppercase">Travel Time</span>
             </button>
         </div>
      </div>

      <main className={`w-full h-full relative z-0 transition-all duration-1000 ease-in-out ${activeModal !== 'none' || editingEvent ? 'scale-[0.98] opacity-10 blur-xl' : 'scale-100 opacity-100'}`}>
        <HelixView localUser={localUser} remoteUser={remoteUser} currentTimeUTC={currentTimeUTC} dayOffset={dayOffset} events={events} onTimeChange={(val) => { setCurrentTimeUTC(val); setIsLive(false); }} onDragEnd={() => setIsLive(false)} />
      </main>

      {activeModal === 'none' && !editingEvent && <ActionMenu onCheckIn={handleCheckIn} onCreateEvent={(type) => setEditingEvent({ id: `draft-${Date.now()}`, type, utcMinutes: currentTimeUTC, duration: 60, title: type.toUpperCase(), isConfirmed: true, dayOffset })} />}

      {editingEvent && <EventEditor initialEvent={editingEvent} localUser={localUser} remoteUser={remoteUser} onSave={handleSaveEvent} onDelete={(id) => setEvents(prev => prev.filter(e => e.id !== id))} onClose={() => setEditingEvent(null)} />}

      <AnimatePresence>
      {activeModal !== 'none' && !editingEvent && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full h-full sm:max-w-md sm:h-[85vh] sm:rounded-[32px] bg-slate-900/50 border border-white/10 shadow-2xl flex flex-col relative overflow-hidden"
          >
             {activeModal === 'timejump' ? (
                <>
                  <div className="absolute top-6 right-6 z-50"><button onClick={() => setActiveModal('none')} className="p-3 bg-white/5 rounded-full text-white/50 hover:text-white transition backdrop-blur-md border border-white/10"><X size={20} /></button></div>
                  <TimeWheel localUser={localUser} remoteUser={remoteUser} currentTimeUTC={currentTimeUTC} dayOffset={dayOffset} onTimeChange={setCurrentTimeUTC} onDayChange={setDayOffset} onClose={() => setActiveModal('none')} />
                </>
             ) : (
                <>
                    {activeModal === 'calendar' && <SharedTimeline events={events} localUser={localUser} remoteUser={remoteUser} onEditEvent={(e) => { setEditingEvent(e); setActiveModal('none'); }} onClose={() => setActiveModal('none')} />}
                    {(activeModal === 'settings-local' || activeModal === 'settings-remote') && <SettingsModal user={activeModal === 'settings-local' ? localUser : remoteUser} onUpdate={activeModal === 'settings-local' ? setLocalUser : setRemoteUser} isLocal={activeModal === 'settings-local'} onClose={() => setActiveModal('none')} />}
                </>
             )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}