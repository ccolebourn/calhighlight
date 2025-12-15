# Calendar API

A REST API for accessing calendar appointments with support for multiple calendar providers. Currently supports Google Calendar with an extensible architecture for adding more providers.

## Features

- Access Google Calendar appointments via REST API
- Read appointment details including colors
- Update appointment colors programmatically
- **Chat with AI assistant powered by LangChain and OpenAI GPT-4o-mini**
- **Natural language queries about your schedule**
- OAuth 2.0 authentication flow
- Query appointments by specific date or date range
- Extensible architecture for multiple calendar providers
- TypeScript for type safety
- Free to use (within API limits)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Google Cloud Platform account (free)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/calendar/callback`
   - Click "Create"
5. Copy the Client ID and Client Secret

### 3. Set Up OpenAI API (Optional - for Chat Feature)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the API key (you won't be able to see it again)

**Note:** OpenAI has free tier credits for new accounts. GPT-4o-mini is very cost-effective (~$0.15 per 1M input tokens).

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   PORT=3000
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

   # Optional: For chat feature
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### 5. Run the Application

Development mode with auto-reload:
```bash
npm run dev
```

Build and run production:
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Usage

### Step 1: Get Authorization URL

Make a GET request to get the Google OAuth authorization URL:

```bash
curl http://localhost:3000/api/calendar/auth
```

Response:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Visit this URL to authorize the application"
}
```

Visit the `authUrl` in your browser, sign in with your Google account, and authorize the application.

### Step 2: Exchange Code for Tokens

After authorization, Google will redirect to the callback URL with a `code` parameter. The API will automatically handle this and return tokens:

```
http://localhost:3000/api/calendar/callback?code=4/0AY0e-...
```

Response:
```json
{
  "success": true,
  "tokens": {
    "access_token": "ya29.a0AfH6...",
    "refresh_token": "1//0gX3...",
    "expiry_date": 1640000000000
  }
}
```

Save the `access_token` for making API requests. Save the `refresh_token` for getting new access tokens when they expire.

**Important:** If you previously authorized this app with read-only access, you'll need to re-authorize to enable color updating. Visit the auth URL again and grant permissions.

### Step 3: Get Appointments

Use the access token to fetch appointments:

**Get appointments for a specific date:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/calendar/appointments?date=2025-12-15"
```

**Get appointments for a date range:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/calendar/appointments?startDate=2025-12-15&endDate=2025-12-20"
```

Response:
```json
{
  "success": true,
  "count": 2,
  "appointments": [
    {
      "id": "event_id_123",
      "summary": "Team Meeting",
      "description": "Weekly team sync",
      "location": "Conference Room A",
      "startTime": "2025-12-15T10:00:00.000Z",
      "endTime": "2025-12-15T11:00:00.000Z",
      "attendees": [
        {
          "email": "user@example.com",
          "displayName": "John Doe",
          "responseStatus": "accepted"
        }
      ],
      "organizer": {
        "email": "organizer@example.com",
        "displayName": "Jane Smith"
      },
      "status": "confirmed",
      "htmlLink": "https://www.google.com/calendar/event?eid=...",
      "provider": "google"
    }
  ]
}
```

### Step 4: Update Appointment Color (Optional)

Update the color of an appointment:

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"colorId": "9"}' \
  "http://localhost:3000/api/calendar/appointments/EVENT_ID/color"
```

Replace `EVENT_ID` with the appointment ID from the get appointments response.

**Available Color IDs (Google Calendar):**
- 1: Lavender
- 2: Sage
- 3: Grape
- 4: Flamingo
- 5: Banana
- 6: Tangerine
- 7: Peacock
- 8: Graphite
- 9: Blueberry
- 10: Basil
- 11: Tomato

Response:
```json
{
  "success": true,
  "message": "Appointment color updated successfully",
  "appointment": {
    "id": "event_id_123",
    "summary": "Team Meeting",
    "color": {
      "id": "9",
      "background": "#5484ed",
      "foreground": "#1d1d1d"
    },
    ...
  }
}
```

### Step 5: Chat with AI Assistant (Optional)

Chat naturally with an AI assistant that can access your calendar using LangChain and OpenAI:

**Requirements:**
- OpenAI API key configured in `.env`
- The assistant uses GPT-4o-mini model

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do I have on my calendar today?"
  }' \
  "http://localhost:3000/api/chat"
```

**Example queries:**
- "What do I have on my calendar today?"
- "Show me my meetings for tomorrow"
- "What's on my schedule next week?"
- "Do I have any appointments on Friday?"

Response:
```json
{
  "success": true,
  "response": "You have 3 appointments today:\n\n1. Team Standup at 9:00 AM - 9:30 AM\n2. Client Meeting at 2:00 PM - 3:00 PM in Conference Room A\n3. Project Review at 4:30 PM - 5:30 PM",
  "message": "Chat response generated successfully"
}
```

**How it works:**
- The AI assistant understands natural language queries about your calendar
- It automatically calls the calendar API tool when needed
- Provides conversational, human-readable responses
- Can handle relative dates like "today", "tomorrow", "next week"

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API information and documentation | No |
| GET | `/api/calendar/auth` | Get OAuth authorization URL | No |
| GET | `/api/calendar/callback` | OAuth callback (automatic) | No |
| GET | `/api/calendar/appointments` | Get appointments | Yes |
| PATCH | `/api/calendar/appointments/:eventId/color` | Update appointment color | Yes |
| POST | `/api/chat` | Chat with AI about your calendar | Yes |

## Project Structure

```
src/
├── controllers/
│   ├── calendar.controller.ts      # Calendar REST endpoint handlers
│   └── chat.controller.ts          # Chat endpoint handler
├── services/
│   ├── calendar.service.ts         # Abstract calendar interface
│   ├── google-calendar.service.ts  # Google Calendar implementation
│   └── langchain.service.ts        # LangChain agent service
├── tools/
│   └── calendar.tool.ts            # LangChain tool for calendar access
├── models/
│   └── appointment.model.ts        # Data models
├── middleware/
│   └── auth.middleware.ts          # Authentication middleware
├── config/
│   └── calendar-providers.ts       # Provider configurations
└── server.ts                       # Express app setup
```

## Extending to Other Providers

The architecture is designed for easy extension. To add a new provider:

1. Create a new service class implementing `ICalendarService`:
   ```typescript
   // src/services/outlook-calendar.service.ts
   export class OutlookCalendarService implements ICalendarService {
     // Implement interface methods
   }
   ```

2. Update the controller factory in `calendar.controller.ts`:
   ```typescript
   case 'outlook':
     this.calendarService = new OutlookCalendarService();
     break;
   ```

3. Update `calendar-providers.ts` configuration

## Free Tier Limits

**Google Calendar API:**
- 1,000,000 queries per day
- Free forever
- More than enough for personal projects

## Troubleshooting

**"Invalid credentials" error:**
- Verify your Client ID and Client Secret in `.env`
- Ensure the redirect URI matches exactly in Google Cloud Console

**"Access token expired" error:**
- Use the refresh token to get a new access token
- Implement token refresh logic in your client application

**"Calendar not found" error:**
- Ensure you've authorized the correct Google account
- Check that the account has calendar access

## Security Notes

- Never commit `.env` file to version control
- Store tokens securely in your application
- Use HTTPS in production
- Consider adding rate limiting for production use
- The access token expires after 1 hour - implement refresh logic

## Future Enhancements

- Token refresh endpoint
- Support for Microsoft Outlook/Office 365
- Support for Apple Calendar (CalDAV)
- Create/update/delete appointments
- Webhook support for real-time updates
- Multi-calendar support
- Recurring event handling

## License

MIT
