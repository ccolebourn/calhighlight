export interface ProviderConfig {
  name: string;
  displayName: string;
  authUrl?: string;
  scopes: string[];
  isImplemented: boolean;
}

export const calendarProviders: Record<string, ProviderConfig> = {
  google: {
    name: 'google',
    displayName: 'Google Calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    isImplemented: true
  },
  outlook: {
    name: 'outlook',
    displayName: 'Microsoft Outlook',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: ['https://graph.microsoft.com/Calendars.Read'],
    isImplemented: false
  },
  apple: {
    name: 'apple',
    displayName: 'Apple Calendar (iCloud)',
    scopes: [],
    isImplemented: false
  }
};

export const getProviderConfig = (provider: string): ProviderConfig | undefined => {
  return calendarProviders[provider.toLowerCase()];
};

export const getImplementedProviders = (): ProviderConfig[] => {
  return Object.values(calendarProviders).filter(p => p.isImplemented);
};
