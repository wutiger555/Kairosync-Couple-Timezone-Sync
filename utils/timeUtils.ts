import { TimeOfDay, UserProfile } from '../types';
import React from 'react';
import { Cloud, CloudRain, Moon, Sun, CloudLightning } from 'lucide-react';

export const MINUTES_IN_DAY = 1440;

// Format minutes into HH:MM
export const formatTime = (totalMinutes: number): string => {
  let normalized = Math.floor(totalMinutes) % MINUTES_IN_DAY;
  if (normalized < 0) normalized += MINUTES_IN_DAY;
  
  const hours = Math.floor(normalized / 60);
  const minutes = Math.floor(normalized % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getHour = (totalMinutes: number): number => {
  let normalized = Math.floor(totalMinutes) % MINUTES_IN_DAY;
  if (normalized < 0) normalized += MINUTES_IN_DAY;
  return Math.floor(normalized / 60);
};

export const getTimeOfDay = (totalMinutes: number): TimeOfDay => {
  const hour = getHour(totalMinutes);
  if (hour >= 5 && hour < 12) return TimeOfDay.Morning;
  if (hour >= 12 && hour < 17) return TimeOfDay.Day;
  if (hour >= 17 && hour < 21) return TimeOfDay.Evening;
  return TimeOfDay.Night;
};

// Returns a CSS color string based on time
export const getSkyColor = (tod: TimeOfDay): string => {
  switch (tod) {
    case TimeOfDay.Morning: return '#fdba74'; // Orange-300
    case TimeOfDay.Day: return '#38bdf8'; // Sky-400
    case TimeOfDay.Evening: return '#818cf8'; // Indigo-400
    case TimeOfDay.Night: return '#0f172a'; // Slate-900
    default: return '#0f172a';
  }
};

export const isUserBusy = (user: UserProfile, utcMinutes: number): boolean => {
  const localMinutes = utcMinutes + (user.timezoneOffset * 60);
  const localHour = getHour(localMinutes);
  return user.busySlots.includes(localHour);
};

export const isUserSleeping = (user: UserProfile, utcMinutes: number): boolean => {
  const localMinutes = utcMinutes + (user.timezoneOffset * 60);
  const localHour = getHour(localMinutes);
  return user.sleepSlots.includes(localHour);
};

export const checkGoldenWindow = (userA: UserProfile, userB: UserProfile, utcMinutes: number): boolean => {
  const busyA = isUserBusy(userA, utcMinutes);
  const busyB = isUserBusy(userB, utcMinutes);
  const sleepA = isUserSleeping(userA, utcMinutes);
  const sleepB = isUserSleeping(userB, utcMinutes);

  return !busyA && !busyB && !sleepA && !sleepB;
};

export const getRelativeTimeDiff = (offsetA: number, offsetB: number): string => {
  const diff = Math.abs(offsetA - offsetB);
  return `${diff}H DIFF`;
};

// Smart Presets (Local Time) -> UTC Minutes
export const PRESETS = {
  MORNING: 9 * 60, // 09:00
  NOON: 12 * 60,   // 12:00
  EVENING: 19 * 60,// 19:00
  NIGHT: 23 * 60   // 23:00
};

export const getInitials = (name: string) => {
  if (!name) return '??';
  return name.slice(0, 2).toUpperCase();
};

// Mock Weather Logic
export const getWeather = (utcMinutes: number, timezoneOffset: number, location: string) => {
  const hour = getHour(utcMinutes + timezoneOffset * 60);
  const seed = location.length + hour;
  let temp = 15 + (seed % 15);
  if (hour < 6 || hour > 20) temp -= 5;
  
  let icon = Sun;
  let condition = "Clear";
  
  if (hour < 6 || hour > 20) {
      icon = Moon;
      condition = "Clear";
      if (seed % 3 === 0) {
          icon = Cloud;
          condition = "Cloudy";
      }
  } else {
      if (seed % 4 === 0) {
          icon = CloudRain;
          condition = "Rain";
      } else if (seed % 3 === 0) {
          icon = Cloud;
          condition = "Cloudy";
      }
  }

  return { temp, icon, condition };
};

// --- City & Timezone Database ---

export interface CityData {
  name: string;
  offset: number;
}

export const CITIES_DB: CityData[] = [
  // Major Global Cities
  { name: 'London, UK', offset: 0 },
  { name: 'Taipei, Taiwan', offset: 8 },
  { name: 'New York, USA', offset: -5 },
  { name: 'Tokyo, Japan', offset: 9 },
  { name: 'Paris, France', offset: 1 },
  { name: 'Los Angeles, USA', offset: -8 },
  { name: 'Sydney, Australia', offset: 11 },
  { name: 'Dubai, UAE', offset: 4 },
  { name: 'Singapore', offset: 8 },
  { name: 'Berlin, Germany', offset: 1 },
  { name: 'Seoul, Korea', offset: 9 },
  { name: 'Toronto, Canada', offset: -5 },
  { name: 'Mumbai, India', offset: 5.5 },
  { name: 'San Francisco, USA', offset: -8 },
  { name: 'Chicago, USA', offset: -6 },
  { name: 'Hong Kong', offset: 8 },
  { name: 'Barcelona, Spain', offset: 1 },
  { name: 'Amsterdam, Netherlands', offset: 1 },
  { name: 'Bangkok, Thailand', offset: 7 },
  { name: 'Vancouver, Canada', offset: -8 },
  { name: 'Rio de Janeiro, Brazil', offset: -3 },
  { name: 'Moscow, Russia', offset: 3 },
  { name: 'Auckland, NZ', offset: 12 },
  { name: 'Hawaii, USA', offset: -10 },
  
  // US Cities (Detailed)
  { name: 'Berkeley, USA', offset: -8 },
  { name: 'Seattle, USA', offset: -8 },
  { name: 'Austin, USA', offset: -6 },
  { name: 'Boston, USA', offset: -5 },
  { name: 'Denver, USA', offset: -7 },
  { name: 'Miami, USA', offset: -5 },
  { name: 'Portland, USA', offset: -8 },
  { name: 'San Diego, USA', offset: -8 },
  { name: 'Las Vegas, USA', offset: -8 },
  { name: 'Phoenix, USA', offset: -7 },
  { name: 'Atlanta, USA', offset: -5 },

  // European Cities
  { name: 'Rome, Italy', offset: 1 },
  { name: 'Madrid, Spain', offset: 1 },
  { name: 'Munich, Germany', offset: 1 },
  { name: 'Zurich, Switzerland', offset: 1 },
  { name: 'Stockholm, Sweden', offset: 1 },
  { name: 'Oslo, Norway', offset: 1 },
  { name: 'Dublin, Ireland', offset: 0 },
  { name: 'Vienna, Austria', offset: 1 },
  { name: 'Prague, Czechia', offset: 1 },

  // Asian Cities
  { name: 'Shanghai, China', offset: 8 },
  { name: 'Beijing, China', offset: 8 },
  { name: 'Osaka, Japan', offset: 9 },
  { name: 'Kyoto, Japan', offset: 9 },
  { name: 'Kuala Lumpur, Malaysia', offset: 8 },
  { name: 'Jakarta, Indonesia', offset: 7 },
  { name: 'Hanoi, Vietnam', offset: 7 },
  { name: 'Manila, Philippines', offset: 8 },
];

export const searchCities = (query: string): CityData[] => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return CITIES_DB.filter(c => c.name.toLowerCase().includes(q));
};

// --- Sleep Schedule Helpers ---

export const getSleepStartEnd = (slots: number[]) => {
  if (slots.length === 0) return { start: 23, end: 7 };
  return { start: 23, end: 7 }; 
};

export const generateSleepSlots = (start: number, end: number): number[] => {
  const slots: number[] = [];
  let current = start;
  while (current !== end) {
    slots.push(current);
    current++;
    if (current >= 24) current = 0;
  }
  return slots;
};