# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stern Trading Platform** - A unified configurable platform replacing 40+ duplicate trading applications.

- **Architecture**: Monorepo with backend REST Configuration Service (Node.js/Express) and frontend React client
- **Purpose**: Single configurable blotter platform to replace massive code duplication across trading applications
- **Structure**:
  - `/server` - Node.js REST API with dual database support (SQLite dev, MongoDB production)
  - `/client` - React 18 + TypeScript frontend with Vite build system
  - `/docs` - Contains comprehensive design document (STERN_DESIGN_DOCUMENT.md)

## Development Commands

### Backend Server (`/server`)
- Development: `npm run dev` (nodemon with ts-node)
- Build: `npm run build` (TypeScript compilation)
- Production: `npm start` (runs built JavaScript)
- Testing: `npm test` (all tests), `npm run test:watch`, `npm run test:coverage`
- Unit tests only: `npm run test:unit`
- Integration tests only: `npm run test:integration`
- Linting: `npm run lint`
- Type checking: `npm run typecheck`

### Frontend Client (`/client`)
- Development: `npm run dev` (Vite dev server)
- Build: `npm run build` (TypeScript check + Vite build)
- Production preview: `npm run preview`
- Linting: `npm run lint`

## Core Architecture

### Backend Configuration Service
- **Dual Database Architecture**: StorageFactory pattern supporting SQLite (development) and MongoDB (production)
- **Key Services**: ConfigurationService.ts handles CRUD operations with validation
- **Testing**: Comprehensive test coverage with Jest (103 tests passing)
- **API Structure**: RESTful endpoints with versioning support
- **Configuration Schema**: UnifiedConfig interface supporting multiple component types

### Frontend Structure
- **Stack**: React 18, TypeScript 5.5+, Vite, Tailwind CSS, shadcn/ui components
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
- **UI Components**: Full shadcn/ui component library pre-installed
- **State Management**: Designed for Zustand and React Query integration

### Multi-Protocol Data Provider Architecture
Designed to support multiple data protocols through unified IDataProvider interface:
- STOMP
- Socket.IO
- WebSocket
- REST

### OpenFin Platform Integration
For desktop trading platform deployment with workspace patterns.

## Template and Reference Implementations

### React Project Template
- **Location**: `C:\Users\andyrao\Documents\projects\react-shadcn`
- **Usage**: Always use this as the template for any new Vite React projects
- **Features**: Complete shadcn/ui setup with Tailwind theming

### OpenFin Implementation References
- React Framework Starter: https://github.com/built-on-openfin/frontend-framework-starter/tree/main/frameworks/react
- Workspace Starter: https://github.com/built-on-openfin/workspace-starter/tree/main/how-to

### AGV3 Reference Implementation
- **Location**: `C:\Users\andyrao\Documents\projects\agv3`
- **Purpose**: Existing production system with proven patterns
- **Key Components**: DataGridStompShared, conditional formatting, configuration services, OpenFin integration

## Implementation Phases

Based on the design document, development follows these phases:
1. **Configuration Service & Storage** (✅ COMPLETED)
2. **Data Provider Architecture** - Multi-protocol IDataProvider interface
3. **Core Blotter Component** - AG-Grid Enterprise integration
4. **Customization Dialog System** - Dynamic configuration UI
5. **Polish & Performance** - Optimization and testing
6. **Migration Strategy** - Replace existing 40 blotters

## Key Files and Locations

### Backend Core Files
- `server/src/services/ConfigurationService.ts` - Main business logic
- `server/src/storage/StorageFactory.ts` - Database abstraction
- `server/src/types/configuration.ts` - TypeScript interfaces
- `server/jest.config.js` - Test configuration

### Frontend Structure
- `client/src/` - Main application source
- `client/tsconfig.json` - TypeScript project references setup
- `client/tailwind.config.js` - Tailwind with shadcn/ui theming

### Documentation
- `docs/STERN_DESIGN_DOCUMENT.md` - Comprehensive architecture and implementation guide (3999 lines)

## Development Notes

- The backend service is production-ready with full test coverage
- Frontend is scaffolded using the react-shadcn template but needs implementation
- All new React components should follow shadcn/ui patterns
- Database switching is handled automatically via environment variables
- OpenFin integration will be required for desktop deployment

## Development Preferences (IMPORTANT)

### Port Configuration
- **ALWAYS run the React app on port 5173** for testing and debugging
- **ALWAYS kill any process using port 5173** before starting the dev server
- Use `cmd /c "taskkill /F /IM node.exe"` to kill Node.js processes if needed
- Vite config is configured with `port: 5173, strictPort: true` to enforce this

### Essential Commands for Testing
```bash
# Kill processes on port 5173
cmd /c "taskkill /F /IM node.exe"

# Start dev server (always on port 5173)
cd client && npm run dev

# Launch OpenFin for testing
./launch-openfin.bat
```