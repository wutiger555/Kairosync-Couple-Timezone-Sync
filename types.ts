
export interface UserProfile {
  id: string;
  name: string;
  location: string;
  timezoneOffset: number; // Hours from UTC
  avatarColor: string;
  avatarEmoji?: string; 
  avatarImage?: string; // Base64 data URL for custom photo
  busySlots: number[]; 
  sleepSlots: number[]; 
  currentStatus?: string; 
  mood?: 'focused' | 'longing' | 'joyful' | 'resting' | 'active'; // Ambient mood
  syncDate?: string; // When the relationship/sync started
}

export interface CalendarEvent {
  id: string;
  type: 'call' | 'date' | 'sleep' | 'other' | 'memory';
  utcMinutes: number;
  duration: number;
  title: string;
  isConfirmed: boolean;
  dayOffset: number; 
  note?: string; 
}

export interface AppState {
  localUser: UserProfile;
  remoteUser: UserProfile;
  selectedTimeUTC: number; 
  dayOffset: number;
  isGoldenWindow: boolean;
  events: CalendarEvent[];
  nextMeetingDate?: string; 
}

export enum TimeOfDay {
  Morning = 'Morning',
  Day = 'Day',
  Evening = 'Evening',
  Night = 'Night',
}
