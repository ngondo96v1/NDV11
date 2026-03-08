# NDV Money - Architecture

This application follows the standard modern web architecture:

## 1. Frontend (Vercel)
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS 4.0
- **Deployment**: Deployed as a static Single Page Application (SPA) on Vercel.
- **Routing**: Client-side routing with fallback to `index.html`.

## 2. Backend / Serverless (Vercel)
- **Framework**: Express.js
- **Runtime**: Node.js Serverless Functions
- **Entry Point**: `/api/index.ts`
- **Integration**: The Express app is decoupled and exported as a standalone module, allowing it to run both as a serverless function on Vercel and as a traditional Express server locally.

## 3. Database (Supabase)
- **Provider**: Supabase (PostgreSQL)
- **Integration**: Connected via `@supabase/supabase-js` in the backend layer.
- **Security**: Service Role Key used server-side for secure data operations.

## Local Development
Run the unified server:
```bash
npm run dev
```
This starts the Express server which proxies Vite for the frontend and handles API requests.
