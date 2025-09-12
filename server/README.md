# Stern Configuration Service

A REST API service for managing configurations in the Stern Trading Platform. Provides transparent SQLite (development) and MongoDB (production) storage with comprehensive CRUD operations, validation, and bulk processing capabilities.

## Features

- **Dual Database Support**: SQLite for development/testing, MongoDB for production
- **Environment-based Switching**: Automatic database selection based on NODE_ENV
- **Comprehensive CRUD Operations**: Create, Read, Update, Delete, and Clone configurations
- **Advanced Querying**: Filter by multiple criteria with pagination support
- **Bulk Operations**: Efficient batch create, update, and delete operations
- **Data Validation**: Joi schema validation with business rule enforcement
- **Health Monitoring**: Built-in health checks and system diagnostics
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Comprehensive Testing**: Unit and integration tests with high coverage
- **Production Ready**: Logging, error handling, and graceful shutdown

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   REST API      │────│  Service Layer   │────│ Storage Layer   │
│                 │    │                  │    │                 │
│ • Routes        │    │ • Business Logic │    │ • SQLite        │
│ • Validation    │    │ • Validation     │    │ • MongoDB       │
│ • Middleware    │    │ • Transformation │    │ • Abstraction   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd stern/server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```bash
# Development (SQLite)
NODE_ENV=development
DATABASE_TYPE=sqlite
SQLITE_DATABASE_PATH=./data/stern-config.db

# Production (MongoDB)
# NODE_ENV=production
# MONGODB_URI=mongodb://localhost:27017/stern-configuration
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Configuration Management

#### Basic Operations
- `POST /api/v1/configurations` - Create new configuration
- `GET /api/v1/configurations/:configId` - Get configuration by ID
- `PUT /api/v1/configurations/:configId` - Update configuration
- `DELETE /api/v1/configurations/:configId` - Soft delete configuration

#### Advanced Operations
- `POST /api/v1/configurations/:configId/clone` - Clone existing configuration

#### Query Operations
- `GET /api/v1/configurations` - Query configurations (with optional pagination)
- `GET /api/v1/configurations/by-app/:appId` - Filter by app ID
- `GET /api/v1/configurations/by-user/:userId` - Filter by user ID
- `GET /api/v1/configurations/by-component/:componentType` - Filter by component type

#### Bulk Operations
- `POST /api/v1/configurations/bulk` - Bulk create configurations
- `PUT /api/v1/configurations/bulk` - Bulk update configurations
- `DELETE /api/v1/configurations/bulk` - Bulk delete configurations

#### System Operations
- `GET /api/v1/configurations/system/health` - Storage health check
- `POST /api/v1/configurations/system/cleanup` - Clean up deleted configurations

## Configuration Schema

The service uses a `UnifiedConfig` schema that supports versioned configurations:

```typescript
interface UnifiedConfig {
  configId: string;           // UUID
  appId: string;              // Application identifier
  userId: string;             // User identifier
  componentType: string;      // Component type (data-grid, chart, etc.)
  componentSubType?: string;  // Optional sub-type
  name: string;              // Display name
  description?: string;      // Optional description
  config: any;               // Main configuration data
  settings: ConfigVersion[]; // Version history
  activeSetting: string;     // Active version ID
  tags?: string[];           // Optional tags
  category?: string;         // Optional category
  isShared?: boolean;        // Sharing flag
  isDefault?: boolean;       // Default configuration flag
  isLocked?: boolean;        // Lock flag
  createdBy: string;         // Creator
  lastUpdatedBy: string;     // Last updater
  creationTime: Date;        // Creation timestamp
  lastUpdated: Date;         // Last update timestamp
  deletedAt?: Date;          // Soft delete timestamp
  deletedBy?: string;        // Deleter
}
```

## Examples

### Create Configuration
```bash
curl -X POST http://localhost:3001/api/v1/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "trading-app",
    "userId": "john.doe",
    "componentType": "data-grid",
    "name": "My Grid Configuration",
    "config": {
      "theme": "dark",
      "columns": 10,
      "autoRefresh": true
    },
    "settings": [{
      "versionId": "v1",
      "name": "Initial Version",
      "config": {...},
      "createdTime": "2023-01-01T00:00:00Z",
      "updatedTime": "2023-01-01T00:00:00Z",
      "isActive": true
    }],
    "activeSetting": "v1",
    "createdBy": "john.doe",
    "lastUpdatedBy": "john.doe"
  }'
```

### Query with Pagination
```bash
curl "http://localhost:3001/api/v1/configurations?page=1&limit=10&sortBy=name&sortOrder=asc"
```

### Bulk Create
```bash
curl -X POST http://localhost:3001/api/v1/configurations/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "configs": [
      {...config1},
      {...config2},
      {...config3}
    ]
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `localhost` |
| `DATABASE_TYPE` | Force database type (sqlite/mongodb) | Auto-detect |
| `SQLITE_DATABASE_PATH` | SQLite database file path | `./data/stern-config.db` |
| `MONGODB_URI` | MongoDB connection string | Required for production |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |

## Database Schemas

### SQLite Schema
```sql
CREATE TABLE configurations (
  configId TEXT PRIMARY KEY,
  appId TEXT NOT NULL,
  userId TEXT NOT NULL,
  componentType TEXT NOT NULL,
  componentSubType TEXT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  config TEXT NOT NULL,
  settings TEXT NOT NULL,
  activeSetting TEXT NOT NULL,
  tags TEXT,
  category TEXT,
  isShared INTEGER DEFAULT 0,
  isDefault INTEGER DEFAULT 0,
  isLocked INTEGER DEFAULT 0,
  createdBy TEXT NOT NULL,
  lastUpdatedBy TEXT NOT NULL,
  creationTime DATETIME NOT NULL,
  lastUpdated DATETIME NOT NULL,
  deletedAt DATETIME,
  deletedBy TEXT
);
```

### MongoDB Collection
Documents follow the `UnifiedConfig` interface with automatic indexing on:
- `configId` (unique)
- `appId`
- `userId`
- `componentType`
- `creationTime`
- `lastUpdated`

## Error Handling

The service provides comprehensive error handling with consistent response formats:

```typescript
// Success Response
{
  "configId": "uuid",
  "name": "Configuration Name",
  // ... other fields
}

// Error Response
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": ["Validation errors if applicable"],
  "timestamp": "2023-01-01T00:00:00Z"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `413` - Payload Too Large
- `429` - Rate Limited
- `500` - Internal Server Error

## Performance Considerations

- **Connection Pooling**: MongoDB uses connection pooling
- **Indexes**: Proper indexing on frequently queried fields
- **Pagination**: All list endpoints support pagination
- **Bulk Operations**: Optimized for batch processing (max 50 items)
- **Caching**: Consider Redis for production caching
- **Rate Limiting**: 100 requests per 15 minutes per IP in production

## Security

- **Input Validation**: Joi schema validation on all inputs
- **SQL Injection**: Parameterized queries prevent injection
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Rate Limiting**: Request throttling
- **Body Limits**: 10MB maximum request size

## Monitoring & Logging

- **Winston Logging**: Structured JSON logs
- **Health Checks**: Built-in health monitoring
- **Performance Metrics**: Request timing and status tracking
- **Error Tracking**: Comprehensive error logging with stack traces

## Development

### Project Structure
```
src/
├── app.ts                 # Express application setup
├── server.ts             # Server startup script
├── types/
│   └── configuration.ts  # TypeScript interfaces
├── storage/
│   ├── IConfigurationStorage.ts    # Storage interface
│   ├── SqliteStorage.ts           # SQLite implementation
│   ├── MongoDbStorage.ts          # MongoDB implementation
│   └── StorageFactory.ts         # Factory pattern
├── services/
│   └── ConfigurationService.ts   # Business logic layer
├── routes/
│   └── configurations.ts         # REST API routes
├── utils/
│   ├── validation.ts             # Joi schemas
│   └── logger.ts                 # Winston configuration
└── test/
    ├── setup.ts                  # Test configuration
    ├── utils/                    # Test utilities
    ├── storage/                  # Storage tests
    ├── services/                 # Service tests
    └── integration/              # API integration tests
```

### Adding New Features

1. Update TypeScript interfaces in `types/configuration.ts`
2. Update validation schemas in `utils/validation.ts`
3. Implement storage layer methods in both SQLite and MongoDB
4. Add business logic to `ConfigurationService.ts`
5. Create REST endpoints in `routes/configurations.ts`
6. Write comprehensive tests
7. Update documentation

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Environment Setup
- Development: SQLite with file storage
- Production: MongoDB with replica sets
- Testing: In-memory SQLite

## Contributing

1. Follow TypeScript best practices
2. Maintain test coverage above 80%
3. Use conventional commits
4. Update documentation for new features
5. Ensure all tests pass before committing

## License

MIT License - see LICENSE file for details.