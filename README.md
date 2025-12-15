# Calendar Highlight - Monorepo

A full-stack calendar application with AI-powered chat interface.

## Project Structure

```
calhighlight/
├── api/              # Express REST API with Google Calendar integration
├── web/              # Next.js web application
├── shared/           # Shared TypeScript types and utilities
└── package.json      # Root workspace configuration
```

## Features

- **REST API** - Access and manage Google Calendar appointments
- **AI Chat** - Natural language queries powered by LangChain & OpenAI
- **Web Interface** - Modern Next.js UI for testing and interacting with the API
- **Shared Types** - TypeScript types shared between frontend and backend

## Quick Start

### Prerequisites

- Node.js v16 or higher
- npm
- Google Cloud Platform account (for Calendar API)
- OpenAI API key (for chat features)

### Installation

```bash
# Install all dependencies
npm install

# Or install workspace-specific dependencies
npm install --workspace=api
npm install --workspace=web
```

### Development

Run both API and web app:
```bash
npm run dev
```

Run individually:
```bash
npm run dev:api    # API only (port 3000)
npm run dev:web    # Web only (port 3001)
```

### Configuration

See the individual README files:
- [API Documentation](./api/README.md)
- [Web Documentation](./web/README.md)

## Workspaces

This is a npm workspaces monorepo with three packages:

### `/api`
Express TypeScript REST API with:
- Google Calendar integration
- OAuth 2.0 authentication
- LangChain AI chat
- Appointment color management

### `/web`
Next.js TypeScript application with:
- Modern UI for testing the API
- Calendar views
- AI chat interface

### `/shared`
Shared types and utilities used by both API and web

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both API and web in development mode |
| `npm run dev:api` | Run API only |
| `npm run dev:web` | Run web only |
| `npm run build` | Build all workspaces |
| `npm run build:api` | Build API only |
| `npm run build:web` | Build web only |
| `npm install:all` | Install all dependencies |
| `npm run clean` | Remove all node_modules |

## License

MIT
