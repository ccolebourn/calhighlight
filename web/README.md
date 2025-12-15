# Calendar Highlight - Web Interface

Next.js web application for testing and interacting with the Calendar API.

## Features

- AI-powered chat interface
- Calendar appointment viewing
- OAuth token management
- Shared TypeScript types with API

## Development

```bash
# From the root directory
npm run dev:web

# Or from this directory
npm run dev
```

The app will be available at `http://localhost:3001`

## Configuration

The API is proxied through Next.js to avoid CORS issues:
- API requests to `/api/*` are automatically forwarded to `http://localhost:3000/api/*`

## Usage

1. Start the API server (port 3000)
2. Start the web server (port 3001)
3. Get your OAuth token from the API
4. Paste the token in the web interface
5. Start chatting about your calendar!

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- React 18
- Shared types from `@calhighlight/shared`
