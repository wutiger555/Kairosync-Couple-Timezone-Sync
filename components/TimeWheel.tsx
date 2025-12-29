
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sun, Moon, Sunrise, Sunset, ChevronRight, ChevronLeft, Edit3 } from 'lucide-react';
import { MINUTES_IN_DAY, formatTime, getHour } from '../utils/timeUtils';
import { UserProfile } from '../types';

interface TimeWheelProps {
  localUser: UserProfile;
  remoteUser: UserProfile;
  currentTimeUTC: number;
  dayOffset: number;
  onTimeChange: (newTimeUTC: number) => void;
  onDayChange: (newDayOffset: number) => void;
  onClose: () => void;
}

export const TimeWheel: React.FC<TimeWheelProps> = ({
  localUser,
  remoteUser,
  currentTimeUTC,
  dayOffset,
  onTimeChange,
  onDayChange,
  onClose
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string>(localUser.id);
  const prevActiveUserId = useRef<string>(localUser.id);
  
  // Direct Time Input State
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Helpers to identify active vs passive user context
  const activeUser = activeUserId === localUser.id ? localUser : remoteUser;
  const passiveUser = activeUserId === localUser.id ? remoteUser : localUser;

  // Colors
  const activeColorText = activeUserId === localUser.id ? 'text-indigo-400' : 'text-rose-400';
  const activeGlow = activeUserId === localUser.id ? 'shadow-indigo-500/20' : 'shadow-rose-500/20';

  // Helper: Get rotation (0-360) from UTC time
  const getRotationFromUTC = (utc: number, offset: number) => {
    let localMinutes = (utc + (offset * 60)) % MINUTES_IN_DAY;
    if (localMinutes < 0) localMinutes += MINUTES_IN_DAY;
    return (localMinutes / MINUTES_IN_DAY) * 360;
  };

  const rotation = useMotionValue(getRotationFromUTC(currentTimeUTC, activeUser.timezoneOffset));

  // Sync rotation when time changes externally, BUT NOT WHEN DRAGGING
  useEffect(() => {
    if (isDragging) return;

    const targetRotation = getRotationFromUTC(currentTimeUTC, activeUser.timezoneOffset);
    const currentRot = rotation.get();
    const hasSwitchedUser = prevActiveUserId.current !== activeUserId;
    
    // Handle 360/0 wrap-around for smooth animation
    let adjustedTarget = targetRotation;
    if (Math.abs(currentRot - targetRotation) > 180) {
        if (currentRot > targetRotation) adjustedTarget += 360;
        else adjustedTarget -= 360;
    }

    if (hasSwitchedUser) {
        animate(rotation, targetRotation, { type: 'spring', stiffness: 150, damping: 18 });
    } else {
        rotation.set(targetRotation);
    }

    prevActiveUserId.current = activeUserId;
  }, [currentTimeUTC, activeUserId, activeUser.timezoneOffset, isDragging, rotation]);

  // Derived Values for Active Display
  const timeString = useTransform(rotation, (r) => {
    let normalized = r % 360;
    if (normalized < 0) normalized += 360;
    const minutes = Math.floor((normalized / 360) * MINUTES_IN_DAY);
    return formatTime(minutes);
  });

  // Derived Values for Passive Display (Immediate Update)
  const passiveTimeString = useTransform(rotation, (r) => {
    let normalized = r % 360;
    if (normalized < 0) normalized += 360;
    const activeLocalMinutes = Math.floor((normalized / 360) * MINUTES_IN_DAY);
    let utc = activeLocalMinutes - (activeUser.timezoneOffset * 60);
    let passiveLocal = utc + (passiveUser.timezoneOffset * 60);
    passiveLocal = ((passiveLocal % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    return formatTime(passiveLocal);
  });
  
  const getPassiveDayDiff = () => {
    const activeLocalH = getHour(currentTimeUTC + activeUser.timezoneOffset * 60);
    const diff = passiveUser.timezoneOffset - activeUser.timezoneOffset;
    if (activeLocalH + diff >= 24) return '(+1 Day)';
    if (activeLocalH + diff < 0) return '(-1 Day)';
    return '';
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMove(e); // Allow instant jump on click
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let angleDeg = angleRad * (180 / Math.PI);
    angleDeg += 90; 
    if (angleDeg < 0) angleDeg += 360;

    rotation.set(angleDeg);

    const activeLocalMinutes = (angleDeg / 360) * MINUTES_IN_DAY;
    let newUtc = activeLocalMinutes - (activeUser.timezoneOffset * 60);
    while (newUtc < 0) newUtc += MINUTES_IN_DAY;
    while (newUtc >= MINUTES_IN_DAY) newUtc -= MINUTES_IN_DAY;

    onTimeChange(newUtc);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleTimeClick = () => {
    const currentActiveLocalMinutes = (currentTimeUTC + activeUser.timezoneOffset * 60 + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    setInputValue(formatTime(currentActiveLocalMinutes));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submitTime = () => {
    const [hStr, mStr] = inputValue.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
       const newActiveMinutes = h * 60 + m;
       let newUtc = newActiveMinutes - activeUser.timezoneOffset * 60;
       newUtc = ((newUtc % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
       onTimeChange(newUtc);
       rotation.set((newActiveMinutes / MINUTES_IN_DAY) * 360);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') submitTime();
      if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      
      {/* 1. Perspective Toggle (Floating Top) */}
      <div className="absolute top-8 z-30 flex gap-4">
        <button 
            onClick={() => setActiveUserId(localUser.id)}
            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all backdrop-blur-md border
              ${activeUserId === localUser.id ? 'bg-indigo-500/80 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
            {localUser.name}
        </button>
        <button 
             onClick={() => setActiveUserId(remoteUser.id)}
             className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all backdrop-blur-md border
              ${activeUserId === remoteUser.id ? 'bg-rose-500/80 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
            {remoteUser.name}
        </button>
      </div>

      {/* 2. Main Wheel Container */}
      <div className="relative w-[320px] h-[320px] flex items-center justify-center mt-8">
        
        {/* Decorative Background Rings */}
        <div className="absolute inset-[-40px] rounded-full border border-white/5 opacity-50" />
        <div className="absolute inset-[-20px] rounded-full border border-white/5 opacity-30 animate-pulse" />
        
        {/* The Wheel Interaction Layer */}
        <div 
            ref={wheelRef}
            className="absolute inset-0 rounded-full cursor-grab active:cursor-grabbing touch-none z-10"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Glass Track */}
            <div className={`absolute inset-0 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-md shadow-2xl ${activeGlow} transition-shadow duration-500`}></div>
            
            {/* Ticks */}
            {Array.from({ length: 12 }).map((_, i) => (
                <div 
                    key={i}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full pointer-events-none"
                    style={{ transform: `rotate(${i * 30}deg)` }}
                >
                    <div className="w-full h-3 bg-white/40 mb-auto" />
                    <div className="w-full h-3 bg-white/40 mt-auto" />
                </div>
            ))}
            
            {/* Icons */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/40 pointer-events-none"><Moon size={12} /></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 pointer-events-none"><Sun size={12} /></div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"><Sunrise size={12} /></div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"><Sunset size={12} /></div>

            {/* Rotating Knob */}
            <motion.div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ rotate: rotation }}
            >
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-1 h-8 bg-white/80 blur-[1px]" />
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-6 h-6 bg-white rounded-full shadow-[0_0_25px_white] flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${activeUserId === localUser.id ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                 </div>
            </motion.div>
        </div>

        {/* 3. Central Time Display (Floating above wheel) */}
        <div className="absolute z-20 pointer-events-none flex flex-col items-center justify-center">
             <div className="pointer-events-auto">
                {isEditing ? (
                     <input 
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={submitTime}
                        onKeyDown={handleKeyDown}
                        className={`text-6xl font-serif font-light text-white text-center bg-transparent border-b border-white/20 focus:border-white focus:outline-none w-48 tracking-widest tabular-nums ${activeColorText}`}
                        autoFocus
                     />
                ) : (
                    <motion.button
                        onClick={handleTimeClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-6xl font-serif font-light tracking-widest tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ${activeColorText}`}
                    >
                        {timeString}
                    </motion.button>
                )}
             </div>
             <div className="mt-1 flex items-center gap-2 opacity-50">
                <Edit3 size={10} className="text-white" />
                <span className="text-[9px] uppercase tracking-widest text-white">Tap to Type</span>
             </div>
        </div>
      </div>

      {/* 4. Passive Time Display */}
      <div className="mt-10 w-64 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-sm">
         <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-2">Corresponding Time</span>
         <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{passiveUser.name}</span>
             <motion.span className="text-2xl font-serif text-white/90 tabular-nums tracking-wide">
                 {passiveTimeString}
             </motion.span>
         </div>
         {getPassiveDayDiff() && (
            <span className="text-[9px] text-amber-400/80 uppercase tracking-widest mt-1 font-bold">
                {getPassiveDayDiff()}
            </span>
         )}
      </div>

      {/* 5. Date Navigation */}
      <div className="flex items-center gap-6 mt-6">
             <button 
                onClick={() => onDayChange(Math.max(0, dayOffset - 1))} 
                disabled={dayOffset === 0}
                className="p-3 text-white/40 hover:text-white disabled:opacity-10 transition hover:bg-white/5 rounded-full"
             >
                <ChevronLeft size={20} />
             </button>
             <div className="flex flex-col items-center w-24">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    {dayOffset === 0 ? 'Today' : `+${dayOffset} Days`}
                </span>
             </div>
             <button 
                onClick={() => onDayChange(Math.min(3, dayOffset + 1))}
                className="p-3 text-white/40 hover:text-white transition hover:bg-white/5 rounded-full"
             >
                <ChevronRight size={20} />
             </button>
      </div>

    </div>
  );
};
