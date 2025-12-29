import React, { useState, useEffect } from 'react';
import { UserProfile, CalendarEvent } from './types';
import { HelixView } from './components/HelixView';
import { TimeWheel } from './components/TimeWheel';
import { ActionMenu } from './components/ActionMenu';
import { SettingsModal } from './components/SettingsModal';
import { SharedTimeline } from './components/SharedTimeline';
import { EventEditor } from './components/EventEditor';
import { BackgroundEffects } from './components/BackgroundEffects';
import { getTimeOfDay, getRelativeTimeDiff, isUserBusy, isUserSleeping, getWeather } from './utils/timeUtils';
import { Settings, Calendar, X, MapPin } from 'lucide-react';

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

type ModalType = 'none' | 'calendar' | 'timejump' | 'settings-local' | 'settings-remote';

export default function App() {
  const [localUser, setLocalUser] = useState<UserProfile>(INITIAL_USER_A);
  const [remoteUser, setRemoteUser] = useState<UserProfile>(INITIAL_USER_B);
  
  const [currentTimeUTC, setCurrentTimeUTC] = useState<number>(0);
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [realTimeUTC, setRealTimeUTC] = useState<number>(0);
  const [isLive, setIsLive] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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

  const handleDragEnd = () => setIsLive(false);

  const handleCreateEventClick = (type: 'call' | 'date' | 'sleep') => {
    const newEvent: CalendarEvent = {
      id: `draft-${Date.now()}`,
      type,
      utcMinutes: currentTimeUTC,
      duration: 60,
      title: type === 'call' ? 'Call' : type === 'date' ? 'Date Night' : 'Sleep Sync',
      isConfirmed: true,
      dayOffset: dayOffset
    };
    setEditingEvent(newEvent);
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

  const handleResetToNow = () => {
    const now = new Date();
    const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    setDayOffset(0);
    setCurrentTimeUTC(utcMin);
    setIsLive(true);
    setActiveModal('none');
  };

  const renderUserHUD = (user: UserProfile, isRight: boolean, weather: any) => {
     let status = "AVAILABLE";
     if (isUserSleeping(user, currentTimeUTC)) status = "RESTING";
     else if (isUserBusy(user, currentTimeUTC)) status = "OCCUPIED";

     return (
       <div 
         onClick={() => setActiveModal(isRight ? 'settings-remote' : 'settings-local')}
         className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'} 
          cursor-pointer group pointer-events-auto transition-all hover:opacity-80 duration-500`}
       >
          <div className="flex items-center gap-4">
             {!isRight && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl`}>
                   <span className="text-xl">{user.avatarEmoji || user.name[0]}</span>
                </div>
             )}
             <div>
                <h2 className="text-2xl font-serif font-light text-white tracking-widest leading-none mb-1">{user.name}</h2>
                <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.2em] font-medium">
                   <MapPin size={8} />
                   <span>{user.location.split(',')[0]}</span>
                </div>
             </div>
             {isRight && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl`}>
                   <span className="text-xl">{user.avatarEmoji || user.name[0]}</span>
                </div>
             )}
          </div>

          <div className="flex items-center gap-3 mt-3 px-1 opacity-60">
             <div className="flex items-center gap-1.5 text-white/80">
                <weather.icon size={11} />
                <span className="text-[10px] font-mono">{weather.temp}°</span>
             </div>
             <span className="w-1 h-[1px] bg-white/20"></span>
             <span className={`text-[9px] font-bold tracking-[0.2em] ${status === 'RESTING' ? 'text-indigo-400' : status === 'OCCUPIED' ? 'text-slate-400' : 'text-emerald-400'}`}>
                {status}
             </span>
          </div>
       </div>
     );
  };

  const isTimeSynced = Math.abs(currentTimeUTC - realTimeUTC) < 1 && dayOffset === 0;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      
      <BackgroundEffects 
         localWeather={localWeather}
         remoteWeather={remoteWeather}
         localTimeOfDay={localTimeOfDay}
         remoteTimeOfDay={remoteTimeOfDay}
      />

      {/* Kairosync Branding Layer */}
      <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-1000 ${activeModal !== 'none' ? 'opacity-0 scale-90' : 'opacity-100'}`}>
         <h1 className="text-sm font-serif tracking-[0.8em] text-white/30 uppercase text-center">Kairosync</h1>
         <p className="text-[8px] tracking-[0.4em] text-white/10 uppercase text-center mt-2">Sync Your Time. Feel Closer.</p>
      </div>

      <div className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ${activeModal !== 'none' || editingEvent ? 'opacity-0 blur-md' : 'opacity-100'}`}>
         
         <div className="absolute top-10 left-10">{renderUserHUD(localUser, false, localWeather)}</div>
         <div className="absolute top-10 right-10">{renderUserHUD(remoteUser, true, remoteWeather)}</div>

         <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-20 text-white text-[9px] font-bold tracking-[0.3em] mt-12">
            {getRelativeTimeDiff(localUser.timezoneOffset, remoteUser.timezoneOffset)}
         </div>

         {/* Calendar Trigger */}
         <div className="absolute bottom-12 left-12 pointer-events-auto">
             <button 
                onClick={() => setActiveModal('calendar')}
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all shadow-2xl"
             >
                <Calendar size={18} strokeWidth={1.5} />
             </button>
         </div>

         {/* Controls */}
         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-6">
             <div className={`transition-all duration-500 ${!isTimeSynced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button 
                  onClick={handleResetToNow}
                  className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-[8px] uppercase tracking-[0.4em] hover:bg-white/20 transition-all shadow-xl"
                >
                   Return to Sync
                </button>
             </div>
             
             <button 
               onClick={() => { setActiveModal('timejump'); setIsLive(false); }}
               className="h-10 px-8 rounded-full bg-black/40 backdrop-blur-2xl border border-white/5 hover:bg-white/5 transition-all shadow-2xl flex items-center gap-4"
             >
                <Settings size={12} className="text-white/30" />
                <span className="text-[9px] font-bold tracking-[0.3em] text-white/50">Travel Time</span>
             </button>
         </div>
      </div>

      <main className={`w-full h-full relative z-0 transition-all duration-1000 ease-in-out ${activeModal !== 'none' || editingEvent ? 'scale-[0.98] opacity-10 blur-xl' : 'scale-100 opacity-100'}`}>
        <HelixView 
          localUser={localUser}
          remoteUser={remoteUser}
          currentTimeUTC={currentTimeUTC}
          dayOffset={dayOffset}
          events={events}
          onTimeChange={(val) => { setCurrentTimeUTC(val); setIsLive(false); }}
          onDragEnd={handleDragEnd}
        />
      </main>

      {activeModal === 'none' && !editingEvent && (
        <ActionMenu onCreateEvent={handleCreateEventClick} />
      )}

      {editingEvent && (
        <EventEditor 
          initialEvent={editingEvent}
          localUser={localUser}
          remoteUser={remoteUser}
          onSave={handleSaveEvent}
          onDelete={(id) => setEvents(prev => prev.filter(e => e.id !== id))}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {activeModal !== 'none' && !editingEvent && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-full h-full sm:max-w-md sm:h-[90%] sm:rounded-[40px] bg-transparent p-1 flex flex-col relative overflow-hidden">
             
             {activeModal === 'timejump' ? (
                <>
                  <div className="absolute top-8 right-8 z-50">
                    <button onClick={() => setActiveModal('none')} className="p-3 bg-white/5 rounded-full text-white/50 hover:text-white transition backdrop-blur-md border border-white/10">
                      <X size={20} />
                    </button>
                  </div>
                  <TimeWheel 
                    localUser={localUser}
                    remoteUser={remoteUser}
                    currentTimeUTC={currentTimeUTC}
                    dayOffset={dayOffset}
                    onTimeChange={setCurrentTimeUTC}
                    onDayChange={setDayOffset}
                    onClose={() => setActiveModal('none')}
                  />
                </>
             ) : (
                <div className="w-full h-full p-6">
                    {activeModal === 'calendar' && (
                      <SharedTimeline 
                        events={events}
                        localUser={localUser}
                        remoteUser={remoteUser}
                        onEditEvent={(e) => { setEditingEvent(e); setActiveModal('none'); }}
                        onClose={() => setActiveModal('none')}
                      />
                    )}
                    
                    {(activeModal === 'settings-local' || activeModal === 'settings-remote') && (
                      <SettingsModal 
                        user={activeModal === 'settings-local' ? localUser : remoteUser}
                        onUpdate={activeModal === 'settings-local' ? setLocalUser : setRemoteUser}
                        isLocal={activeModal === 'settings-local'}
                        onClose={() => setActiveModal('none')}
                      />
                    )}
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}