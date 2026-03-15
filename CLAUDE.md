# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoEnglish (回音法英语练习) — an Electron desktop app for English practice using the Echo Method. Built with Electron 33 + React 18 + TypeScript + Vite + Tailwind CSS 3.

## Development Commands

```bash
npm run dev        # Start in development mode (electron-vite dev)
npm run build      # Production build (electron-vite build)
npm run preview    # Preview production build
npm run start      # Alias for preview
```

No test runner or linter is currently configured.

## Architecture

### Three-Process Electron Model

- **Main process** (`src/main/`) — App lifecycle, window management, IPC handler registration, services (database, media import, SRT import). Entry: `src/main/index.ts`.
- **Preload** (`src/preload/`) — Context bridge exposing a typed `window.api` to the renderer via `contextBridge.exposeInMainWorld`. Security: context isolation enabled, node integration disabled, sandbox on.
- **Renderer** (`src/renderer/`) — React SPA with react-router-dom. Entry: `src/renderer/src/main.tsx`, router in `App.tsx`.

### IPC Communication

All renderer↔main communication goes through typed IPC channels defined in `src/preload/index.ts` and handled in `src/main/ipc-handlers.ts`. Channel namespaces: `media:*`, `transcript:*`, `practice:*`, `settings:*`.

### Data Layer

- JSON file-based database (`JsonDatabase` class in `src/main/services/database.service.ts`) stored at `userData/data/db.json`.
- Custom `media://` protocol handler for serving media files to the renderer.

### State Management

Zustand stores in `src/renderer/src/stores/`: `media.store.ts` (media list CRUD), `transcript.store.ts` (segments, navigation).

### Custom Hooks

- `useAudioRecorder` — MediaRecorder API wrapper for audio capture
- `useSpeechRecognition` — Web Speech API wrapper for transcription

### Key Types

Central type definitions in `src/renderer/src/types/media.types.ts`: `MediaRecord`, `TranscriptSegment`, `PracticeSession`, `PracticeResult`, `WordTiming`.

## Build Configuration

- `electron.vite.config.ts` — electron-vite config with `@vitejs/plugin-react`
- Three tsconfig files: `tsconfig.json` (root references), `tsconfig.node.json` (main/preload), `tsconfig.web.json` (renderer with `@renderer` path alias)
- Path alias: `@renderer` → `src/renderer/src`
