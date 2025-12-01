# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Euphoria is a JARVIS-inspired tech news intelligence dashboard built with Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, and the Arwes sci-fi UI framework.

## Commands

```bash
yarn dev        # Start development server (http://localhost:3000)
yarn build      # Build for production
yarn start      # Start production server
yarn lint       # Run ESLint
```

## Architecture

- **App Router**: All routes in `app/` directory (client components due to Arwes)
- **Login Page**: `app/page.tsx` - password authentication with boot sequence animation
- **Dashboard**: `app/dashboard/page.tsx` - main news feed interface
- **API Routes**: `app/api/news/route.ts` - aggregates news from multiple sources
- **Components**: `app/components/` - reusable UI components

## Key Components

- `ArwesProvider` - wraps app with Arwes animator configuration
- `CircuitBackground` - animated particle/circuit canvas background
- `JarvisFrame` - sci-fi styled frame using Arwes FrameOctagon
- `NewsCard` / `NewsSection` - news display components
- `StatusWidget` - real-time status display

## Data Sources

The news API (`/api/news`) fetches from:
- Product Hunt RSS feed
- Hacker News API (top stories)
- HN Algolia API (AI/ML and startup filtered content)

## Arwes Framework Notes

- React strict mode is disabled in `next.config.ts` (required by Arwes)
- Arwes does not support React Server Components - all Arwes components must be client components
- Uses `@arwes/react@1.0.0-alpha.23` with `motion@10` for animations
- Key Arwes components: `Animator`, `Animated`, `Text`, `FrameOctagon`

## Theming

CSS variables defined in `globals.css`:
- `--primary`: #00d4ff (cyan - main accent)
- `--secondary`: #ff6b35 (orange)
- `--accent`: #39ff14 (green - success states)
- `--background`: #000000 (dark theme)

## Authentication

Simple session-based auth stored in `sessionStorage` under key `euphoria_auth`. Password accepts any input >= 4 characters for demo purposes.
