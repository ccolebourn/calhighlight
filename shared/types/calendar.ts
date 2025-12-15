export interface CalendarQuery {
  date?: string;          // YYYY-MM-DD format
  startDate?: string;     // YYYY-MM-DD format
  endDate?: string;       // YYYY-MM-DD format
}

export interface CalendarResponse {
  success: boolean;
  count?: number;
  appointments?: any[];   // Will be Appointment[] when imported
  error?: string;
  details?: string;
}

export interface UpdateColorRequest {
  colorId: string;
}

export interface UpdateColorResponse {
  success: boolean;
  message?: string;
  appointment?: any;      // Will be Appointment when imported
  error?: string;
  details?: string;
}
