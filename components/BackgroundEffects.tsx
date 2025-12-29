import React from 'react';
import { TimeOfDay } from '../types';
import { getSkyColor } from '../utils/timeUtils';

interface BackgroundEffectsProps {
  localWeather: { condition: string; icon: any };
  remoteWeather: { condition: string; icon: any };
  localTimeOfDay: TimeOfDay;
  remoteTimeOfDay: TimeOfDay;
}

const WeatherLayer: React.FC<{ condition: string; timeOfDay: TimeOfDay; isRight?: boolean }> = ({ 
  condition, 
  timeOfDay,
  isRight 
}) => {
  const isNight = timeOfDay === TimeOfDay.Night || timeOfDay === TimeOfDay.Evening;
  
  const stars = React.useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    size: Math.random() * 1.2 + 0.8
  })), []);

  const raindrops = React.useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${1 + Math.random()}s`,
    opacity: 0.1 + Math.random() * 0.2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ambient Star Layer */}
      {isNight && (
        <div className="absolute inset-0">
          {stars.map((s, i) => (
            <div 
              key={i}
              className="absolute bg-white/40 rounded-full animate-twinkle"
              style={{
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: s.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Cloud Texture */}
      {(condition === 'Cloudy' || condition === 'Rain') && (
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full animate-float" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-white/[0.02] blur-[150px] rounded-full animate-float" style={{ animationDelay: '-10s' }} />
        </div>
      )}

      {/* Rain Effect */}
      {condition === 'Rain' && (
        <div className="absolute inset-0">
          {raindrops.map((r, i) => (
            <div 
              key={i}
              className="absolute top-0 w-[1px] h-[150px] bg-gradient-to-b from-transparent via-white to-transparent animate-rain"
              style={{
                left: r.left,
                animationDelay: r.delay,
                animationDuration: r.duration,
                opacity: r.opacity
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  localWeather,
  remoteWeather,
  localTimeOfDay,
  remoteTimeOfDay
}) => {
  const colorA = getSkyColor(localTimeOfDay);
  const colorB = getSkyColor(remoteTimeOfDay);

  return (
    <div className="absolute inset-0 z-0 bg-slate-950">
      {/* Master Gradient Atmosphere */}
      <div 
        className="absolute inset-0 transition-all duration-[4000ms] ease-in-out opacity-60"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${colorA} 0%, transparent 70%), 
                      radial-gradient(circle at 70% 50%, ${colorB} 0%, transparent 70%)`
        }}
      />
      
      {/* Subtle Grain Overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      {/* Local Weather (Left Side) */}
      <div 
        className="absolute inset-0 z-10"
        style={{ maskImage: 'linear-gradient(to right, black 0%, black 30%, transparent 60%)', WebkitMaskImage: 'linear-gradient(to right, black 0%, black 30%, transparent 60%)' }}
      >
        <WeatherLayer condition={localWeather.condition} timeOfDay={localTimeOfDay} />
      </div>

      {/* Remote Weather (Right Side) */}
      <div 
        className="absolute inset-0 z-10"
        style={{ maskImage: 'linear-gradient(to left, black 0%, black 30%, transparent 60%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, black 30%, transparent 60%)' }}
      >
        <WeatherLayer condition={remoteWeather.condition} timeOfDay={remoteTimeOfDay} isRight />
      </div>

      {/* Bottom Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
    </div>
  );
};