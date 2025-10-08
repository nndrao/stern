# Stern Configuration Service - User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Data Models](#data-models)
6. [Usage Examples](#usage-examples)
7. [Database Configuration](#database-configuration)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Performance and Best Practices](#performance-and-best-practices)

---

## Overview

The Stern Configuration Service is a production-ready REST API that provides centralized configuration management for the Stern Trading Platform. It replaces 40+ duplicate trading applications with a single, unified, and configurable platform.

### Key Features

- **Dual Database Support**: Seamlessly switch between SQLite (development) and MongoDB (production)
- **Complete CRUD Operations**: Create, read, update, delete configurations with validation
- **Advanced Querying**: Multi-criteria filtering with pagination and sorting
- **Bulk Operations**: Create, update, or delete up to 50 configurations at once
- **Configuration Versioning**: Track configuration history with versioned settings
- **Soft Deletes**: Configurations are soft-deleted by default with cleanup capabilities
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **Full Test Coverage**: 103 passing tests with comprehensive coverage

### Technical Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js
- **Databases**: SQLite 3 (better-sqlite3), MongoDB 6.3+
- **Validation**: Joi schema validation
- **Testing**: Jest with Supertest

---

## Getting Started

### Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# (See Database Configuration section)
```

### Running the Service

#### Development Mode (SQLite)

```bash
# Start with auto-reload
npm run dev

# The service will start on http://localhost:3001
# Using SQLite database at ./data/stern-config.db
```

#### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

#### Testing

```bash
# Run all tests (103 tests)
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

---

## Architecture

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      REST API Layer                         │
│                  (Express Routes + Validation)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  ConfigurationService                       │
│         (Business Logic + Validation + Logging)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    StorageFactory                           │
│              (Database Abstraction Layer)                   │
└───────┬───────────────────────────────────┬─────────────────┘
        │                                   │
┌───────▼────────────┐             ┌────────▼────────────────┐
│  SqliteStorage     │             │   MongoDbStorage        │
│  (Development)     │             │   (Production)          │
└────────────────────┘             └─────────────────────────┘
```

### Core Components

#### 1. ConfigurationService ([src/services/ConfigurationService.ts](../server/src/services/ConfigurationService.ts))

The main business logic layer that:
- Validates all incoming data
- Manages configuration lifecycle
- Handles versioning and cloning
- Provides logging and error handling
- Enforces business rules

#### 2. StorageFactory ([src/storage/StorageFactory.ts](../server/src/storage/StorageFactory.ts))

Factory pattern for database selection:
- Auto-detects environment (development → SQLite, production → MongoDB)
- Supports explicit override via `DATABASE_TYPE` environment variable
- Validates environment configuration
- Manages database connections

#### 3. Storage Implementations

Both implement `IConfigurationStorage` interface:
- **SqliteStorage**: Fast, file-based, zero-config for development
- **MongoDbStorage**: Scalable, production-ready NoSQL database

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

### Basic CRUD Operations

#### Create Configuration

```http
POST /configurations
Content-Type: application/json

{
  "appId": "trading-app-1",
  "userId": "user123",
  "componentType": "grid",
  "componentSubType": "stomp",
  "name": "My Trading Grid",
  "description": "Custom grid configuration for trading",
  "config": {
    "columns": ["symbol", "price", "volume"],
    "theme": "dark"
  },
  "settings": [],
  "activeSetting": "temp-uuid",
  "createdBy": "user123",
  "lastUpdatedBy": "user123",
  "tags": ["trading", "custom"],
  "isShared": false
}
```

**Response**: `201 Created`
```json
{
  "configId": "550e8400-e29b-41d4-a716-446655440000",
  "appId": "trading-app-1",
  "userId": "user123",
  "componentType": "grid",
  "name": "My Trading Grid",
  "creationTime": "2025-01-15T10:30:00.000Z",
  "lastUpdated": "2025-01-15T10:30:00.000Z",
  ...
}
```

#### Get Configuration by ID

```http
GET /configurations/:configId
```

**Response**: `200 OK` or `404 Not Found`

#### Update Configuration

```http
PUT /configurations/:configId
Content-Type: application/json

{
  "name": "Updated Grid Name",
  "config": {
    "columns": ["symbol", "price", "volume", "change"],
    "theme": "light"
  },
  "lastUpdatedBy": "user123"
}
```

**Response**: `200 OK` with updated configuration

#### Delete Configuration (Soft Delete)

```http
DELETE /configurations/:configId
```

**Response**: `200 OK`
```json
{
  "success": true
}
```

### Advanced Operations

#### Clone Configuration

```http
POST /configurations/:configId/clone
Content-Type: application/json

{
  "newName": "Cloned Grid Configuration",
  "userId": "user456"
}
```

**Response**: `201 Created` with new configuration

### Bulk Operations

#### Bulk Create (Up to 50)

```http
POST /configurations/bulk
Content-Type: application/json

{
  "configs": [
    {
      "appId": "app1",
      "userId": "user123",
      "componentType": "grid",
      "name": "Grid 1",
      ...
    },
    {
      "appId": "app1",
      "userId": "user123",
      "componentType": "grid",
      "name": "Grid 2",
      ...
    }
  ]
}
```

**Response**: `201 Created` with array of created configurations

#### Bulk Update (Up to 50)

```http
PUT /configurations/bulk
Content-Type: application/json

{
  "updates": [
    {
      "configId": "config-id-1",
      "updates": { "name": "Updated Name 1" }
    },
    {
      "configId": "config-id-2",
      "updates": { "name": "Updated Name 2" }
    }
  ]
}
```

**Response**: `200 OK`
```json
[
  {
    "configId": "config-id-1",
    "success": true
  },
  {
    "configId": "config-id-2",
    "success": true
  }
]
```

#### Bulk Delete (Up to 50)

```http
DELETE /configurations/bulk
Content-Type: application/json

{
  "configIds": ["config-id-1", "config-id-2", "config-id-3"]
}
```

**Response**: `200 OK` with results array

### Query Operations

#### Basic Query

```http
GET /configurations?componentType=grid&userId=user123
```

**Response**: Array of matching configurations

#### Paginated Query

```http
GET /configurations?componentType=grid&page=1&limit=20&sortBy=lastUpdated&sortOrder=desc
```

**Response**: `200 OK`
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

#### Query Parameters

- **Filter Parameters**:
  - `configIds`: Comma-separated config IDs
  - `appIds`: Comma-separated app IDs
  - `userIds`: Comma-separated user IDs
  - `componentTypes`: Comma-separated component types
  - `componentSubTypes`: Comma-separated component subtypes
  - `nameContains`: Search in name
  - `descriptionContains`: Search in description
  - `tags`: Comma-separated tags
  - `isShared`: true/false
  - `isDefault`: true/false
  - `isLocked`: true/false
  - `includeDeleted`: true/false

- **Pagination Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 50, max: 100)
  - `sortBy`: Field to sort by (default: 'lastUpdated')
  - `sortOrder`: 'asc' or 'desc' (default: 'desc')

### Specialized Query Routes

#### Get by App ID

```http
GET /configurations/by-app/:appId?includeDeleted=false
```

#### Get by User ID

```http
GET /configurations/by-user/:userId?includeDeleted=false
```

#### Get by Component Type

```http
GET /configurations/by-component/:componentType?componentSubType=stomp&includeDeleted=false
```

### System Operations

#### Health Check

```http
GET /configurations/system/health
```

**Response**: `200 OK` (healthy) or `503 Service Unavailable` (unhealthy)
```json
{
  "isHealthy": true,
  "connectionStatus": "connected",
  "lastChecked": "2025-01-15T10:30:00.000Z",
  "responseTime": 5,
  "storageType": "sqlite"
}
```

#### Cleanup Deleted Configurations

```http
POST /configurations/system/cleanup
Content-Type: application/json

{
  "dryRun": true
}
```

**Response**: `200 OK`
```json
{
  "removedCount": 15,
  "dryRun": true,
  "configs": [...]
}
```

- Set `dryRun: false` to actually delete configurations
- Only removes configs deleted more than 30 days ago (configurable)

---

## Data Models

### UnifiedConfig

The core configuration object ([shared/src/configuration.ts](../shared/src/configuration.ts:3-39)):

```typescript
interface UnifiedConfig {
  // Identity
  configId: string;           // UUID
  appId: string;              // Application identifier
  userId: string;             // User who owns this config

  // Component Classification
  componentType: string;      // 'datasource' | 'grid' | 'profile' | etc.
  componentSubType?: string;  // 'stomp' | 'rest' | 'websocket' | etc.

  // Display
  name: string;               // User-friendly name
  description?: string;       // Optional description
  icon?: string;              // Optional icon identifier

  // Configuration Data
  config: Record<string, unknown>;  // Current configuration
  settings: ConfigVersion[];        // Version history
  activeSetting: string;            // ID of active version

  // Metadata
  tags?: string[];            // Searchable tags
  category?: string;          // Organizational category
  isShared?: boolean;         // Shared with other users
  isDefault?: boolean;        // System default
  isLocked?: boolean;         // Prevent modifications

  // Audit
  createdBy: string;          // User ID who created
  lastUpdatedBy: string;      // User ID who last updated
  creationTime: Date;         // ISO timestamp
  lastUpdated: Date;          // ISO timestamp

  // Soft Delete
  deletedAt?: Date | null;    // Soft delete timestamp
  deletedBy?: string | null;  // User who deleted
}
```

### ConfigVersion

Configuration version history ([shared/src/configuration.ts](../shared/src/configuration.ts:41-50)):

```typescript
interface ConfigVersion {
  versionId: string;          // UUID
  name: string;               // Version name
  description?: string;       // Optional description
  config: Record<string, unknown>;  // Version-specific config
  createdTime: Date;          // Version creation timestamp
  updatedTime: Date;          // Version last update
  isActive: boolean;          // Currently active version
  metadata?: Record<string, unknown>;  // Additional metadata
}
```

### Component Types

Available component types ([shared/src/configuration.ts](../shared/src/configuration.ts:122-146)):

```typescript
const COMPONENT_TYPES = {
  DATASOURCE: 'datasource',
  GRID: 'grid',
  DATA_GRID: 'data-grid',
  PROFILE: 'profile',
  WORKSPACE: 'workspace',
  THEME: 'theme',
  LAYOUT: 'layout',
  DOCK: 'dock'
}

const COMPONENT_SUBTYPES = {
  STOMP: 'stomp',
  WEBSOCKET: 'websocket',
  SOCKETIO: 'socketio',
  REST: 'rest',
  DEFAULT: 'default',
  CUSTOM: 'custom',
  SHARED: 'shared',
  DIRECT: 'direct'
}
```

---

## Usage Examples

### Example 1: Creating a Grid Configuration

```javascript
const axios = require('axios');

const gridConfig = {
  appId: 'trading-desk-1',
  userId: 'trader001',
  componentType: 'grid',
  componentSubType: 'stomp',
  name: 'Stock Trading Grid',
  description: 'Real-time stock trading grid with STOMP data feed',
  config: {
    columns: [
      { field: 'symbol', headerName: 'Symbol', width: 100 },
      { field: 'price', headerName: 'Price', width: 120 },
      { field: 'volume', headerName: 'Volume', width: 150 }
    ],
    dataSource: {
      protocol: 'stomp',
      endpoint: 'ws://data-feed.example.com/stomp',
      subscriptions: ['/topic/stocks']
    },
    theme: 'ag-theme-balham-dark'
  },
  settings: [],
  activeSetting: 'temp-uuid',
  createdBy: 'trader001',
  lastUpdatedBy: 'trader001',
  tags: ['trading', 'stocks', 'real-time'],
  category: 'trading-grids',
  isShared: false
};

async function createGridConfig() {
  try {
    const response = await axios.post(
      'http://localhost:3001/api/v1/configurations',
      gridConfig
    );
    console.log('Created configuration:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating configuration:', error.response?.data);
  }
}
```

### Example 2: Querying User Configurations

```javascript
async function getUserGrids(userId) {
  try {
    const response = await axios.get(
      `http://localhost:3001/api/v1/configurations/by-user/${userId}`,
      {
        params: {
          includeDeleted: false
        }
      }
    );

    // Filter to only grids
    const grids = response.data.filter(
      config => config.componentType === 'grid'
    );

    console.log(`Found ${grids.length} grids for user ${userId}`);
    return grids;
  } catch (error) {
    console.error('Error fetching configurations:', error.response?.data);
  }
}
```

### Example 3: Updating Configuration with Versioning

```javascript
async function updateGridWithVersion(configId, newColumns) {
  try {
    // First, get the current config
    const currentConfig = await axios.get(
      `http://localhost:3001/api/v1/configurations/${configId}`
    );

    // Create new version
    const newVersion = {
      versionId: uuidv4(),
      name: `Layout ${currentConfig.data.settings.length + 1}`,
      description: 'Updated column layout',
      config: {
        ...currentConfig.data.config,
        columns: newColumns
      },
      createdTime: new Date(),
      updatedTime: new Date(),
      isActive: true
    };

    // Update the configuration
    const response = await axios.put(
      `http://localhost:3001/api/v1/configurations/${configId}`,
      {
        config: newVersion.config,
        settings: [...currentConfig.data.settings, newVersion],
        activeSetting: newVersion.versionId,
        lastUpdatedBy: 'trader001'
      }
    );

    console.log('Configuration updated with new version');
    return response.data;
  } catch (error) {
    console.error('Error updating configuration:', error.response?.data);
  }
}
```

### Example 4: Bulk Operations

```javascript
async function createMultipleGrids(userId, gridNames) {
  const configs = gridNames.map(name => ({
    appId: 'trading-desk-1',
    userId,
    componentType: 'grid',
    name,
    config: { columns: [] },
    settings: [],
    activeSetting: 'temp-uuid',
    createdBy: userId,
    lastUpdatedBy: userId
  }));

  try {
    const response = await axios.post(
      'http://localhost:3001/api/v1/configurations/bulk',
      { configs }
    );
    console.log(`Created ${response.data.length} configurations`);
    return response.data;
  } catch (error) {
    console.error('Bulk create failed:', error.response?.data);
  }
}

// Usage
createMultipleGrids('trader001', [
  'Stocks Grid',
  'Forex Grid',
  'Futures Grid'
]);
```

### Example 5: Pagination with Search

```javascript
async function searchConfigurations(searchTerm, page = 1) {
  try {
    const response = await axios.get(
      'http://localhost:3001/api/v1/configurations',
      {
        params: {
          nameContains: searchTerm,
          page,
          limit: 20,
          sortBy: 'lastUpdated',
          sortOrder: 'desc'
        }
      }
    );

    console.log(`Page ${response.data.page} of ${response.data.totalPages}`);
    console.log(`Total results: ${response.data.total}`);
    return response.data;
  } catch (error) {
    console.error('Search failed:', error.response?.data);
  }
}
```

---

## Database Configuration

### SQLite (Development)

SQLite is used automatically in development and test environments.

**Environment Variables** ([server/.env.example](../server/.env.example)):

```bash
NODE_ENV=development
DATABASE_TYPE=sqlite  # Optional, auto-detected
SQLITE_DATABASE_PATH=./data/stern-config.db
```

**Characteristics**:
- ✅ Zero configuration
- ✅ File-based storage
- ✅ Fast for development
- ✅ Perfect for testing
- ❌ Not suitable for production with multiple connections

### MongoDB (Production)

MongoDB is used in production environments for scalability.

**Environment Variables**:

```bash
NODE_ENV=production
DATABASE_TYPE=mongodb  # Optional, auto-detected

# Connection
MONGODB_URI=mongodb://username:password@host:27017/stern-configuration
MONGODB_DATABASE=stern-configuration

# Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_IDLE_TIME_MS=30000
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000
MONGODB_CONNECT_TIMEOUT_MS=10000
```

**MongoDB Setup**:

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name stern-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

**Characteristics**:
- ✅ Production-ready
- ✅ Scalable
- ✅ Handles concurrent connections
- ✅ Rich querying capabilities
- ⚠️ Requires setup and configuration

### Switching Between Databases

The service automatically selects the database based on `NODE_ENV`:
- `development` or `test` → SQLite
- `production` → MongoDB

**Manual Override**:

```bash
# Force MongoDB in development
DATABASE_TYPE=mongodb npm run dev

# Force SQLite in production (not recommended)
DATABASE_TYPE=sqlite npm start
```

### Database Initialization

Both databases are automatically initialized on first connection:

**SQLite**: Creates tables and indexes automatically
**MongoDB**: Creates collections and indexes on first use

---

## Error Handling

### Validation Errors

**Request**: Invalid configuration data
**Response**: `400 Bad Request`
```json
{
  "error": "Validation failed",
  "details": [
    "\"appId\" is required",
    "\"name\" must be a string"
  ]
}
```

### Not Found Errors

**Request**: Non-existent configuration
**Response**: `404 Not Found`
```json
{
  "error": "Configuration not found"
}
```

### Server Errors

**Response**: `500 Internal Server Error`
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### Rate Limiting

Default: 1000 requests per 15 minutes per IP

**Response**: `429 Too Many Requests`
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Testing

### Test Structure

```
server/src/test/
├── integration/          # Integration tests (4 tests)
│   └── api.integration.test.ts
├── routes/              # Route tests (46 tests)
│   └── configurations.test.ts
├── services/            # Service tests (27 tests)
│   └── ConfigurationService.test.ts
├── storage/             # Storage tests (26 tests)
│   ├── SqliteStorage.test.ts
│   └── MongoDbStorage.test.ts
└── utils/               # Utility tests
    └── validation.test.ts
```

### Running Tests

```bash
# All tests (103 passing)
npm test

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Test Coverage

Current coverage: **~95%+**

Key areas covered:
- ✅ All CRUD operations
- ✅ Bulk operations
- ✅ Query and filtering
- ✅ Pagination
- ✅ Validation
- ✅ Error handling
- ✅ Storage implementations
- ✅ Cloning and versioning

### Writing Tests

Example test:

```typescript
describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(async () => {
    service = new ConfigurationService();
    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  it('should create a configuration', async () => {
    const config = {
      appId: 'test-app',
      userId: 'test-user',
      componentType: 'grid',
      name: 'Test Grid',
      config: {},
      settings: [],
      activeSetting: 'temp-uuid',
      createdBy: 'test-user',
      lastUpdatedBy: 'test-user'
    };

    const result = await service.createConfiguration(config);

    expect(result.configId).toBeDefined();
    expect(result.name).toBe('Test Grid');
  });
});
```

---

## Performance and Best Practices

### Performance Tips

1. **Use Pagination**: Always paginate large result sets
   ```javascript
   // Good
   GET /configurations?page=1&limit=50

   // Avoid
   GET /configurations  // Returns all records
   ```

2. **Specific Queries**: Use specific filters to reduce result sets
   ```javascript
   // Good
   GET /configurations?userId=user123&componentType=grid

   // Less efficient
   GET /configurations?nameContains=grid
   ```

3. **Bulk Operations**: Use bulk endpoints for multiple operations
   ```javascript
   // Good - Single request
   POST /configurations/bulk

   // Avoid - Multiple requests
   POST /configurations (called 50 times)
   ```

4. **Health Checks**: Monitor service health regularly
   ```javascript
   GET /configurations/system/health
   ```

### Best Practices

#### 1. Always Validate Input

```javascript
// Backend validation is automatic via Joi schemas
// But validate on client-side too
function validateConfig(config) {
  if (!config.appId || !config.userId || !config.name) {
    throw new Error('Missing required fields');
  }
  return config;
}
```

#### 2. Use Meaningful Names and Tags

```javascript
const config = {
  name: 'EUR/USD Trading Grid - Real-time',  // Descriptive
  description: 'Forex trading grid for EUR/USD pair with live updates',
  tags: ['forex', 'eur-usd', 'real-time', 'trading'],  // Searchable
  category: 'forex-grids'
};
```

#### 3. Implement Configuration Versioning

```javascript
// Keep history of configuration changes
const newVersion = {
  versionId: uuidv4(),
  name: 'Dark Theme Layout',
  config: updatedConfig,
  createdTime: new Date(),
  isActive: true
};

await updateConfiguration(configId, {
  settings: [...existingSettings, newVersion],
  activeSetting: newVersion.versionId
});
```

#### 4. Use Soft Deletes

```javascript
// Configurations are soft-deleted by default
DELETE /configurations/:configId

// Recover if needed by updating deletedAt to null
PUT /configurations/:configId
{
  "deletedAt": null,
  "deletedBy": null
}
```

#### 5. Regular Cleanup

```javascript
// Run cleanup monthly
// Dry run first to see what would be deleted
POST /configurations/system/cleanup
{ "dryRun": true }

// Then actually clean up
POST /configurations/system/cleanup
{ "dryRun": false }
```

#### 6. Error Handling

```javascript
async function safeConfigUpdate(configId, updates) {
  try {
    const result = await axios.put(
      `/configurations/${configId}`,
      updates
    );
    return { success: true, data: result.data };
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Configuration not found');
    } else if (error.response?.status === 400) {
      console.error('Validation failed:', error.response.data.details);
    } else {
      console.error('Unexpected error:', error);
    }
    return { success: false, error };
  }
}
```

### Security Considerations

1. **Authentication**: Implement JWT or OAuth for production
2. **Authorization**: Validate `userId` matches authenticated user
3. **Rate Limiting**: Default 1000 req/15min (configurable)
4. **Input Validation**: All inputs validated via Joi schemas
5. **CORS**: Configure allowed origins in `.env`

```bash
# .env
CORS_ORIGIN=https://your-app.com,https://admin.your-app.com
RATE_LIMIT_MAX=1000
```

### Monitoring

#### Health Endpoint

```javascript
// Check health every 30 seconds
setInterval(async () => {
  const health = await axios.get('/configurations/system/health');
  if (!health.data.isHealthy) {
    console.error('Service unhealthy:', health.data);
    // Alert ops team
  }
}, 30000);
```

#### Logging

All operations are logged with Winston:
- **Info**: Successful operations
- **Error**: Failed operations
- **Debug**: Detailed operation info

View logs:
```bash
# Development
tail -f server/logs/combined.log

# Production
tail -f server/logs/error.log
```

---

## Appendix

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `HOST` | localhost | Server host |
| `NODE_ENV` | development | Environment mode |
| `DATABASE_TYPE` | auto | Database type (sqlite/mongodb) |
| `SQLITE_DATABASE_PATH` | ./data/stern-config.db | SQLite file path |
| `MONGODB_URI` | - | MongoDB connection string |
| `MONGODB_DATABASE` | stern-configuration | MongoDB database name |
| `CORS_ORIGIN` | localhost:3000,5173,8080 | Allowed CORS origins |
| `LOG_LEVEL` | info | Logging level |
| `RATE_LIMIT_MAX` | 1000 | Requests per 15 minutes |

### Useful Commands

```bash
# Development
npm run dev           # Start dev server with auto-reload
npm run typecheck     # Check TypeScript types
npm run lint          # Lint code

# Building
npm run build         # Compile TypeScript to JavaScript
npm run clean         # Remove build artifacts

# Testing
npm test              # Run all tests
npm run test:coverage # Generate coverage report
npm run test:watch    # Watch mode for TDD

# Production
npm start             # Start production server
```

### Support and Contributing

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: [docs/STERN_DESIGN_DOCUMENT.md](../docs/STERN_DESIGN_DOCUMENT.md)
- **Project**: Stern Trading Platform Configuration Service
- **Version**: 1.0.0

---

**Last Updated**: January 2025
**Status**: Production Ready ✅
**Test Coverage**: 103/103 tests passing
