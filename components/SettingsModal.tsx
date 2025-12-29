import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Globe, Moon, Minus, Plus, ChevronDown, Check, Smile } from 'lucide-react';
import { UserProfile } from '../types';
import { getInitials, searchCities, CityData, generateSleepSlots } from '../utils/timeUtils';

interface SettingsModalProps {
  user: UserProfile;
  onUpdate: (u: UserProfile) => void;
  isLocal: boolean;
  onClose: () => void;
}

const CURATED_EMOJIS = [
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '😎', '🤓', '🥰', '🤠', '🥳', '😴', '🤔',
  '👻', '👽', '🤖', '👾', '🎃',
  '🚀', '🌙', '⭐', '🪐',
  '🍕', '☕', '🎮', '🏀', '⚽', '🎨', '🎧'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdate,
  isLocal,
  onClose
}) => {
  const themeColor = isLocal ? 'indigo' : 'rose';
  
  // City Search State
  const [cityQuery, setCityQuery] = useState(user.location);
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Avatar State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sleep State
  const [sleepStart, setSleepStart] = useState(23);
  const [sleepEnd, setSleepEnd] = useState(7);

  useEffect(() => {
     const slots = generateSleepSlots(sleepStart, sleepEnd);
     const currentStr = user.sleepSlots.sort().join(',');
     const newStr = slots.sort().join(',');
     if (currentStr !== newStr) {
         onUpdate({ ...user, sleepSlots: slots });
     }
  }, [sleepStart, sleepEnd]);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityQuery(val);
    setSuggestions(searchCities(val));
    setShowSuggestions(true);
  };

  const selectCity = (city: CityData) => {
    setCityQuery(city.name);
    setShowSuggestions(false);
    onUpdate({
        ...user,
        location: city.name,
        timezoneOffset: city.offset
    });
  };

  const adjustTime = (prev: number, delta: number) => {
      let next = prev + delta;
      if (next >= 24) next = 0;
      if (next < 0) next = 23;
      return next;
  };

  const handleSelectEmoji = (emoji: string) => {
      onUpdate({ ...user, avatarEmoji: emoji });
      setShowEmojiPicker(false);
  };

  const handleClearEmoji = () => {
      onUpdate({ ...user, avatarEmoji: undefined });
      setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Bar */}
      <div className="absolute top-0 right-0 z-50">
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition backdrop-blur-md">
            <X size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-8 px-4 flex flex-col items-center">
        
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white tracking-widest">ORBIT CONSOLE</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-2">
            Target: {user.name}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col gap-8 shadow-2xl ${isLocal ? 'shadow-indigo-500/20' : 'shadow-rose-500/20'}`}
        >
          {/* Avatar & Name Section */}
          <div className="flex flex-col items-center gap-4 relative">
            <motion.button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              whileTap={{ scale: 0.95 }}
              className={`w-28 h-28 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-serif text-5xl font-bold shadow-lg ring-4 ring-white/5 relative overflow-hidden group`}
            >
              {user.avatarEmoji ? (
                  <span className="drop-shadow-md">{user.avatarEmoji}</span>
              ) : (
                  <span>{getInitials(user.name)}</span>
              )}
              
              {/* Edit Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Smile size={32} className="text-white" />
              </div>
            </motion.button>
            
            {/* Emoji Picker Popover */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="absolute top-32 z-50 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-64"
                    >
                        <div className="grid grid-cols-5 gap-2">
                            {CURATED_EMOJIS.map(emoji => (
                                <button 
                                    key={emoji}
                                    onClick={() => handleSelectEmoji(emoji)}
                                    className="text-2xl hover:scale-125 transition-transform p-1"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleClearEmoji}
                            className="w-full mt-3 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
                        >
                            Use Initials
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <input 
                value={user.name}
                onChange={(e) => onUpdate({...user, name: e.target.value})}
                className="bg-transparent text-3xl font-serif text-center text-white placeholder-white/20 focus:outline-none w-full border-b border-transparent focus:border-white/10 pb-1 transition-colors"
                placeholder="Name"
            />
          </div>

          {/* Smart Location Search */}
          <div className="relative z-20">
             <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 focus-within:bg-white/10 transition-colors">
                <MapPin size={20} className="text-white/40" />
                <div className="flex-1">
                   <label className="text-[9px] uppercase text-white/30 tracking-wider block mb-1">Base Location</label>
                   <input 
                      value={cityQuery}
                      onChange={handleCityChange}
                      onFocus={() => setShowSuggestions(true)}
                      className="bg-transparent text-lg text-white w-full focus:outline-none font-medium placeholder-white/10"
                      placeholder="Search city (e.g. Berkeley)..."
                   />
                </div>
             </div>
             
             {/* Autocomplete Dropdown */}
             <AnimatePresence>
             {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto z-50"
                >
                   {suggestions.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => selectCity(city)}
                        className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/10 text-sm flex justify-between items-center group"
                      >
                         <span>{city.name}</span>
                         <span className="text-xs font-mono text-white/30 group-hover:text-white/60">UTC{city.offset >= 0 ? '+' : ''}{city.offset}</span>
                      </button>
                   ))}
                </motion.div>
             )}
             </AnimatePresence>
          </div>

          {/* Locked Timezone Display */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 opacity-80">
               <div className="flex items-center gap-4">
                  <Globe size={20} className="text-white/40" />
                  <div>
                     <label className="text-[9px] uppercase text-white/30 tracking-wider block">Timezone (Locked)</label>
                     <span className="text-2xl font-mono text-white tracking-tight">
                        UTC{user.timezoneOffset >= 0 ? '+' : ''}{user.timezoneOffset}
                     </span>
                  </div>
               </div>
               <div className="pr-2">
                  <div className="p-2 rounded-full bg-white/5 text-emerald-400">
                     <Check size={16} />
                  </div>
               </div>
          </div>

          {/* Visual Sleep Arc */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
             <div className="flex items-center gap-2 text-white/60 mb-6">
                 <Moon size={16} />
                 <span className="text-xs uppercase tracking-wider font-bold">Sleep Window</span>
             </div>

             {/* Visual Bar */}
             <div className="h-4 bg-slate-800 rounded-full relative overflow-hidden mb-6 flex">
                {Array.from({ length: 24 }).map((_, i) => {
                    const isAsleep = user.sleepSlots.includes(i);
                    return (
                        <div key={i} className={`flex-1 h-full ${isAsleep ? `bg-${themeColor}-500` : 'bg-transparent'}`} />
                    );
                })}
             </div>

             {/* Controls */}
             <div className="flex justify-between items-center">
                {/* Bedtime */}
                <div className="flex flex-col items-center gap-2">
                   <span className="text-[9px] uppercase tracking-widest text-white/40">Bedtime</span>
                   <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                      <button onClick={() => setSleepStart(h => adjustTime(h, -1))} className="p-1 hover:text-white text-white/50"><Minus size={14} /></button>
                      <span className="w-8 text-center font-mono text-white">{sleepStart}:00</span>
                      <button onClick={() => setSleepStart(h => adjustTime(h, 1))} className="p-1 hover:text-white text-white/50"><Plus size={14} /></button>
                   </div>
                </div>

                <div className="w-8 h-[1px] bg-white/10" />

                {/* Wake Up */}
                <div className="flex flex-col items-center gap-2">
                   <span className="text-[9px] uppercase tracking-widest text-white/40">Wake Up</span>
                   <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                      <button onClick={() => setSleepEnd(h => adjustTime(h, -1))} className="p-1 hover:text-white text-white/50"><Minus size={14} /></button>
                      <span className="w-8 text-center font-mono text-white">{sleepEnd}:00</span>
                      <button onClick={() => setSleepEnd(h => adjustTime(h, 1))} className="p-1 hover:text-white text-white/50"><Plus size={14} /></button>
                   </div>
                </div>
             </div>

          </div>

        </motion.div>
      </div>
    </div>
  );
};