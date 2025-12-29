import React, { useRef, useState } from 'react';
import { UserProfile, CalendarEvent } from '../types';
import { formatTime, isUserBusy, isUserSleeping, checkGoldenWindow, MINUTES_IN_DAY } from '../utils/timeUtils';
import { Sun, Moon, Briefcase, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelixViewProps {
  localUser: UserProfile;
  remoteUser: UserProfile;
  currentTimeUTC: number;
  dayOffset: number;
  events: CalendarEvent[];
  onTimeChange: (newTimeUTC: number) => void;
  onDragEnd: () => void;
}

const STEP_HEIGHT = 160; 
const SNAP_INTERVAL = 15;

const AnimatedDigit: React.FC<{ char: string }> = ({ char }) => {
  if (char === ':') return <span className="text-white/20 px-0.5 relative -top-0.5 font-light">:</span>;
  return (
    <div className="relative w-[0.62em] h-[1.1em] overflow-visible flex justify-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: '15%', opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-15%', opacity: 0, filter: 'blur(8px)' }}
          transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          className="absolute inset-0 flex items-center justify-center text-white"
        >{char}</motion.span>
      </AnimatePresence>
    </div>
  );
};

export const HelixView: React.FC<HelixViewProps> = ({
  localUser,
  remoteUser,
  currentTimeUTC,
  dayOffset,
  events,
  onTimeChange,
  onDragEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartTime(currentTimeUTC);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const minutesDelta = -(deltaY / STEP_HEIGHT) * 60; 
    let newTime = startTime + minutesDelta;
    if (newTime < 0) newTime += MINUTES_IN_DAY;
    if (newTime >= MINUTES_IN_DAY) newTime -= MINUTES_IN_DAY;
    onTimeChange(newTime);
  };

  const handlePointerUp = () => {
    if (isDragging) {
        setIsDragging(false);
        let snapped = Math.round(currentTimeUTC / SNAP_INTERVAL) * SNAP_INTERVAL;
        if (snapped >= MINUTES_IN_DAY) snapped -= MINUTES_IN_DAY;
        onTimeChange(snapped);
        onDragEnd();
    }
  };

  const renderStatusIcon = (user: UserProfile, minutes: number) => {
    if (isUserSleeping(user, minutes)) return <Moon size={12} className="text-indigo-400/60" />;
    if (isUserBusy(user, minutes)) return <Briefcase size={12} className="text-slate-500/60" />;
    return <Sun size={12} className="text-amber-200/60" />;
  };

  const renderBackgroundItem = (offsetHour: number, user: UserProfile, isLocal: boolean) => {
    const minuteProgress = (currentTimeUTC % 60) / 60; 
    const preciseOffset = offsetHour - minuteProgress;
    const dist = Math.abs(preciseOffset);
    
    let opacity = Math.min(0.12, Math.max(0, (0.8 - dist) * 0.2));
    if (opacity <= 0.01) return null;

    const baseHourMinutes = Math.floor(currentTimeUTC / 60) * 60; 
    const rowTimeMinutes = baseHourMinutes + (offsetHour * 60);
    
    const isGolden = checkGoldenWindow(localUser, remoteUser, rowTimeMinutes);
    
    let localMinutes = rowTimeMinutes + (user.timezoneOffset * 60);
    localMinutes = ((localMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    
    const h = Math.floor(localMinutes / 60);
    const hourStr = h.toString().padStart(2, '0');
    const translateY = preciseOffset * STEP_HEIGHT;

    return (
        <div 
            key={`${user.id}-${offsetHour}`}
            className="absolute flex items-center justify-center pointer-events-none will-change-transform"
            style={{
                top: '50%',
                marginTop: -30, 
                transition: isDragging ? 'none' : 'transform 1.2s linear, opacity 0.6s',
                transform: `translateY(${translateY}px) scale(${1 - dist * 0.1})`,
                opacity: opacity,
                [isLocal ? 'right' : 'left']: '51%', 
                width: '48%',
                justifyContent: isLocal ? 'flex-end' : 'flex-start',
            }}
        >
            <div className="flex flex-col items-center">
                <span className={`text-5xl md:text-7xl font-serif text-white font-thin tracking-tighter opacity-30 transition-all ${isGolden && 'opacity-100 text-amber-200'}`}>
                    {hourStr}
                </span>
                {isGolden && <Sparkles size={10} className="text-amber-400/40 mt-1" />}
            </div>
        </div>
    );
  };

  const renderCenterDisplay = (user: UserProfile, isLocal: boolean) => {
      let localMinutes = currentTimeUTC + (user.timezoneOffset * 60);
      localMinutes = ((localMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
      const timeStr = formatTime(localMinutes);
      const timeChars = timeStr.split('');
      return (
          <div key={user.id} className="absolute flex flex-col justify-center pointer-events-none z-30" style={{ top: '50%', transform: 'translateY(-50%)', [isLocal ? 'right' : 'left']: '51%', width: '48%', alignItems: isLocal ? 'flex-end' : 'flex-start' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className={`flex items-center gap-2 mb-1 ${!isLocal && 'flex-row-reverse'}`}>
                  {dayOffset !== 0 && <span className="text-[8px] font-bold text-amber-500/80 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">{dayOffset > 0 ? `+${dayOffset}d` : `${dayOffset}d`}</span>}
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">{renderStatusIcon(user, localMinutes)}</div>
              </motion.div>
              <div className="flex items-center text-6xl md:text-8xl lg:text-9xl font-serif tracking-tighter tabular-nums leading-none pb-2 mix-blend-screen">
                  {timeChars.map((char, index) => (<AnimatedDigit key={`${user.id}-${index}`} char={char} />))}
              </div>
          </div>
      );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' }}>
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2 z-0" />
      {renderCenterDisplay(localUser, true)}
      {renderCenterDisplay(remoteUser, false)}
      <div className="relative z-10 w-full h-full">
          {[-3, -2, -1, 0, 1, 2, 3].map(offset => (
            <React.Fragment key={offset}>
              {renderBackgroundItem(offset, localUser, true)}
              {renderBackgroundItem(offset, remoteUser, false)}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};