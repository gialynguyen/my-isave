# English Guide

An AI-powered English learning platform built with SvelteKit, featuring vocabulary building, pronunciation training, and conversation practice.

## Features

- **Vocabulary Building**: AI-powered word learning with spaced repetition
- **Pronunciation Training**: Speech analysis and feedback
- **Conversation Practice**: Real-time AI conversations for practical learning
- **Progress Tracking**: Comprehensive learning analytics
- **Adaptive Learning**: Personalized difficulty adjustment

## Tech Stack

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **Backend**: Hono API, MikroORM
- **Database**: PostgreSQL
- **AI Integration**: OpenAI, OpenRouter support
- **Testing**: Vitest, Playwright

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the database:
   ```bash
   npm run db:migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── user/          # User management
│   ├── vocabulary/    # Vocabulary learning
│   └── conversation/  # Conversation practice
├── lib/               # Shared utilities
│   ├── ai/           # AI service integrations
│   ├── postgres-orm/ # Database utilities
│   └── types.ts      # Type definitions
├── routes/           # SvelteKit routes
└── server/           # Server-side code
```

## License

Private project - All rights reserved