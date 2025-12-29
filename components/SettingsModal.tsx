import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants, useMotionValue } from 'framer-motion';
import { X, MapPin, Globe, Moon, Minus, Plus, Heart, Zap, Sparkles, Coffee, Smile, Palette, Edit2, Search, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { getInitials, searchCities, CityData, generateSleepSlots } from '../utils/timeUtils';

interface SettingsModalProps {
  user: UserProfile;
  onUpdate: (u: UserProfile) => void;
  isLocal: boolean;
  onClose: () => void;
}

const MOODS = [
  { id: 'focused', icon: Zap, label: 'Focused', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400/50' },
  { id: 'longing', icon: Heart, label: 'Missing You', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400/50' },
  { id: 'joyful', icon: Sparkles, label: 'Joyful', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/50' },
  { id: 'resting', icon: Moon, label: 'Resting', color: 'text-indigo-400', bg: 'bg-indigo-400/20', border: 'border-indigo-400/50' },
  { id: 'active', icon: Coffee, label: 'Active', color: 'text-sky-400', bg: 'bg-sky-400/20', border: 'border-sky-400/50' },
];

const COLORS = [
  'bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 
  'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-slate-500'
];

const AVATAR_PRESETS = [
  '🦊', '🐼', '🐯', '🐸', '🐙', '🦄', '👽', '🤖', 
  '👻', '👾', '🐲', '🐳', '🦉', '🦋', '⚡', '🔥', 
  '❄', '⭐', '🌙', '☀️', '☁️', '⚓', '🚀', '💎'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdate,
  isLocal,
  onClose
}) => {
  const [cityQuery, setCityQuery] = useState(user.location);
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sleepStart, setSleepStart] = useState(user.sleepSlots[0] || 23);
  const [sleepEnd, setSleepEnd] = useState(user.sleepSlots[user.sleepSlots.length - 1] || 7);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  
  // Avatar Editing State
  const [avatarTab, setAvatarTab] = useState<'emoji' | 'photo'>('emoji');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Motion values for crop position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
     const slots = generateSleepSlots(sleepStart, sleepEnd);
     onUpdate({ ...user, sleepSlots: slots });
  }, [sleepStart, sleepEnd]);

  // Reset temp state when closing edit mode
  useEffect(() => {
    if (!isEditingAvatar) {
        setTempImage(null);
        setZoom(1);
        x.set(0);
        y.set(0);
        setAvatarTab('emoji');
    }
  }, [isEditingAvatar]);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityQuery(val);
    if(val.length > 1) {
      setSuggestions(searchCities(val));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCity = (city: CityData) => {
    setCityQuery(city.name);
    setShowSuggestions(false);
    onUpdate({ ...user, location: city.name, timezoneOffset: city.offset });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setTempImage(ev.target.result as string);
                  setZoom(1);
                  x.set(0);
                  y.set(0);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const saveCroppedImage = () => {
    if (!tempImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // Create a 200x200 avatar
        canvas.width = 200;
        canvas.height = 200;
        
        if (ctx) {
            // Fill background (optional, in case of transparency)
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate draw parameters
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            const renderScale = canvas.width / 144; // 144 is approximate visual size (w-36)
            
            ctx.translate(x.get() * renderScale, y.get() * renderScale);
            ctx.scale(zoom, zoom);
            
            // Draw image centered
            const aspect = img.width / img.height;
            let drawWidth, drawHeight;
            
            // Fit shortest side to canvas width (cover-like)
            if (aspect > 1) {
                drawHeight = canvas.width;
                drawWidth = drawHeight * aspect;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / aspect;
            }
            
            ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onUpdate({ ...user, avatarImage: dataUrl, avatarEmoji: undefined }); // Clear emoji
            setIsEditingAvatar(false);
        }
    };
    img.src = tempImage;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* Decorative Background Elements */}
      <div className={`absolute -top-[20%] -right-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 pointer-events-none ${isLocal ? 'bg-indigo-600' : 'bg-rose-600'}`} />
      <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20`} />
      
      {/* Header */}
      <div className="relative z-10 px-6 pt-8 pb-4 flex justify-between items-center border-b border-white/5">
        <div className="flex flex-col">
          <h2 className="font-serif text-2xl text-white tracking-[0.2em]">{user.name.toUpperCase()}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-indigo-400' : 'bg-rose-400'} animate-pulse`}></span>
            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Sync Console</span>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/10 group">
          <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <motion.div 
        className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* SECTION 1: IDENTITY */}
        <motion.section variants={itemVariants} className="mt-8 mb-10 flex flex-col items-center relative">
          <div className="relative group">
             {/* Avatar Circle */}
             <motion.div 
                layout
                className={`w-28 h-28 rounded-full ${user.avatarColor} flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/5 ring-1 ring-white/10 transition-colors duration-500 overflow-hidden`}
             >
                {user.avatarImage ? (
                     <img src={user.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-5xl select-none filter drop-shadow-md">
                        {user.avatarEmoji || getInitials(user.name)}
                    </span>
                )}
             </motion.div>

             {/* Edit Button - Moved outside overflow-hidden div but inside relative group */}
             <button 
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-slate-900 border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 shadow-lg z-20"
                >
                  {isEditingAvatar ? <X size={14} /> : <Edit2 size={14} />}
             </button>

             {/* Background Glow */}
             <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${user.avatarColor}`} />
          </div>

          <AnimatePresence>
            {isEditingAvatar && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="w-full mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md overflow-hidden"
              >
                  <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
                      <button onClick={() => setAvatarTab('emoji')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors ${avatarTab === 'emoji' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}>Emoji</button>
                      <button onClick={() => setAvatarTab('photo')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors ${avatarTab === 'photo' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}>Photo</button>
                  </div>

                  {avatarTab === 'emoji' ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 mb-3 block font-bold">Theme Color</label>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => onUpdate({ ...user, avatarColor: c })}
                                className={`w-8 h-8 rounded-full ${c} transition-transform hover:scale-110 ${user.avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                            />
                            ))}
                        </div>
                        </div>

                        <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/40 mb-3 block font-bold">Choose Avatar</label>
                            <div className="grid grid-cols-6 gap-2 justify-items-center">
                                {AVATAR_PRESETS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => onUpdate({ ...user, avatarEmoji: emoji, avatarImage: undefined })}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-all ${user.avatarEmoji === emoji && !user.avatarImage ? 'bg-white/20 scale-110 shadow-lg ring-1 ring-white/20' : 'bg-white/5 hover:bg-white/10 hover:scale-105'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] uppercase tracking-widest text-white/40 mb-2 block font-bold">Or Type Custom</label>
                            <input 
                                type="text"
                                maxLength={2}
                                value={user.avatarEmoji || ''}
                                onChange={(e) => onUpdate({...user, avatarEmoji: e.target.value, avatarImage: undefined })}
                                placeholder="Type an emoji..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 px-3 text-center text-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300 flex flex-col items-center">
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                        
                        {!tempImage ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group"
                            >
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] uppercase tracking-widest font-bold">Upload Photo</span>
                            </button>
                        ) : (
                            <div className="w-full flex flex-col items-center">
                                {/* Crop Area */}
                                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-white/20 relative cursor-move bg-black mb-4 ring-4 ring-black/20">
                                    <motion.img 
                                        src={tempImage}
                                        drag
                                        style={{ x, y, scale: zoom, originX: 0.5, originY: 0.5 }}
                                        className="w-full h-full object-cover pointer-events-auto"
                                        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                                    />
                                    {/* Grid Overlay */}
                                    <div className="absolute inset-0 pointer-events-none opacity-30">
                                        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white" />
                                        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white" />
                                        <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white" />
                                        <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white" />
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="w-full flex items-center gap-4 mb-4">
                                    <Minus size={14} className="text-white/40" />
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="3" 
                                        step="0.1" 
                                        value={zoom} 
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="flex-1 accent-white h-1 bg-white/20 rounded-full appearance-none"
                                    />
                                    <Plus size={14} className="text-white/40" />
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => { setTempImage(null); setZoom(1); }}
                                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-[9px] uppercase tracking-widest font-bold"
                                    >
                                        Change
                                    </button>
                                    <button 
                                        onClick={saveCroppedImage}
                                        className="flex-[2] py-2 rounded-lg bg-white text-slate-900 hover:bg-gray-200 text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                                    >
                                        <Check size={14} />
                                        Set Avatar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-6 w-full max-w-xs relative">
            <input 
              value={user.name}
              onChange={(e) => onUpdate({...user, name: e.target.value})}
              className="bg-transparent text-3xl font-serif text-center text-white focus:outline-none w-full tracking-wide border-b border-white/10 focus:border-white/40 pb-2 transition-colors placeholder-white/20"
              placeholder="Enter Name"
            />
            <div className="absolute right-0 bottom-3 opacity-30 pointer-events-none">
              <Edit2 size={12} className="text-white" />
            </div>
          </div>
        </motion.section>

        {/* SECTION 2: RESONANCE */}
        <motion.section variants={itemVariants} className="mb-10">
          <div className="flex items-center gap-3 text-white/40 mb-4 px-1">
            <Sparkles size={14} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Current Resonance</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {MOODS.map((m) => {
              const isActive = user.mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onUpdate({ ...user, mood: m.id as any })}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 group
                    ${isActive 
                        ? `bg-white/10 ${m.border} shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105 z-10` 
                        : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5'}`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <m.icon size={20} className={isActive ? m.color : 'text-white/70'} />
                  </div>
                  <span className={`text-[8px] uppercase tracking-tighter font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>
                    {m.label}
                  </span>
                  {isActive && (
                      <motion.div 
                        layoutId="activeGlow"
                        className={`absolute inset-0 rounded-2xl ${m.bg} opacity-20 blur-md -z-10`} 
                      />
                  )}
                </button>
            )})}
          </div>
        </motion.section>

        {/* SECTION 3: COORDINATES */}
        <motion.section variants={itemVariants} className="mb-10">
          <div className="flex items-center gap-3 text-white/40 mb-4 px-1">
            <MapPin size={14} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Current Location</span>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] p-1 border border-white/10 overflow-visible relative z-20">
            <div className="relative flex items-center px-4 py-1">
               <Search size={16} className="text-white/30 mr-3" />
               <input 
                  value={cityQuery}
                  onChange={handleCityChange}
                  onFocus={() => cityQuery.length > 1 && setShowSuggestions(true)}
                  className="bg-transparent text-lg text-white w-full focus:outline-none font-serif tracking-wide py-4 placeholder-white/20"
                  placeholder="Search city coordinates..."
               />
               <div className="flex flex-col items-end pl-4 border-l border-white/5">
                 <span className="text-[9px] font-mono text-white/30 uppercase">Offset</span>
                 <span className="text-sm font-mono text-white/80">UTC{user.timezoneOffset >= 0 ? '+' : ''}{user.timezoneOffset}</span>
               </div>
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-slate-900 border-t border-white/10 w-full max-h-[200px] overflow-y-auto no-scrollbar rounded-b-[20px]"
                >
                  {suggestions.map((city, idx) => (
                    <motion.button 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
                        key={city.name} 
                        onClick={() => selectCity(city)} 
                        className="w-full text-left px-5 py-3 text-white/70 hover:bg-white/10 hover:text-white text-sm flex justify-between items-center group transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="font-serif tracking-wide">{city.name}</span>
                      <span className="text-[10px] font-mono opacity-30 group-hover:opacity-100 bg-white/5 px-1.5 py-0.5 rounded">UTC{city.offset >= 0 ? '+' : ''}{city.offset}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* SECTION 4: CHRONOBIOLOGY */}
        <motion.section variants={itemVariants} className="mb-4">
           <div className="flex items-center gap-3 text-white/40 mb-4 px-1">
            <Moon size={14} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Resting Phase</span>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] p-6 border border-white/10 relative overflow-hidden">
             
             {/* Decorative grid */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
             
             <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex flex-col items-center gap-2">
                   <span className="text-[8px] uppercase tracking-widest text-white/30">Sleep</span>
                   <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 border border-white/10">
                      <button onClick={() => setSleepStart(s => (s - 1 + 24) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"><Minus size={14} /></button>
                      <span className="w-16 text-center font-serif text-lg text-white">{sleepStart}:00</span>
                      <button onClick={() => setSleepStart(s => (s + 1) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"><Plus size={14} /></button>
                   </div>
                </div>
                
                <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex flex-col items-center gap-2">
                   <span className="text-[8px] uppercase tracking-widest text-white/30">Wake</span>
                   <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 border border-white/10">
                      <button onClick={() => setSleepEnd(s => (s - 1 + 24) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"><Minus size={14} /></button>
                      <span className="w-16 text-center font-serif text-lg text-white">{sleepEnd}:00</span>
                      <button onClick={() => setSleepEnd(s => (s + 1) % 24)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"><Plus size={14} /></button>
                   </div>
                </div>
             </div>

             {/* Visualization Bar */}
             <div className="h-3 w-full bg-slate-900/50 rounded-full relative overflow-hidden flex border border-white/5 shadow-inner">
                {Array.from({ length: 24 }).map((_, i) => {
                   const isAsleep = user.sleepSlots.includes(i);
                   return (
                    <motion.div 
                        key={i} 
                        initial={false}
                        animate={{ 
                            backgroundColor: isAsleep 
                                ? (isLocal ? 'rgba(99, 102, 241, 0.6)' : 'rgba(244, 63, 94, 0.6)') 
                                : 'transparent',
                        }}
                        className="flex-1 border-r border-white/5 last:border-0" 
                    />
                   );
                })}
             </div>
             <div className="flex justify-between text-[8px] text-white/20 font-mono mt-2 px-1">
                <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
             </div>
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
};