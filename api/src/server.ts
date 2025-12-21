import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CalendarController } from './controllers/calendar.controller';
import { ChatController } from './controllers/chat.controller';
import { CategorySuggestionController } from './controllers/category-suggestion.controller';

dotenv.config();

// Validate required environment variables
console.log('=== Checking Environment Configuration ===');
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease copy .env.example to .env and fill in your Google OAuth credentials');
  console.error('See README.md for setup instructions');
  process.exit(1);
}

console.log('✓ All required environment variables are set');
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// Check for optional OpenAI API key
if (process.env.OPENAI_API_KEY) {
  console.log('✓ OpenAI API key configured (chat endpoint enabled)');
} else {
  console.log('⚠ OpenAI API key not configured (chat endpoint will not work)');
}
console.log('');

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const calendarController = new CalendarController('google');
const chatController = new ChatController();
const categorySuggestionController = new CategorySuggestionController();

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Calendar API Server',
    version: '1.0.0',
    endpoints: {
      auth: 'GET /api/calendar/auth - Get authorization URL',
      callback: 'GET /api/calendar/callback?code=... - OAuth callback',
      appointments: 'GET /api/calendar/appointments?date=YYYY-MM-DD - Get appointments',
      appointmentsRange: 'GET /api/calendar/appointments?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Get appointments in range',
      updateColor: 'PATCH /api/calendar/appointments/:eventId/color - Update appointment color (body: {colorId: "1-11"})',
      chat: 'POST /api/chat - Chat with AI assistant about your calendar (body: {message: string})',
      suggestCategories: 'POST /api/calendar/suggest-categories - AI-powered category suggestions (body: {message?: string, conversationHistory?: array})',
      categorizeEvents: 'POST /api/calendar/categorize-events - Categorize events using AI (body: {categories: Category[], startDate: string, endDate: string})'
    }
  });
});

app.get('/api/calendar/auth', calendarController.getAuthUrl);
app.get('/api/calendar/callback', calendarController.handleCallback);
app.get('/api/calendar/appointments', calendarController.getAppointments);
app.patch('/api/calendar/appointments/:eventId/color', calendarController.updateColor);
app.post('/api/calendar/chat', chatController.chat);
app.post('/api/calendar/suggest-categories', categorySuggestionController.suggestCategories);
app.post('/api/calendar/categorize-events', categorySuggestionController.categorizeEvents);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Calendar API server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});

export default app;
