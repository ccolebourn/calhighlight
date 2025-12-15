export interface Appointment {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees?: Attendee[];
  organizer?: Organizer;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  provider: CalendarProvider;
  color?: EventColor;
}

export interface EventColor {
  id?: string;
  background?: string;
  foreground?: string;
}

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface Organizer {
  email: string;
  displayName?: string;
}

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  OTHER = 'other'
}
