
import { TimeOfDay, UserProfile } from '../types';
import React from 'react';
import { Cloud, CloudRain, Moon, Sun, CloudLightning } from 'lucide-react';

export const MINUTES_IN_DAY = 1440;

// Fix: Define CityData interface to resolve import error in SettingsModal
export interface CityData {
  name: string;
  offset: number;
}

// Fix: Implement getInitials to resolve import error in SettingsModal
export const getInitials = (name: string): string => {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

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

export const getSkyColor = (tod: TimeOfDay): string => {
  switch (tod) {
    case TimeOfDay.Morning: return '#fdba74'; 
    case TimeOfDay.Day: return '#38bdf8'; 
    case TimeOfDay.Evening: return '#818cf8'; 
    case TimeOfDay.Night: return '#0f172a'; 
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

export const findNextGoldenWindow = (userA: UserProfile, userB: UserProfile, startUTC: number) => {
    // Check next 24 hours in 30min intervals
    for (let i = 0; i < 48; i++) {
        const checkUTC = (startUTC + i * 30) % MINUTES_IN_DAY;
        if (checkGoldenWindow(userA, userB, checkUTC)) {
            return checkUTC;
        }
    }
    return null;
};

export const getRelativeTimeDiff = (offsetA: number, offsetB: number): string => {
  const diff = Math.abs(offsetA - offsetB);
  return `${diff}H DIFF`;
};

export const getCountdown = (targetDate?: string) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} DAYS` : "TODAY";
};

export const getWeather = (utcMinutes: number, timezoneOffset: number, location: string) => {
  const hour = getHour(utcMinutes + timezoneOffset * 60);
  const seed = location.length + hour;
  let temp = 15 + (seed % 15);
  let icon = Sun;
  let condition = "Clear";
  
  if (hour < 6 || hour > 20) {
      icon = Moon;
      condition = "Clear";
  }
  return { temp, icon, condition };
};

export const CITIES_DB: CityData[] = [
  // North America
  { name: 'Berkeley, USA', offset: -8 },
  { name: 'San Francisco, USA', offset: -8 },
  { name: 'Los Angeles, USA', offset: -8 },
  { name: 'New York, USA', offset: -5 },
  { name: 'Chicago, USA', offset: -6 },
  { name: 'Toronto, Canada', offset: -5 },
  { name: 'Vancouver, Canada', offset: -8 },
  { name: 'Mexico City, Mexico', offset: -6 },
  
  // Europe
  { name: 'London, UK', offset: 0 },
  { name: 'Paris, France', offset: 1 },
  { name: 'Berlin, Germany', offset: 1 },
  { name: 'Amsterdam, Netherlands', offset: 1 },
  { name: 'Madrid, Spain', offset: 1 },
  { name: 'Rome, Italy', offset: 1 },
  { name: 'Kyiv, Ukraine', offset: 2 },
  
  // Asia
  { name: 'Taipei, Taiwan', offset: 8 },
  { name: 'Tokyo, Japan', offset: 9 },
  { name: 'Seoul, South Korea', offset: 9 },
  { name: 'Beijing, China', offset: 8 },
  { name: 'Shanghai, China', offset: 8 },
  { name: 'Hong Kong', offset: 8 },
  { name: 'Singapore', offset: 8 },
  { name: 'Bangkok, Thailand', offset: 7 },
  { name: 'Mumbai, India', offset: 5.5 },
  { name: 'Delhi, India', offset: 5.5 },
  { name: 'Dubai, UAE', offset: 4 },
  
  // Oceania
  { name: 'Sydney, Australia', offset: 11 },
  { name: 'Melbourne, Australia', offset: 11 },
  { name: 'Auckland, New Zealand', offset: 13 },
  
  // South America & Others
  { name: 'São Paulo, Brazil', offset: -3 },
  { name: 'Buenos Aires, Argentina', offset: -3 },
  { name: 'Johannesburg, South Africa', offset: 2 },
];

export const searchCities = (query: string): CityData[] => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return CITIES_DB.filter(c => c.name.toLowerCase().includes(q));
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
