export interface UserProfile {
  id: string;
  name: string;
  location: string;
  timezoneOffset: number; // Hours from UTC
  avatarColor: string;
  avatarEmoji?: string; // Optional emoji string
  busySlots: number[]; // Array of hours (0-23) where user is busy
  sleepSlots: number[]; // Array of hours (0-23) where user is sleeping
}

export interface CalendarEvent {
  id: string;
  type: 'call' | 'date' | 'sleep' | 'other';
  utcMinutes: number;
  duration: number;
  title: string;
  isConfirmed: boolean;
  dayOffset: number; // 0 for today, 1 for tomorrow, etc.
}

export interface AppState {
  localUser: UserProfile;
  remoteUser: UserProfile;
  selectedTimeUTC: number; // Minutes from UTC midnight
  dayOffset: number;
  isGoldenWindow: boolean;
  events: CalendarEvent[];
}

export enum TimeOfDay {
  Morning = 'Morning',
  Day = 'Day',
  Evening = 'Evening',
  Night = 'Night',
}