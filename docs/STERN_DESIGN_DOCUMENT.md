# Stern - Unified Trading Platform Design Document

**Version**: 1.0  
**Date**: 2025-01-14  
**Purpose**: Comprehensive documentation of Stern unified trading blotter platform design decisions and architecture

**Project**: Stern - Single configurable platform replacing 40+ duplicate trading applications  
**Location**: `C:\Users\andyrao\Documents\projects\stern\`  
**Reference**: AGV3 implementation at `C:\Users\andyrao\Documents\projects\agv3\`

## Project Structure & Locations

### Current AGV3 Implementation (Reference)
**Location**: `C:\Users\andyrao\Documents\projects\agv3`  
**Purpose**: Existing production system with proven patterns and components  
**Key Reference Components**:
- `src/windows/datagrid/components/DataGridStompShared/` - Complete blotter implementation
- `src/components/conditional-formatting/` - Advanced formatting system
- `src/services/configuration/` - Configuration management services
- `src/services/openfin/` - OpenFin integration patterns
- `src/hooks/` - Reusable hook patterns
- `src/utils/` - Utility functions and helpers

### New Stern Implementation
**Location**: `C:\Users\andyrao\Documents\projects\stern` (to be created)  
**Purpose**: Clean, unified implementation based on this design document  
**Architecture**: Single configurable platform replacing 40+ separate applications

### Component Reference Mapping
```typescript
// Reference implementations to study from AGV3:
interface AGV3ReferenceComponents {
  // Core DataGrid Implementation
  dataGridShared: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/';
  
  // Hook-based Architecture (recently refactored)
  customHooks: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/hooks/';
  
  // Dialog System Implementation
  dialogs: {
    container: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/components/DialogsContainer.tsx';
    management: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/hooks/useDialogManagement.ts';
    openfin: 'C:/Users/andyrao/Documents/projects/agv3/src/services/openfin/OpenFinDialogService.ts';
  };
  
  // Advanced Features
  conditionalFormatting: 'C:/Users/andyrao/Documents/projects/agv3/src/components/conditional-formatting/';
  columnGroups: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/columnGroups/';
  calculatedColumns: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/calculatedColumns/';
  
  // Configuration & Storage
  configurationService: 'C:/Users/andyrao/Documents/projects/agv3/src/services/configuration/';
  unifiedStorage: 'C:/Users/andyrao/Documents/projects/agv3/src/services/storage/';
  
  // STOMP Data Provider (Template for other protocols)
  stompProvider: 'C:/Users/andyrao/Documents/projects/agv3/src/services/providers/StompDatasourceProvider.ts';
  sharedWorkerClient: 'C:/Users/andyrao/Documents/projects/agv3/src/services/sharedWorker/SharedWorkerClient.ts';
  
  // OpenFin Integration
  platformProvider: 'C:/Users/andyrao/Documents/projects/agv3/src/services/openfin/OpenFinServiceProvider.ts';
  workspaceServices: 'C:/Users/andyrao/Documents/projects/agv3/src/services/openfin/useOpenFinServices.ts';
  
  // UI Components & Patterns
  toolbar: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/components/Toolbar/';
  profileManagement: 'C:/Users/andyrao/Documents/projects/agv3/src/hooks/useProfileManagement.ts';
}
```

---

## Table of Contents

1. [Business Context & Problem Statement](#business-context--problem-statement)
2. [Current State Analysis](#current-state-analysis)
3. [Architectural Vision](#architectural-vision)
4. [Multi-Protocol Data Provider Architecture](#multi-protocol-data-provider-architecture)
5. [Centralized Configuration Management](#centralized-configuration-management)
6. [OpenFin Platform Integration](#openfin-platform-integration)
7. [Implementation Strategy](#implementation-strategy)
8. [Technical Decisions Log](#technical-decisions-log)

---

## Business Context & Problem Statement

### Trading System Frontend Architecture Challenge

**Current State Pain Points:**
- **40+ separate React applications** - Each blotter type (position, trading, risk, P&L) is a standalone React app
- **High code duplication** - ~80% of features are common across all blotters
- **Maintenance nightmare** - Each blotter is essentially a customized copy of a base template
- **Inconsistent user experience** - Slight variations between blotters create confusion
- **High development costs** - Feature changes require 40x effort across all applications

### Business Impact
- **Development Efficiency**: 90% code duplication waste
- **Time-to-Market**: New blotter types take months instead of hours
- **Support Overhead**: Bugs may exist in some blotters but not others
- **User Training**: Each blotter behaves slightly differently

### Proposed Solution Vision

Create a **configurable, component-based blotter system** with:

1. **Core Components**
   - Single, highly customizable base blotter component using AG-Grid
   - Reusable chart components
   - Other core trading UI components

2. **Design Mode Features**
   - Component Library Access via OpenFin dock's 'Tools' dropdown
   - Runtime Configuration with immediate preview
   - Save configured components as reusable workspace views

3. **Configuration Management**
   - Sophisticated backend service for configuration storage
   - Version control and permissions management
   - Configuration sharing across users/teams

4. **Workspace Integration**
   - Saved views appear in OpenFin dock's apps menu
   - Template system for common trading scenarios
   - Cross-window configuration synchronization

---

## Current State Analysis

### AGV3 Architecture Assessment

Based on analysis of the comprehensive architecture document, the current AGV3 implementation demonstrates:

**Strengths:**
- Modern React 18 + TypeScript architecture
- Modular hook-based design (64% code reduction achieved)
- Professional component separation
- Enterprise-grade performance (sub-50ms updates)
- Comprehensive feature set

**Identified Complexity Issues:**
- Multiple data flow patterns (STOMP, SharedWorker, Direct)
- Complex configuration management system
- Heavy OpenFin platform integration
- Extensive customization layers creating maintenance overhead

**Key Findings:**
- The current implementation has evolved into a sophisticated but complex system
- **1,262-line DataGridStomp component** demonstrates the monolithic nature
- Multiple abstraction layers creating unnecessary complexity
- Over-engineering in some areas (50+ functions in expression language)

---

## Architectural Vision

### AGV3-Next: Trading Blotter Platform

**Core Philosophy: Single Configurable System**

Replace 40+ individual applications with one highly configurable blotter platform that can be configured to represent any blotter type through runtime configuration.

### Clean Architecture Principles

#### 1. Separation of Concerns
```
├── Domain Layer (Business Logic)
│   ├── entities/ - Core data models
│   ├── services/ - Business operations  
│   └── contracts/ - Interface definitions
├── Application Layer (Use Cases)
│   ├── queries/ - Data retrieval
│   ├── commands/ - Data modification
│   └── handlers/ - Business workflows
├── Infrastructure Layer (External Dependencies)
│   ├── dataProviders/ - Multi-protocol data adapters
│   ├── storage/ - Persistence
│   └── openfin/ - Platform integration
└── Presentation Layer (UI Components)
    ├── components/ - Reusable UI elements
    ├── pages/ - Route components
    └── hooks/ - UI state management
```

#### 2. Technology Stack
- **React 18** with Concurrent Features
- **TypeScript 5.0+** with strict mode
- **Vite** for build tooling
- **Zustand** for state management (lighter than Redux)
- **React Query** for server state
- **AG-Grid Enterprise** (maintained)
- **Tailwind CSS** + **shadcn/ui** (maintained)

#### 3. Key Design Decisions
- **Minimal Abstractions** - Direct service calls, no complex middleware
- **Performance First** - Optimized for real-time trading data
- **Single Responsibility** - Each component has one clear purpose
- **Progressive Enhancement** - Start simple, add complexity only when needed

---

## Multi-Protocol Data Provider Architecture

### Problem Statement
Trading blotters need to connect to various data providers:
- Socket.IO connections
- Raw WebSocket connections  
- STOMP servers (WebSocket-based)
- REST endpoints (with polling/SSE)

### Solution: Unified Data Adapter Pattern

#### Core Interface Design
```typescript
interface IDataProvider {
  // Lifecycle management
  connect(): Promise<void>;
  disconnect(): void;
  
  // Data operations
  subscribe(providerId: string, config: DataProviderConfig): Promise<void>;
  unsubscribe(providerId: string): Promise<void>;
  getSnapshot(providerId: string): Promise<any[]>;
  getStatus(providerId: string): Promise<any>;
  
  // State management
  isConnected(): boolean;
  
  // Event handling
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}
```

#### Protocol-Specific Implementations

**Using Existing STOMP as Template:**
The current STOMP implementation provides excellent patterns:
- SharedWorker architecture for resource sharing
- Event-driven communication
- Request/response pattern with timeouts
- Proper lifecycle management
- Comprehensive error handling

**Extended Implementations:**
1. **SocketIOProvider** - Extends STOMP pattern for Socket.IO protocol
2. **WebSocketProvider** - Raw WebSocket implementation using same patterns
3. **RestProvider** - REST API with polling/SSE support
4. **StompProvider** - Existing implementation becomes part of unified system

#### Data Provider Factory
```typescript
export class DataProviderFactory {
  static create(config: DataProviderConfig): IDataProvider {
    switch (config.type) {
      case 'stomp': return new StompProvider(config);
      case 'socket.io': return new SocketIOProvider(config);
      case 'websocket': return new WebSocketProvider(config);
      case 'rest': return new RestProvider(config);
      default: throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }
}
```

#### Unified Hook Interface
```typescript
// Generalized version of existing useSharedWorkerConnection
export function useDataProvider(
  selectedProviderId: string | null,
  gridApiRef?: React.MutableRefObject<any>
): UseDataProviderResult {
  // Same patterns as existing STOMP implementation
  // but works with any protocol
}
```

### Key Benefits
- **Protocol Flexibility** - Support all existing connections without migration
- **Consistent Interface** - Same API across all protocol types
- **Trading Optimizations** - Conflation, latency tracking, failover support
- **Zero Breaking Changes** - Existing STOMP blotters continue working unchanged

---

## Centralized Configuration Management

### Problem Statement
When blotters are hosted across different OpenFin workspace views during development, configuration management becomes fragmented:
- Components served from different origins
- Each origin saves to its own localStorage
- No unified configuration management
- Configuration sharing impossible across views

### Solution Options: Two Architectural Approaches

#### Option 1: IAB-Based Centralized Configuration (Initial Design)

This approach uses OpenFin's Inter-Application Bus for cross-origin configuration management.

#### Option 2: REST Service Configuration Management (Recommended Alternative)

**Date Added**: 2025-01-14  
**Rationale**: REST service provides more robust, scalable, and environment-flexible configuration management

This approach uses a dedicated REST service that adapts storage backend based on environment:
- **Development Mode**: SQLite database for simplicity and portability  
- **Production Mode**: MongoDB for scalability and enterprise features

### REST Service Configuration Architecture

#### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration REST Service               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Layer                              │   │
│  │  - Express.js REST endpoints                        │   │
│  │  - CRUD operations: GET, POST, PUT, DELETE          │   │
│  │  - Authentication & authorization                   │   │
│  │  - Input validation & sanitization                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                   │   │
│  │  - Configuration validation                         │   │
│  │  - Version management                               │   │
│  │  - Permission checking                              │   │
│  │  - Data transformation                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Data Access Layer                      │   │
│  │  - Environment-specific adapters                   │   │
│  │  - SQLite (Development)                            │   │
│  │  - MongoDB (Production)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP REST API
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌───▼────┐              ┌────▼────┐              ┌────▼────┐
│View A  │              │ View B  │              │ View C  │
│Origin 1│              │Origin 2 │              │Origin 3 │
│        │              │         │              │         │
│Config  │              │Config   │              │Config   │
│Client  │              │Client   │              │Client   │
└────────┘              └─────────┘              └─────────┘
```

#### REST API Design

**Base URL**: `http://localhost:3001/api/v1/configurations` (development)

**Endpoints:**
```typescript
// CRUD Operations
GET    /configurations              // List all configurations (with filtering)
GET    /configurations/:id          // Get specific configuration
POST   /configurations              // Create new configuration  
PUT    /configurations/:id          // Update existing configuration
DELETE /configurations/:id          // Delete configuration

// Advanced Operations
GET    /configurations/templates    // Get template configurations
GET    /configurations/shared       // Get shared configurations
POST   /configurations/:id/share    // Share configuration with users/teams
POST   /configurations/:id/copy     // Create copy of configuration
GET    /configurations/history/:id  // Get configuration version history
```

**Request/Response Examples:**
```typescript
// Create Configuration
POST /api/v1/configurations
{
  "name": "Trading Blotter - USD Bonds",
  "componentType": "blotter",
  "blotterType": "trading",
  "dataProvider": {
    "type": "socket.io",
    "url": "wss://trading-server.com",
    "options": { "namespace": "/bonds" }
  },
  "columns": [...],
  "filters": [...],
  "gridOptions": {...}
}

// Response
{
  "success": true,
  "data": {
    "id": "cfg-12345",
    "name": "Trading Blotter - USD Bonds",
    "version": 1,
    "createdAt": "2025-01-14T10:30:00Z",
    // ... full configuration
  }
}
```

#### Environment-Specific Storage Implementation

**Development Storage (SQLite):**
```typescript
// src/services/storage/SQLiteStorage.ts
export class SQLiteStorage implements IConfigurationStorage {
  private db: sqlite3.Database;

  constructor(dbPath: string = './config.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        component_type TEXT NOT NULL,
        blotter_type TEXT,
        data_provider TEXT,
        columns TEXT,
        filters TEXT,
        grid_options TEXT,
        version INTEGER DEFAULT 1,
        is_template BOOLEAN DEFAULT FALSE,
        is_shared BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        updated_by TEXT
      )
    `);

    // Create indexes for efficient querying
    this.db.run('CREATE INDEX IF NOT EXISTS idx_component_type ON configurations(component_type)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_blotter_type ON configurations(blotter_type)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_created_by ON configurations(created_by)');
  }

  async save(config: BlotterConfiguration): Promise<BlotterConfiguration> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO configurations 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        config.id,
        config.name,
        config.componentType,
        config.blotterType,
        JSON.stringify(config.dataProvider),
        JSON.stringify(config.columns),
        JSON.stringify(config.filters),
        JSON.stringify(config.gridOptions),
        config.version,
        config.isTemplate,
        config.isShared,
        config.createdAt.toISOString(),
        config.updatedAt.toISOString(),
        config.createdBy,
        config.updatedBy
      ], function(err) {
        if (err) reject(err);
        else resolve(config);
      });

      stmt.finalize();
    });
  }

  async findById(id: string): Promise<BlotterConfiguration | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM configurations WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? this.mapRowToConfig(row) : null);
        }
      );
    });
  }

  async findAll(query?: ConfigurationQuery): Promise<BlotterConfiguration[]> {
    let sql = 'SELECT * FROM configurations WHERE 1=1';
    const params: any[] = [];

    if (query?.componentType) {
      sql += ' AND component_type = ?';
      params.push(query.componentType);
    }

    if (query?.blotterType) {
      sql += ' AND blotter_type = ?';
      params.push(query.blotterType);
    }

    if (query?.userId) {
      sql += ' AND created_by = ?';
      params.push(query.userId);
    }

    sql += ' ORDER BY updated_at DESC';

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.mapRowToConfig(row)));
      });
    });
  }

  private mapRowToConfig(row: any): BlotterConfiguration {
    return {
      id: row.id,
      name: row.name,
      componentType: row.component_type,
      blotterType: row.blotter_type,
      dataProvider: JSON.parse(row.data_provider),
      columns: JSON.parse(row.columns),
      filters: JSON.parse(row.filters),
      gridOptions: JSON.parse(row.grid_options),
      version: row.version,
      isTemplate: row.is_template,
      isShared: row.is_shared,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}
```

**Production Storage (MongoDB):**
```typescript
// src/services/storage/MongoStorage.ts
export class MongoStorage implements IConfigurationStorage {
  private collection: Collection<BlotterConfiguration>;

  constructor(connectionString: string) {
    const client = new MongoClient(connectionString);
    const db = client.db('agv3-configurations');
    this.collection = db.collection('configurations');
    this.createIndexes();
  }

  private async createIndexes() {
    await this.collection.createIndex({ componentType: 1 });
    await this.collection.createIndex({ blotterType: 1 });
    await this.collection.createIndex({ createdBy: 1 });
    await this.collection.createIndex({ isTemplate: 1 });
    await this.collection.createIndex({ isShared: 1 });
    await this.collection.createIndex({ updatedAt: -1 });
  }

  async save(config: BlotterConfiguration): Promise<BlotterConfiguration> {
    await this.collection.replaceOne(
      { id: config.id },
      config,
      { upsert: true }
    );
    return config;
  }

  async findById(id: string): Promise<BlotterConfiguration | null> {
    return await this.collection.findOne({ id });
  }

  async findAll(query?: ConfigurationQuery): Promise<BlotterConfiguration[]> {
    const filter: any = {};
    
    if (query?.componentType) filter.componentType = query.componentType;
    if (query?.blotterType) filter.blotterType = query.blotterType;
    if (query?.userId) filter.createdBy = query.userId;
    if (query?.isTemplate !== undefined) filter.isTemplate = query.isTemplate;
    if (query?.isShared !== undefined) filter.isShared = query.isShared;

    return await this.collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
```

#### Unified Storage Interface

**Key Architecture Principle**: Both SQLite and MongoDB implement the same interface, providing **identical functionality** regardless of database backend.

```typescript
// src/services/storage/IConfigurationStorage.ts
export interface IConfigurationStorage {
  // Basic CRUD Operations
  save(config: BlotterConfiguration): Promise<BlotterConfiguration>;
  findById(id: string): Promise<BlotterConfiguration | null>;
  findAll(query?: ConfigurationQuery): Promise<BlotterConfiguration[]>;
  delete(id: string): Promise<boolean>;
  
  // Advanced Query Operations
  findByComponentType(componentType: string): Promise<BlotterConfiguration[]>;
  findByBlotterType(blotterType: string): Promise<BlotterConfiguration[]>;
  findByUser(userId: string): Promise<BlotterConfiguration[]>;
  findTemplates(): Promise<BlotterConfiguration[]>;
  findShared(): Promise<BlotterConfiguration[]>;
  
  // Complex Filtering
  findByMultipleCriteria(criteria: {
    componentType?: string;
    blotterType?: string;
    userId?: string;
    isTemplate?: boolean;
    isShared?: boolean;
    nameContains?: string;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<BlotterConfiguration[]>;
  
  // Version Management
  findVersionHistory(configId: string): Promise<BlotterConfiguration[]>;
  saveVersion(config: BlotterConfiguration): Promise<BlotterConfiguration>;
  
  // Bulk Operations
  bulkSave(configs: BlotterConfiguration[]): Promise<BlotterConfiguration[]>;
  bulkDelete(ids: string[]): Promise<number>;
  
  // Statistics and Analytics
  getStatistics(): Promise<{
    totalConfigurations: number;
    configurationsByType: Record<string, number>;
    configurationsByBlotterType: Record<string, number>;
    recentlyUpdated: BlotterConfiguration[];
  }>;
}
```

#### Configuration Service Factory
```typescript
// src/services/storage/StorageFactory.ts
export class StorageFactory {
  static createStorage(): IConfigurationStorage {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'production') {
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/agv3';
      return new MongoStorage(mongoUrl);
    } else {
      const dbPath = process.env.SQLITE_PATH || './config.db';
      return new SQLiteStorage(dbPath);
    }
  }
}
```

#### Consistent Implementation Examples

**Both storage implementations provide identical methods:**

```typescript
// SQLite Implementation
export class SQLiteStorage implements IConfigurationStorage {
  // ... existing implementation ...
  
  async findByComponentType(componentType: string): Promise<BlotterConfiguration[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM configurations WHERE component_type = ? ORDER BY updated_at DESC',
        [componentType],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.mapRowToConfig(row)));
        }
      );
    });
  }

  async findByBlotterType(blotterType: string): Promise<BlotterConfiguration[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM configurations WHERE blotter_type = ? ORDER BY updated_at DESC',
        [blotterType],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.mapRowToConfig(row)));
        }
      );
    });
  }

  async findTemplates(): Promise<BlotterConfiguration[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM configurations WHERE is_template = 1 ORDER BY name ASC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => this.mapRowToConfig(row)));
        }
      );
    });
  }

  async findByMultipleCriteria(criteria: any): Promise<BlotterConfiguration[]> {
    let sql = 'SELECT * FROM configurations WHERE 1=1';
    const params: any[] = [];

    if (criteria.componentType) {
      sql += ' AND component_type = ?';
      params.push(criteria.componentType);
    }

    if (criteria.blotterType) {
      sql += ' AND blotter_type = ?';
      params.push(criteria.blotterType);
    }

    if (criteria.userId) {
      sql += ' AND created_by = ?';
      params.push(criteria.userId);
    }

    if (criteria.isTemplate !== undefined) {
      sql += ' AND is_template = ?';
      params.push(criteria.isTemplate ? 1 : 0);
    }

    if (criteria.isShared !== undefined) {
      sql += ' AND is_shared = ?';
      params.push(criteria.isShared ? 1 : 0);
    }

    if (criteria.nameContains) {
      sql += ' AND name LIKE ?';
      params.push(`%${criteria.nameContains}%`);
    }

    if (criteria.createdAfter) {
      sql += ' AND created_at >= ?';
      params.push(criteria.createdAfter.toISOString());
    }

    if (criteria.createdBefore) {
      sql += ' AND created_at <= ?';
      params.push(criteria.createdBefore.toISOString());
    }

    sql += ' ORDER BY updated_at DESC';

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.mapRowToConfig(row)));
      });
    });
  }

  async getStatistics(): Promise<any> {
    return new Promise((resolve, reject) => {
      const stats = {
        totalConfigurations: 0,
        configurationsByType: {},
        configurationsByBlotterType: {},
        recentlyUpdated: []
      };

      // Get total count
      this.db.get('SELECT COUNT(*) as total FROM configurations', (err, row) => {
        if (err) reject(err);
        stats.totalConfigurations = row.total;

        // Get configurations by type
        this.db.all(
          'SELECT component_type, COUNT(*) as count FROM configurations GROUP BY component_type',
          (err, rows) => {
            if (err) reject(err);
            rows.forEach(row => {
              stats.configurationsByType[row.component_type] = row.count;
            });

            // Get recently updated (last 7 days)
            this.db.all(
              'SELECT * FROM configurations WHERE updated_at >= ? ORDER BY updated_at DESC LIMIT 10',
              [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()],
              (err, rows) => {
                if (err) reject(err);
                stats.recentlyUpdated = rows.map(row => this.mapRowToConfig(row));
                resolve(stats);
              }
            );
          }
        );
      });
    });
  }

  async bulkSave(configs: BlotterConfiguration[]): Promise<BlotterConfiguration[]> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO configurations 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        for (const config of configs) {
          stmt.run([
            config.id, config.name, config.componentType, config.blotterType,
            JSON.stringify(config.dataProvider), JSON.stringify(config.columns),
            JSON.stringify(config.filters), JSON.stringify(config.gridOptions),
            config.version, config.isTemplate, config.isShared,
            config.createdAt.toISOString(), config.updatedAt.toISOString(),
            config.createdBy, config.updatedBy
          ]);
        }

        this.db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve(configs);
        });
      });

      stmt.finalize();
    });
  }
}

// MongoDB Implementation - Identical interface
export class MongoStorage implements IConfigurationStorage {
  // ... existing implementation ...

  async findByComponentType(componentType: string): Promise<BlotterConfiguration[]> {
    return await this.collection
      .find({ componentType })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async findByBlotterType(blotterType: string): Promise<BlotterConfiguration[]> {
    return await this.collection
      .find({ blotterType })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async findTemplates(): Promise<BlotterConfiguration[]> {
    return await this.collection
      .find({ isTemplate: true })
      .sort({ name: 1 })
      .toArray();
  }

  async findByMultipleCriteria(criteria: any): Promise<BlotterConfiguration[]> {
    const filter: any = {};
    
    if (criteria.componentType) filter.componentType = criteria.componentType;
    if (criteria.blotterType) filter.blotterType = criteria.blotterType;
    if (criteria.userId) filter.createdBy = criteria.userId;
    if (criteria.isTemplate !== undefined) filter.isTemplate = criteria.isTemplate;
    if (criteria.isShared !== undefined) filter.isShared = criteria.isShared;
    
    if (criteria.nameContains) {
      filter.name = { $regex: criteria.nameContains, $options: 'i' };
    }

    if (criteria.createdAfter || criteria.createdBefore) {
      filter.createdAt = {};
      if (criteria.createdAfter) filter.createdAt.$gte = criteria.createdAfter;
      if (criteria.createdBefore) filter.createdAt.$lte = criteria.createdBefore;
    }

    return await this.collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async getStatistics(): Promise<any> {
    const [
      totalConfigurations,
      configurationsByType,
      configurationsByBlotterType,
      recentlyUpdated
    ] = await Promise.all([
      this.collection.countDocuments({}),
      
      this.collection.aggregate([
        { $group: { _id: '$componentType', count: { $sum: 1 } } }
      ]).toArray(),
      
      this.collection.aggregate([
        { $group: { _id: '$blotterType', count: { $sum: 1 } } }
      ]).toArray(),
      
      this.collection
        .find({ 
          updatedAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .toArray()
    ]);

    return {
      totalConfigurations,
      configurationsByType: Object.fromEntries(
        configurationsByType.map(item => [item._id, item.count])
      ),
      configurationsByBlotterType: Object.fromEntries(
        configurationsByBlotterType.map(item => [item._id, item.count])
      ),
      recentlyUpdated
    };
  }

  async bulkSave(configs: BlotterConfiguration[]): Promise<BlotterConfiguration[]> {
    const operations = configs.map(config => ({
      replaceOne: {
        filter: { id: config.id },
        replacement: config,
        upsert: true
      }
    }));

    await this.collection.bulkWrite(operations);
    return configs;
  }
}
```

### REST API Provides Identical Functionality Regardless of Database

**Key Answer to Your Question**: YES! The REST service provides **100% identical functionality** whether using SQLite or MongoDB. The client never knows which database is being used.

#### Enhanced REST API Endpoints

The REST API exposes all storage functionality through consistent HTTP endpoints:

```typescript
// Basic CRUD - Works identically with both databases
GET    /api/v1/configurations                    // List all configurations
GET    /api/v1/configurations/:id                // Get specific configuration
POST   /api/v1/configurations                    // Create new configuration  
PUT    /api/v1/configurations/:id                // Update configuration
DELETE /api/v1/configurations/:id                // Delete configuration

// Advanced Query Endpoints - Identical functionality
GET    /api/v1/configurations?componentType=blotter
GET    /api/v1/configurations?blotterType=trading
GET    /api/v1/configurations?userId=trader123
GET    /api/v1/configurations?isTemplate=true
GET    /api/v1/configurations?isShared=true

// Complex Filtering - Same on both databases
GET    /api/v1/configurations/search?nameContains=USD&blotterType=trading&createdAfter=2025-01-01

// Templates and Shared Configs
GET    /api/v1/configurations/templates           // Get all template configurations
GET    /api/v1/configurations/shared             // Get all shared configurations
GET    /api/v1/configurations/user/:userId       // Get user's configurations

// Analytics and Statistics
GET    /api/v1/configurations/statistics         // Usage statistics
GET    /api/v1/configurations/recent             // Recently updated configs

// Bulk Operations
POST   /api/v1/configurations/bulk               // Bulk create/update
DELETE /api/v1/configurations/bulk               // Bulk delete

// Version History
GET    /api/v1/configurations/:id/history        // Get version history
POST   /api/v1/configurations/:id/version        // Save new version
```

#### Example Usage - Database Agnostic

```typescript
// Client code works identically regardless of backend database
const configClient = new RestConfigurationClient();

// Create configuration - works with SQLite or MongoDB
const newConfig = await configClient.createConfiguration({
  name: "EUR Trading Blotter",
  componentType: "blotter",
  blotterType: "trading",
  dataProvider: { type: "socket.io", url: "wss://eur-server.com" },
  columns: [...],
  filters: [...]
});

// Complex search - identical functionality on both databases
const searchResults = await configClient.searchConfigurations({
  nameContains: "EUR",
  blotterType: "trading",
  isTemplate: false,
  createdAfter: new Date('2025-01-01')
});

// Get statistics - same data structure from both databases
const stats = await configClient.getStatistics();
// Returns: { totalConfigurations: 150, configurationsByType: {...}, ... }

// Bulk operations - works identically
await configClient.bulkSave([config1, config2, config3]);
```

#### Database-Agnostic Client Implementation

```typescript
// The client has no knowledge of which database is used
export class RestConfigurationClient {
  // All methods work identically regardless of backend
  
  async searchConfigurations(criteria: {
    componentType?: string;
    blotterType?: string;
    userId?: string;
    isTemplate?: boolean;
    nameContains?: string;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<BlotterConfiguration[]> {
    const params = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.httpClient.get(
      `/configurations/search?${params.toString()}`
    );
    return response.data.data;
  }

  async getTemplates(): Promise<BlotterConfiguration[]> {
    const response = await this.httpClient.get('/configurations/templates');
    return response.data.data;
  }

  async getSharedConfigurations(): Promise<BlotterConfiguration[]> {
    const response = await this.httpClient.get('/configurations/shared');
    return response.data.data;
  }

  async getUserConfigurations(userId: string): Promise<BlotterConfiguration[]> {
    const response = await this.httpClient.get(`/configurations/user/${userId}`);
    return response.data.data;
  }

  async getStatistics(): Promise<ConfigurationStatistics> {
    const response = await this.httpClient.get('/configurations/statistics');
    return response.data.data;
  }

  async bulkSave(configs: BlotterConfiguration[]): Promise<BlotterConfiguration[]> {
    const response = await this.httpClient.post('/configurations/bulk', { configurations: configs });
    return response.data.data;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.httpClient.delete('/configurations/bulk', { data: { ids } });
  }

  async getVersionHistory(configId: string): Promise<BlotterConfiguration[]> {
    const response = await this.httpClient.get(`/configurations/${configId}/history`);
    return response.data.data;
  }
}
```

### Key Benefits of Database Abstraction

1. **Seamless Environment Switching**: 
   - Development uses SQLite automatically
   - Production uses MongoDB automatically
   - Zero code changes required

2. **Identical Feature Set**:
   - All search/filter capabilities work the same
   - Same response formats and data structures
   - Same error handling patterns

3. **Performance Optimization Per Environment**:
   - SQLite optimized for development (single file, fast startup)
   - MongoDB optimized for production (clustering, indexing, scaling)

4. **Testing Consistency**:
   - Tests can run against SQLite for speed
   - Production confidence through identical interfaces

5. **Migration Safety**:
   - Can switch databases without application changes
   - Data migration tools work with same interface

#### Express.js REST Service Implementation
```typescript
// src/services/ConfigurationRestService.ts
export class ConfigurationRestService {
  private app: Express;
  private storage: IConfigurationStorage;

  constructor() {
    this.app = express();
    this.storage = StorageFactory.createStorage();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      credentials: true
    }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    const router = express.Router();

    // List configurations with filtering
    router.get('/configurations', async (req, res) => {
      try {
        const query: ConfigurationQuery = {
          componentType: req.query.componentType as string,
          blotterType: req.query.blotterType as string,
          userId: req.query.userId as string,
          isTemplate: req.query.isTemplate === 'true',
          isShared: req.query.isShared === 'true'
        };

        const configurations = await this.storage.findAll(query);
        res.json({ success: true, data: configurations });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Get specific configuration
    router.get('/configurations/:id', async (req, res) => {
      try {
        const configuration = await this.storage.findById(req.params.id);
        if (!configuration) {
          return res.status(404).json({ 
            success: false, 
            error: 'Configuration not found' 
          });
        }
        res.json({ success: true, data: configuration });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Create new configuration
    router.post('/configurations', async (req, res) => {
      try {
        const config: BlotterConfiguration = {
          ...req.body,
          id: req.body.id || generateId(),
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const savedConfig = await this.storage.save(config);
        res.status(201).json({ success: true, data: savedConfig });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Update existing configuration
    router.put('/configurations/:id', async (req, res) => {
      try {
        const existing = await this.storage.findById(req.params.id);
        if (!existing) {
          return res.status(404).json({ 
            success: false, 
            error: 'Configuration not found' 
          });
        }

        const updated = {
          ...existing,
          ...req.body,
          id: req.params.id, // Ensure ID doesn't change
          version: existing.version + 1,
          updatedAt: new Date()
        };

        const savedConfig = await this.storage.save(updated);
        res.json({ success: true, data: savedConfig });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Delete configuration
    router.delete('/configurations/:id', async (req, res) => {
      try {
        const deleted = await this.storage.delete(req.params.id);
        if (!deleted) {
          return res.status(404).json({ 
            success: false, 
            error: 'Configuration not found' 
          });
        }
        res.json({ success: true, message: 'Configuration deleted' });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    this.app.use('/api/v1', router);
  }

  start(port: number = 3001) {
    this.app.listen(port, () => {
      console.log(`Configuration service running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Storage: ${process.env.NODE_ENV === 'production' ? 'MongoDB' : 'SQLite'}`);
    });
  }
}
```

#### Client-Side Integration
```typescript
// src/services/configuration/RestConfigurationClient.ts
export class RestConfigurationClient {
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async createConfiguration(config: BlotterConfiguration): Promise<BlotterConfiguration> {
    const response = await this.httpClient.post('/configurations', config);
    return response.data.data;
  }

  async getConfiguration(id: string): Promise<BlotterConfiguration> {
    const response = await this.httpClient.get(`/configurations/${id}`);
    return response.data.data;
  }

  async updateConfiguration(id: string, updates: Partial<BlotterConfiguration>): Promise<BlotterConfiguration> {
    const response = await this.httpClient.put(`/configurations/${id}`, updates);
    return response.data.data;
  }

  async deleteConfiguration(id: string): Promise<void> {
    await this.httpClient.delete(`/configurations/${id}`);
  }

  async listConfigurations(query?: ConfigurationQuery): Promise<BlotterConfiguration[]> {
    const params = new URLSearchParams();
    if (query?.componentType) params.append('componentType', query.componentType);
    if (query?.blotterType) params.append('blotterType', query.blotterType);
    if (query?.userId) params.append('userId', query.userId);
    if (query?.isTemplate !== undefined) params.append('isTemplate', query.isTemplate.toString());

    const response = await this.httpClient.get(`/configurations?${params.toString()}`);
    return response.data.data;
  }
}
```

#### Updated React Hook
```typescript
// src/hooks/useConfiguration.ts - Updated for REST service
export function useConfiguration(query?: ConfigurationQuery): UseConfigurationResult {
  const [configurations, setConfigurations] = useState<BlotterConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use REST client instead of IAB client
  const client = useMemo(() => new RestConfigurationClient(), []);

  // All CRUD operations remain the same - just using HTTP instead of IAB
  const createConfiguration = useCallback(async (config: BlotterConfiguration): Promise<BlotterConfiguration> => {
    try {
      const newConfig = await client.createConfiguration(config);
      setConfigurations(prev => [...prev, newConfig]);
      return newConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create configuration';
      setError(errorMessage);
      throw err;
    }
  }, [client]);

  // ... rest of the implementation remains similar
}
```

### Comparison: IAB vs REST Service Approach

| Aspect | IAB Approach | REST Service Approach |
|--------|--------------|----------------------|
| **Complexity** | Medium - OpenFin specific | Low - Standard HTTP API |
| **Scalability** | Limited by IAB constraints | High - Standard web architecture |
| **Development** | SQLite not easily supported | SQLite perfect for development |
| **Production** | IndexedDB limitations | MongoDB enterprise features |
| **Testing** | OpenFin environment required | Standard HTTP testing tools |
| **Debugging** | OpenFin-specific tools | Standard web debugging |
| **Caching** | Complex IAB message caching | Standard HTTP caching (Redis, etc.) |
| **Security** | OpenFin identity-based | Standard HTTP auth (JWT, OAuth) |
| **Monitoring** | Limited IAB monitoring | Full HTTP monitoring/logging |
| **Backup/Recovery** | Complex IndexedDB backup | Standard database backup procedures |

### Recommended Architecture Decision

**Decision**: Use REST Service Configuration Management  
**Date**: 2025-01-14  
**Rationale**: 
- More robust and scalable architecture
- Environment-specific storage adaptation (SQLite → MongoDB)
- Standard HTTP tooling for development and debugging
- Enterprise-ready with proper database features
- Easier testing and monitoring
- Better alignment with microservices architecture

#### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    OpenFin Dock (Central Manager)          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        ConfigurationManager                         │   │
│  │  - Subscribes to 'agv3/config' IAB topic           │   │
│  │  - Handles all CRUD operations                      │   │
│  │  - Manages IndexedDB storage                        │   │
│  │  - Broadcasts configuration changes                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    IAB Topic: 'agv3/config'
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌───▼────┐              ┌────▼────┐              ┌────▼────┐
│View A  │              │ View B  │              │ View C  │
│Origin 1│              │Origin 2 │              │Origin 3 │
│Config  │              │Config   │              │Config   │
│Client  │              │Client   │              │Client   │
└────────┘              └─────────┘              └─────────┘
```

#### Key Components

**1. Dock Configuration Manager**
- Subscribes to IAB topic 'agv3/config'
- Handles all CRUD operations centrally
- Manages IndexedDB storage
- Broadcasts changes to all connected views
- Maintains subscriber registry

**2. Component Configuration Client**
- Lightweight client for each view/component
- Publishes requests to central manager
- Receives configuration change notifications
- Provides React hook interface

**3. Comprehensive Configuration Schema**

Based on the existing AGV3 implementation, we use the proven **Centralized Configuration Service Architecture** with a unified schema:

```typescript
// Universal Configuration Schema (supports any component with multiple versions)
interface UnifiedConfig {
  // === Identity ===
  configId: string;           // Unique identifier (UUID)
  appId: string;              // Application identifier
  userId: string;             // User who owns this config
  
  // === Component Classification ===
  componentType: ComponentType;     // 'datasource' | 'grid' | 'profile' | 'workspace' | 'theme' | 'layout'
  componentSubType?: string;        // 'stomp' | 'rest' | 'default' | 'custom' | 'shared' | 'direct'
  
  // === Display ===
  name: string;               // User-friendly name
  description?: string;       // Optional description
  icon?: string;             // Optional icon identifier
  
  // === Configuration Data ===
  config: any;               // Component-specific current configuration
  settings: ConfigVersion[]; // Version history (profiles, themes, layouts, views, etc.)
  activeSetting: string;     // ID of active version
  
  // === Metadata ===
  tags?: string[];           // Searchable tags
  category?: string;         // Organizational category
  isShared?: boolean;        // Shared with other users
  isDefault?: boolean;       // System default
  isLocked?: boolean;        // Prevent modifications
  
  // === Audit ===
  createdBy: string;         // User ID who created
  lastUpdatedBy: string;     // User ID who last updated
  creationTime: Date;        // ISO timestamp
  lastUpdated: Date;         // ISO timestamp
  
  // === Soft Delete ===
  deletedAt?: Date;          // Soft delete timestamp
  deletedBy?: string;        // User who deleted
}

// Universal version structure for any component configuration variant
interface ConfigVersion {
  versionId: string;         // Unique version identifier (UUID)
  name: string;              // Version name (e.g., "Default", "Trading View", "Dark Theme")
  description?: string;      // Optional version description
  config: any;               // Version-specific configuration data
  createdTime: Date;         // Version creation timestamp
  updatedTime: Date;         // Version last update timestamp
  isActive: boolean;         // Whether this version is currently active
  metadata?: any;            // Version-specific metadata
}

// Universal Component Configuration Examples
interface DataGridConfiguration extends UnifiedConfig {
  componentType: 'grid';
  componentSubType: 'stomp' | 'websocket' | 'socketio' | 'rest';
  
  // Current active grid configuration
  config: {
    gridOptions: Record<string, any>;         // Current AG-Grid settings
    columnState: ColumnState[];              // Current column configuration
    filterState: FilterState;                // Current filters
    sortState: SortState[];                  // Current sorting
    dataProvider: DataProviderConfig;        // Current data source
    // ... other current grid state
  };
  
  // Grid "profiles" stored as ConfigVersion[]
  settings: ConfigVersion[];  // Each profile is a ConfigVersion
  activeSetting: string;      // versionId of active profile
}

interface ThemeConfiguration extends UnifiedConfig {
  componentType: 'theme';
  componentSubType: 'light' | 'dark' | 'custom';
  
  // Current active theme configuration
  config: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    // ... other current theme settings
  };
  
  // Theme "variations" stored as ConfigVersion[]
  settings: ConfigVersion[];  // Each theme is a ConfigVersion
  activeSetting: string;      // versionId of active theme
}

interface WorkspaceConfiguration extends UnifiedConfig {
  componentType: 'workspace';
  componentSubType: 'default' | 'custom';
  
  // Current active workspace layout
  config: {
    windowLayout: WindowLayout;
    dockConfiguration: DockConfig;
    // ... other workspace settings
  };
  
  // Workspace "views" stored as ConfigVersion[]
  settings: ConfigVersion[];  // Each view is a ConfigVersion
  activeSetting: string;      // versionId of active view
}

interface LayoutConfiguration extends UnifiedConfig {
  componentType: 'layout';
  componentSubType: 'dashboard' | 'trading' | 'analysis';
  
  // Current active layout
  config: {
    panelArrangement: PanelConfig[];
    sizes: LayoutSizes;
    // ... other layout settings
  };
  
  // Layout "presets" stored as ConfigVersion[]
  settings: ConfigVersion[];  // Each layout is a ConfigVersion  
  activeSetting: string;      // versionId of active layout
}

// Configuration Filter System
interface ConfigurationFilter {
  // Component Filtering
  componentType?: string;              // Filter by component type
  componentSubType?: string;           // Filter by component subtype
  componentId?: string;                // Filter by specific component instance
  
  // OpenFin Context Filtering
  viewId?: string;                     // Filter by OpenFin view
  userId?: string;                     // Filter by user
  appId?: string;                      // Filter by application instance
  
  // Content Filtering
  name?: string;                       // Filter by configuration name
  isActive?: boolean;                  // Filter by active status
  includeDeleted?: boolean;            // Include soft-deleted configurations
}
```

#### CRUD Operations Over IAB
```typescript
// IAB Message Structure
interface ConfigurationIABMessage {
  operation: 'create' | 'read' | 'update' | 'delete' | 'list' | 'subscribe';
  requestId: string;
  senderId: string; // OpenFin view identity
  payload?: {
    id?: string;
    configuration?: BlotterConfiguration;
    updates?: Partial<BlotterConfiguration>;
  };
}
```

#### React Hook Integration
```typescript
export function useConfiguration(query?: ConfigurationQuery): UseConfigurationResult {
  const { configurations, loading, error, 
          createConfiguration, updateConfiguration, 
          deleteConfiguration } = useConfiguration();
  
  // Real-time updates from other views
  // Optimistic UI updates
  // Error handling and recovery
}
```

### Key Benefits
- **Origin-Agnostic** - Works regardless of component location
- **Real-Time Sync** - Changes propagate instantly across views
- **Conflict Resolution** - Proper versioning and conflict handling
- **Performance Optimized** - Efficient IndexedDB queries and IAB messaging
- **Scalable** - Handles hundreds of connected views

---

## OpenFin Platform Integration

### Cohesive Platform Architecture

Based on analysis of OpenFin React reference implementation patterns, AGV3-Next will implement:

#### Platform Provider Structure
```typescript
// Clean initialization pattern
export const PlatformProvider: React.FC = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializePlatform = async () => {
      // 1. Load platform settings from manifest
      const settings = await getManifestCustomSettings();
      
      // 2. Initialize workspace platform
      const platform = fin.Platform.getCurrentSync();
      
      // 3. Register window creation overrides
      platform.setWindowCreationOverride(createAGV3Window);

      // 4. Initialize workspace components
      await initializeWorkspace(settings);

      setInitialized(true);
    };

    document.addEventListener('DOMContentLoaded', initializePlatform);
  }, []);

  return initialized ? null : <LoadingSpinner />;
};
```

#### Window Management Strategy
```typescript
export class AGV3WindowManager {
  private windowTypes = new Map<string, WindowFactory>();

  constructor() {
    this.registerWindowTypes();
  }

  private registerWindowTypes() {
    this.windowTypes.set('data-grid', {
      url: '/data-grid',
      defaultOptions: { width: 1200, height: 800, resizable: true }
    });
    
    this.windowTypes.set('configuration', {
      url: '/configuration', 
      defaultOptions: { width: 600, height: 500, modal: true }
    });
  }

  async createWindow(type: string, options = {}) {
    const factory = this.windowTypes.get(type);
    const window = await fin.Window.create({
      ...factory.defaultOptions,
      ...options,
      url: `${window.location.origin}${factory.url}`
    });
    
    await this.setupWindowCommunication(window, type);
    return window;
  }
}
```

#### Component-to-Window Mapping
```typescript
// React Router integration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PlatformProvider />,
    children: [
      { path: '/data-grid', element: <DataGridPage /> },
      { path: '/configuration', element: <ConfigurationPage /> },
      { path: '/formatting', element: <ConditionalFormattingPage /> }
    ]
  }
]);
```

#### Workspace Integration
```typescript
// Initialize Dock with trading-specific actions
await fin.Workspace.Dock.register({
  id: 'agv3-dock',
  buttons: [
    {
      tooltip: 'New Data Grid',
      iconUrl: '/icons/data-grid.svg',
      action: { id: 'create-data-grid' }
    },
    {
      tooltip: 'Configuration',
      iconUrl: '/icons/settings.svg', 
      action: { id: 'open-configuration' }
    }
  ]
});
```

### OpenFin Workspace Service Wrapper

**Critical Architecture Component**: Lightweight React wrapper that provides OpenFin workspace services to components while keeping them clean and focused.

#### Service Wrapper Design

```typescript
// src/services/openfin/OpenFinWorkspaceProvider.tsx
export interface OpenFinWorkspaceServices {
  // Workspace Events
  onWorkspaceSaved: (callback: (workspace: WorkspaceSnapshot) => void) => () => void;
  onWorkspaceLoaded: (callback: (workspace: WorkspaceSnapshot) => void) => () => void;
  onThemeChanged: (callback: (theme: ThemeInfo) => void) => () => void;
  onViewClosed: (callback: (viewId: string) => void) => () => void;
  onViewFocused: (callback: (viewId: string) => void) => () => void;
  
  // Workspace Management APIs
  renameCurrentView: (name: string) => Promise<void>;
  renameCurrentPage: (name: string) => Promise<void>;
  renameWorkspace: (name: string) => Promise<void>;
  saveCurrentWorkspace: () => Promise<void>;
  
  // Theme Services
  getCurrentTheme: () => Promise<string>;
  subscribeToThemeChanges: (callback: (theme: string) => void) => () => void;
  
  // Cross-View Communication
  broadcastToAllViews: (message: any, topic?: string) => Promise<void>;
  subscribeToMessages: (topic: string, callback: (message: any) => void) => () => void;
  
  // View Management
  getCurrentViewInfo: () => Promise<ViewInfo>;
  closeCurrentView: () => Promise<void>;
  maximizeCurrentView: () => Promise<void>;
}

export const OpenFinWorkspaceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [services, setServices] = useState<OpenFinWorkspaceServices | null>(null);

  useEffect(() => {
    const workspaceServices: OpenFinWorkspaceServices = {
      onWorkspaceSaved: (callback) => {
        const handler = (event: any) => callback(event.workspace);
        fin.Workspace.Platform.getCurrentSync().on('workspace-saved', handler);
        return () => fin.Workspace.Platform.getCurrentSync().off('workspace-saved', handler);
      },

      onThemeChanged: (callback) => {
        const handler = (event: any) => callback(event.theme);
        fin.Workspace.Platform.getCurrentSync().on('theme-changed', handler);
        return () => fin.Workspace.Platform.getCurrentSync().off('theme-changed', handler);
      },

      renameCurrentView: async (newName: string) => {
        const currentView = await fin.View.getCurrent();
        await currentView.updateOptions({ name: newName });
      },

      renameCurrentPage: async (newName: string) => {
        const platform = fin.Workspace.Platform.getCurrentSync();
        const page = await platform.getCurrentPage();
        await platform.updatePage({ ...page, title: newName });
      },

      broadcastToAllViews: async (message: any, topic = 'default') => {
        await fin.InterApplicationBus.publish(topic, message);
      },

      subscribeToMessages: (topic: string, callback: (message: any) => void) => {
        fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, callback);
        return () => fin.InterApplicationBus.unsubscribe({ uuid: '*' }, topic, callback);
      }
    };

    setServices(workspaceServices);
  }, []);

  return (
    <OpenFinWorkspaceContext.Provider value={services}>
      {children}
    </OpenFinWorkspaceContext.Provider>
  );
};
```

#### React Hook for Component Integration

```typescript
// src/hooks/useOpenFinWorkspace.ts
export function useOpenFinWorkspace() {
  const context = useContext(OpenFinWorkspaceContext);
  
  if (!context) {
    // Return mock services for non-OpenFin environments
    return createMockWorkspaceServices();
  }
  
  return context;
}
```

#### Clean Component Integration

```typescript
// Example: Blotter with workspace integration
export const ConfigurableBlotter = () => {
  const workspace = useOpenFinWorkspace();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Listen to theme changes from dock
    const unsubscribeTheme = workspace.onThemeChanged((themeInfo) => {
      setTheme(themeInfo.theme);
      updateBlotterTheme(themeInfo.theme);
    });

    // Auto-save when workspace is saved
    const unsubscribeWorkspace = workspace.onWorkspaceSaved(async (workspaceData) => {
      const blotterState = getCurrentBlotterState();
      await saveBlotterConfiguration({
        workspaceId: workspaceData.id,
        state: blotterState
      });
    });

    return () => {
      unsubscribeTheme();
      unsubscribeWorkspace();
    };
  }, [workspace]);

  const handleRenameTab = async (newName: string) => {
    await workspace.renameCurrentView(newName);
  };

  // Component stays clean and focused on business logic
  return (
    <div className={`blotter theme-${theme}`}>
      <BlotterToolbar onRename={handleRenameTab} />
      <DataGrid />
    </div>
  );
};
```

#### Key Architectural Benefits

1. **Clean Separation of Concerns**:
   - Blotter components focus purely on trading logic
   - OpenFin integration isolated in wrapper service
   - Easy to unit test components without OpenFin dependency

2. **Consistent Workspace Integration**:
   - All components get same workspace services
   - Standardized event handling patterns across all blotters
   - Common APIs for workspace operations (rename, theme, save)

3. **Development-Friendly**:
   - Mock services for non-OpenFin development environments
   - Easy to debug workspace interactions
   - Testable without requiring OpenFin runtime

4. **Event-Driven Architecture**:
   - Components react to workspace events (theme changes, saves)
   - Cross-view communication for data sharing
   - Automatic state synchronization with workspace lifecycle

5. **Enterprise Integration**:
   - Handles all OpenFin workspace events seamlessly
   - Provides workspace management APIs (rename, save, load)
   - Enables advanced features like cross-view data broadcasting

### Unified Dialog Template System

**Critical UI Architecture Component**: Standardized dialog templates for all customization interfaces (grid options, column groups, conditional formatting, etc.).

#### Problem with Current Implementation
The existing dialog implementations show inconsistency:
- Some dialogs use shadcn/ui `Dialog` component properly
- Others bypass the standard template
- Different button layouts and behaviors
- Inconsistent loading states and error handling
- No standardized OpenFin window integration

#### Standardized Dialog Template Architecture

```typescript
// src/components/common/StandardDialog.tsx
export interface StandardDialogProps {
  // Core dialog configuration
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  
  // Content and styling
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  
  // Actions and behavior
  actions?: DialogAction[];
  showDefaultActions?: boolean;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  
  // Advanced features
  loading?: boolean;
  hasUnsavedChanges?: boolean;
  closable?: boolean;
  
  // OpenFin integration - ALWAYS open tool components in core windows
  openInNewWindow?: boolean;
  windowOptions?: Partial<OpenFin.WindowOptions>;
  useOpenFinWindow?: boolean; // Default true for all tool components
}

export const StandardDialog: React.FC<StandardDialogProps> = ({
  open, onOpenChange, title, description, icon, children,
  size = 'md', actions, showDefaultActions = true,
  onSave, onCancel, loading = false, hasUnsavedChanges = false,
  openInNewWindow = false, windowOptions, useOpenFinWindow = true
}) => {
  // Unsaved changes warning
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure?');
      if (!confirmClose) return;
    }
    onOpenChange(false);
    onCancel?.();
  }, [hasUnsavedChanges, onOpenChange, onCancel]);

  // OpenFin window mode - DEFAULT for all tool components
  if (useOpenFinWindow || openInNewWindow) {
    return (
      <OpenFinCoreWindowDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        windowOptions={{
          frame: true,
          resizable: true,
          maximizable: true,
          minimizable: true,
          alwaysOnTop: false,
          showTaskbarIcon: true,
          ...windowOptions
        }}
      >
        {children}
      </OpenFinCoreWindowDialog>
    );
  }

  // Standard modal dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={getDialogSizeClasses(size)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}{title}
            {loading && <Spinner size="sm" />}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="dialog-content">
          {loading ? <LoadingSpinner /> : children}
        </div>

        <DialogFooter>
          {showDefaultActions ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={loading}>
                {loading ? <Spinner /> : 'Save'}
              </Button>
            </>
          ) : (
            actions?.map(action => (
              <Button key={action.id} {...action.props} onClick={action.onClick}>
                {action.loading ? <Spinner /> : action.label}
              </Button>
            ))
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Specialized Configuration Dialog Template

```typescript
// src/components/common/ConfigurationDialog.tsx
export interface ConfigurationDialogProps extends Omit<StandardDialogProps, 'children'> {
  configType: 'grid-options' | 'column-groups' | 'conditional-formatting' | 'calculated-columns';
  currentConfig?: any;
  onConfigChange?: (config: any) => void;
  onApply: (config: any) => void;
  
  // Advanced features
  showPreview?: boolean;
  previewData?: any[];
  templates?: ConfigurationTemplate[];
  onLoadTemplate?: (template: ConfigurationTemplate) => void;
  onSaveAsTemplate?: (name: string) => void;
}

export const ConfigurationDialog: React.FC<ConfigurationDialogProps> = ({
  configType, currentConfig, onConfigChange, onApply,
  showPreview = false, previewData, templates, ...dialogProps
}) => {
  const [localConfig, setLocalConfig] = useState(currentConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const renderConfigEditor = () => {
    switch (configType) {
      case 'grid-options':
        return <GridOptionsEditor config={localConfig} onChange={handleConfigChange} />;
      case 'column-groups':
        return <ColumnGroupEditor config={localConfig} onChange={handleConfigChange} />;
      case 'conditional-formatting':
        return <ConditionalFormattingEditor config={localConfig} onChange={handleConfigChange} />;
      case 'calculated-columns':
        return <CalculatedColumnsEditor config={localConfig} onChange={handleConfigChange} />;
    }
  };

  const handleConfigChange = (config: any) => {
    setLocalConfig(config);
    setHasChanges(true);
    onConfigChange?.(config);
  };

  return (
    <StandardDialog
      {...dialogProps}
      hasUnsavedChanges={hasChanges}
      onSave={async () => {
        await onApply(localConfig);
        setHasChanges(false);
      }}
      size="xl"
    >
      <div className="configuration-dialog-content">
        {templates && (
          <div className="template-toolbar">
            <TemplateSelector templates={templates} onSelect={onLoadTemplate} />
          </div>
        )}

        <div className={cn('configuration-content', showPreview && 'with-preview')}>
          <div className="configuration-editor">
            {renderConfigEditor()}
          </div>
          
          {showPreview && (
            <div className="configuration-preview">
              <ConfigurationPreview
                configType={configType}
                config={localConfig}
                previewData={previewData}
              />
            </div>
          )}
        </div>
      </div>
    </StandardDialog>
  );
};
```

#### OpenFin Window Dialog Integration

```typescript
// src/components/common/OpenFinCoreWindowDialog.tsx
export interface OpenFinCoreWindowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  windowOptions?: Partial<OpenFin.WindowOptions>;
}

export const OpenFinCoreWindowDialog: React.FC<OpenFinCoreWindowDialogProps> = ({
  open, onOpenChange, title, children, windowOptions = {}
}) => {
  const windowRef = useRef<OpenFin.Window | null>(null);

  useEffect(() => {
    if (open && !windowRef.current) {
      const createCoreWindow = async () => {
        // Core OpenFin window with full OS integration
        const window = await fin.Window.create({
          name: `tool-${Date.now()}`,
          url: `${window.location.origin}/tool/${encodeURIComponent(title)}`,
          
          // Core window properties - appears as separate application
          width: windowOptions.width || 1000,
          height: windowOptions.height || 700,
          minWidth: 600,
          minHeight: 400,
          
          // Core window behavior - NOT modal
          frame: true,              // OS window frame with title bar
          resizable: true,          // User can resize
          maximizable: true,        // Can be maximized
          minimizable: true,        // Can be minimized to taskbar
          alwaysOnTop: false,       // Normal window behavior
          showTaskbarIcon: true,    // Appears in taskbar/dock
          autoShow: true,          // Show immediately when created
          
          // Styling
          backgroundColor: '#ffffff',
          cornerRounding: undefined, // Use OS default corners
          
          // Override any custom options
          ...windowOptions
        });

        windowRef.current = window;
        
        // Handle window close
        window.addListener('closed', () => {
          windowRef.current = null;
          onOpenChange(false);
        });

        // Set window icon and other metadata if needed
        window.updateOptions({
          icon: `${window.location.origin}/favicon.ico`
        });
      };

      createCoreWindow().catch(console.error);
    } else if (!open && windowRef.current) {
      // Close window when dialog should close
      windowRef.current.close().catch(console.error);
      windowRef.current = null;
    }

    return () => {
      if (windowRef.current) {
        windowRef.current.close().catch(console.error);
      }
    };
  }, [open, onOpenChange, title, windowOptions]);

  return null; // Content renders in separate OpenFin core window
};
```

#### Usage Examples with Consistent Templates

```typescript
// All customization dialogs use the same patterns
export const BlotterDialogsContainer: React.FC = () => {
  return (
    <>
      {/* Grid Options Dialog */}
      <ConfigurationDialog
        open={showGridOptions}
        onOpenChange={setShowGridOptions}
        title="Grid Options"
        description="Customize grid appearance and behavior"
        icon={<Settings />}
        configType="grid-options"
        currentConfig={gridOptions}
        onApply={handleApplyGridOptions}
        showPreview={true}
        previewData={sampleData}
        templates={gridOptionsTemplates}
      />

      {/* Conditional Formatting - Opens in core OpenFin window by default */}
      <ConfigurationDialog
        open={showFormatting}
        onOpenChange={setShowFormatting}
        title="Conditional Formatting Tool"
        description="Create rules to format cells based on data"
        icon={<Palette />}
        configType="conditional-formatting"
        currentConfig={formattingRules}
        onApply={handleApplyFormatting}
        useOpenFinWindow={true} // Default behavior - opens in core window
        windowOptions={{ width: 1200, height: 800 }}
      />

      {/* Grid Options - Also opens in core OpenFin window */}
      <ConfigurationDialog
        open={showGridOptions}
        onOpenChange={setShowGridOptions}
        title="Grid Options Tool"
        description="Customize grid appearance and behavior"
        icon={<Settings />}
        configType="grid-options"
        currentConfig={gridOptions}
        onApply={handleApplyGridOptions}
        useOpenFinWindow={true} // Core window for all tools
        windowOptions={{ width: 900, height: 650 }}
      />

      {/* Column Groups - Core window for complex tools */}
      <ConfigurationDialog
        open={showColumnGroups}
        onOpenChange={setShowColumnGroups}
        title="Column Groups Tool"
        description="Organize columns into collapsible groups"
        icon={<Columns />}
        configType="column-groups"
        currentConfig={columnGroups}
        onApply={handleApplyColumnGroups}
        useOpenFinWindow={true}
        windowOptions={{ width: 1000, height: 700 }}
      />

      {/* Simple dialogs can remain as modals or open in core windows */}
      <StandardDialog
        open={showRename}
        onOpenChange={setShowRename}
        title="Rename View"
        icon={<Edit />}
        onSave={() => handleRename(newName)}
        size="sm"
        useOpenFinWindow={false} // Simple dialogs can stay as modals
      >
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
      </StandardDialog>
    </>
  );
};
```

#### Key Benefits of Unified Dialog System with Core Window Integration

1. **Consistent User Experience**: All tool dialogs follow the same interaction patterns
2. **Native OS Integration**: Tools appear as separate applications with taskbar icons
3. **Enhanced Productivity**: Users can work with multiple tools simultaneously
4. **Professional Appearance**: Core windows behave like native desktop applications
5. **Reduced Development Time**: Templates eliminate boilerplate code
6. **Built-in Best Practices**: Unsaved changes warnings, loading states, error handling
7. **Flexible Window Management**: Tools can be resized, minimized, maximized independently
8. **Advanced Features**: Template system, preview panes, action customization
9. **Theme Integration**: Automatic theme support across all dialogs
10. **Multi-Monitor Support**: Tools can be moved across multiple displays

---

## DataGridStompShared - Complete Feature Architecture

### Overview
Based on the current AGV3 implementation, **DataGridStompShared** is a comprehensive AG-Grid blotter component with extensive customization capabilities. It demonstrates the complete feature set that AGV3-Next must replicate.

### Core Architecture

#### Component Structure
```typescript
// Main component with modular hook-based architecture
const DataGridStompShared = () => {
  // Connection management
  const connection = useSharedWorkerConnection(selectedProviderId);
  const snapshot = useSnapshotData(connection);
  const config = useProviderConfig(selectedProviderId);
  
  // Grid state management
  const gridState = useGridState(gridApiRef, activeProfileData);
  const profiles = useProfileApplication(profileSystem);
  
  // Feature management hooks
  const columnGroups = useColumnGroupManagement(gridApi);
  const gridOptions = useGridOptionsManagement(optionsSystem);
  const dialogs = useDialogManagement({...});
  
  // UI management
  const viewTitle = useViewTitle(viewInstanceId);
  const theme = useThemeSync(appTheme);
  
  return (
    <div>
      <Toolbar {...toolbarProps} />
      <BusyIndicator {...busyProps} />
      <DataGrid {...gridProps} />
      <DialogsContainer {...dialogProps} />
    </div>
  );
};
```

#### Architectural Achievement
- **Before Refactoring**: 1,464 lines of monolithic code
- **After Refactoring**: 527-line main component + modular hooks
- **Improvement**: 64% code reduction while maintaining 100% functionality

### Complete Customization Dialog System

The component provides **5 comprehensive customization dialogs**, all accessible via the Settings dropdown menu:

#### 1. **Grid Options Dialog**
```typescript
// Route: /grid-options
// Window: 900×700 core OpenFin window
interface GridOptionsDialog {
  purpose: 'Configure 200+ AG-Grid settings with live preview';
  features: [
    'Real-time grid option changes',
    'Performance optimizations (batch updates)',
    'Category-based organization (Display, Interaction, Selection, etc.)',
    'Live preview with sample data',
    'Reset to defaults functionality',
    'Profile-based persistence'
  ];
  integration: 'Direct AG-Grid API calls with requestAnimationFrame optimization';
}
```

#### 2. **Column Groups Dialog**
```typescript
// Route: /column-groups  
// Window: 1000×700 core OpenFin window
interface ColumnGroupsDialog {
  purpose: 'Create and manage column groups with drag-and-drop organization';
  features: [
    'Visual column group editor with two-panel layout',
    'Drag-and-drop column assignment',
    'Group expand/collapse behavior configuration',
    'Column visibility control (open/closed/default states)',
    'Real-time preview with group structure visualization',
    'Grid-level storage with profile integration'
  ];
  storage: 'GridColumnGroupStorage - separate from profile for reusability';
  application: 'Applied via AG-Grid columnGroupShow properties';
}
```

#### 3. **Conditional Formatting Dialog**
```typescript
// Route: /conditional-formatting
// Window: 1200×800 core OpenFin window  
interface ConditionalFormattingDialog {
  purpose: 'Professional rule engine for cell/row/column formatting';
  features: [
    'Monaco Editor with custom AGV3 expression language',
    'Rule priority management with drag-and-drop reordering',
    'Multi-column scope selection',
    'Real-time preview with sample data',
    'CSS-based styling (background, text, borders)',
    'IntelliSense with 50+ built-in functions',
    'Keyboard shortcuts (Ctrl+Shift+C for columns, etc.)',
    'Resizable panels for optimal workspace usage'
  ];
  expressions: {
    syntax: '[ColumnName] + ${variableName} + IF(condition, true, false)',
    functions: ['SUM', 'AVG', 'IF', 'AND', 'OR', 'CONTAINS', 'DATE functions'],
    validation: 'Real-time syntax checking with error highlighting'
  };
  performance: 'CSS class-based application for speed';
}
```

#### 4. **Calculated Columns Dialog**
```typescript
// Route: /calculated-columns
// Window: 1200×800 core OpenFin window
interface CalculatedColumnsDialog {
  purpose: 'Create computed columns with formula expressions';
  features: [
    'Expression editor with IntelliSense',
    'Column type selection (string, number, date, boolean)',
    'Real-time formula validation',
    'Column insertion and positioning',
    'Value formatter configuration', 
    'Performance optimization with caching'
  ];
  integration: 'Dynamic column definition insertion into AG-Grid';
  storage: 'GridCalculatedColumnsStorage with profile persistence';
}
```

#### 5. **Expression Editor Dialog**
```typescript
// Embedded modal dialog
interface ExpressionEditorDialog {
  purpose: 'Standalone expression editor for testing and development';
  features: [
    'Full Monaco Editor with AGV3 language support',
    'Expression testing with sample data',
    'Function documentation and examples',
    'Syntax highlighting and auto-completion',
    'Copy/paste integration with other dialogs'
  ];
  usage: 'Testing expressions before applying in formatting or calculations';
}
```

### Dialog Architecture Patterns

#### OpenFin Dialog Service Integration
```typescript
// All dialogs use centralized OpenFin dialog service
interface DialogServiceUsage {
  pattern: 'Core OpenFin windows with full OS integration';
  features: [
    'Independent window lifecycle',
    'Taskbar icons for each dialog',  
    'Multi-monitor support',
    'Window state persistence',
    'Native resize/minimize/maximize',
    'Professional desktop application behavior'
  ];
  communication: 'Callback-based data exchange with parent component';
  cleanup: 'Automatic resource cleanup on window close';
}

// Example dialog opening pattern
const handleOpenGridOptions = async () => {
  await dialogService.openDialog({
    name: `grid-options-${viewInstanceId}`,
    route: '/grid-options',
    data: {
      options: currentGridOptions,
      profileName: activeProfileName
    },
    windowOptions: {
      defaultWidth: 900,
      defaultHeight: 700,
      frame: true,
      resizable: true,
      maximizable: true
    },
    onApply: (data) => {
      if (data?.options) {
        onApplyGridOptions(data.options);
      }
    }
  });
};
```

#### Storage Architecture
```typescript
interface DialogStorageStrategy {
  // Grid-level storage for reusable configurations
  gridLevel: {
    conditionalFormatting: 'GridConditionalFormattingStorage',
    columnGroups: 'GridColumnGroupStorage', 
    calculatedColumns: 'GridCalculatedColumnsStorage',
    purpose: 'Shared across profiles for reusability'
  };
  
  // Profile-level storage for active selections
  profileLevel: {
    activeRuleIds: 'Currently applied conditional formatting rules',
    activeGroupIds: 'Currently applied column groups',
    activeColumnIds: 'Currently applied calculated columns',
    gridOptions: 'Current AG-Grid configuration',
    purpose: 'Profile-specific active state'
  };
  
  synchronization: 'Real-time sync between dialogs and main component';
}
```

### User Experience Features

#### Toolbar Integration
```typescript
// Settings dropdown menu provides access to all dialogs
interface ToolbarSettingsMenu {
  location: 'Right side of toolbar in MoreVertical dropdown';
  menuItems: [
    { icon: 'Edit2', label: 'Rename View', action: 'onOpenRenameDialog' },
    { icon: 'Settings', label: 'Grid Options', action: 'onOpenGridOptions' },
    { icon: 'Layers', label: 'Column Groups', action: 'onOpenColumnGroups' },
    { icon: 'Code2', label: 'Expression Editor', action: 'onOpenExpressionEditor' },
    { icon: 'Palette', label: 'Conditional Formatting', action: 'onOpenConditionalFormatting' },
    { icon: 'FunctionSquare', label: 'Calculated Columns', action: 'onOpenCalculatedColumns' }
  ];
  accessibility: 'Full keyboard navigation and screen reader support';
}
```

#### Universal Version Management System Architecture

The UnifiedConfig schema provides a standardized approach for **any component** that needs multiple configuration versions/variants. The terminology adapts to the component context:

- **Grid Component**: "profiles" (different grid setups)
- **Theme Component**: "themes" (different color schemes) 
- **Workspace Component**: "views" (different workspace layouts)
- **Layout Component**: "layouts" (different panel arrangements)
- **Dashboard Component**: "settings" (different dashboard configurations)

```typescript
// Universal Version Management Pattern
interface ComponentVersionManagement extends UnifiedConfig {
  // Current active configuration (what user sees)
  config: any;  // Component-specific current state
  
  // Version history (profiles/themes/views/layouts/settings)
  settings: ConfigVersion[];  // Chronological array of versions
  
  // Active version identifier (NOT name, but versionId)
  activeSetting: string;      // UUID of active ConfigVersion
}

// Universal version structure for any configuration variant
interface ConfigVersion {
  versionId: string;         // Unique identifier (UUID)
  name: string;              // User-friendly name (e.g., "Default", "Trading Profile", "Dark Theme")
  description?: string;      // Optional description
  config: any;               // Version-specific configuration data
  createdTime: Date;         // Creation timestamp
  updatedTime: Date;         // Last update timestamp
  isActive: boolean;         // Currently active flag (redundant with activeSetting but useful)
  metadata?: {
    isReadOnly?: boolean;    // Default versions are read-only
    tags?: string[];         // Organization tags
    category?: string;       // Version category
    [key: string]: any;      // Component-specific metadata
  };
}

// DataGrid Profile Example using UnifiedConfig
interface DataGridWithProfiles extends UnifiedConfig {
  componentType: 'grid';
  componentSubType: 'stomp' | 'websocket' | 'socketio' | 'rest';
  
  // Current active grid state
  config: {
    gridOptions: Record<string, any>;
    columnState: ColumnState[];
    filterState: FilterState;
    sortState: SortState[];
    activeConditionalRuleIds: string[];
    activeColumnGroupIds: string[];
    activeCalculatedColumnIds: string[];
    dataProvider: DataProviderConfig;
  };
  
  // Grid profiles stored as ConfigVersion[]
  settings: ConfigVersion[]; // Each profile is a ConfigVersion
  activeSetting: string;     // versionId of active profile (NOT profile name)
}

// Universal Version Management Rules
interface UniversalVersionRules {
  versionOrdering: {
    rule: 'Chronological creation order (first created = index 0)';
    defaultVersion: 'Always first in settings array (index 0)';
    implementation: 'settings[0] must always be the "Default" version';
  };
  
  namingConstraints: {
    uniqueness: 'No two versions can have the same name within a component';
    validation: 'Version names are case-sensitive and must be unique';
    defaultName: 'Reserved name "Default" for the default version';
    restrictions: ['Cannot be empty', 'Maximum 50 characters', 'Alphanumeric plus - _ ( ) allowed'];
  };
  
  defaultVersion: {
    name: 'Default';
    position: 'Always settings[0]';
    behavior: 'Cannot be deleted, can be modified but not renamed';
    initialization: 'Created automatically with component defaults';
    versionId: 'Stable UUID, never changes';
  };
  
  operations: {
    create: 'Add new ConfigVersion to end of settings array';
    delete: 'Remove version (except Default), maintain chronological order';
    rename: 'Update ConfigVersion.name with uniqueness validation (except Default)';
    activate: 'Set activeSetting to versionId, copy config to main config';
    duplicate: 'Create new ConfigVersion with copied config + unique name';
  };
}
```

#### Optimized Version Management Implementation

```typescript
// Universal version manager for any component using UnifiedConfig
class UniversalVersionManager<T = any> {
  private config: UnifiedConfig;
  private versionLookup: Map<string, number> = new Map();  // versionId -> array index
  private nameLookup: Map<string, string> = new Map();     // name -> versionId
  
  constructor(config: UnifiedConfig) {
    this.config = config;
    this.rebuildLookupMaps();
  }
  
  // O(1) version existence check by ID
  hasVersion(versionId: string): boolean {
    return this.versionLookup.has(versionId);
  }
  
  // O(1) version existence check by name
  hasVersionName(name: string): boolean {
    return this.nameLookup.has(name);
  }
  
  // O(1) version retrieval by ID
  getVersion(versionId: string): ConfigVersion | null {
    const index = this.versionLookup.get(versionId);
    return index !== undefined ? this.config.settings[index] : null;
  }
  
  // O(1) version retrieval by name
  getVersionByName(name: string): ConfigVersion | null {
    const versionId = this.nameLookup.get(name);
    return versionId ? this.getVersion(versionId) : null;
  }
  
  // O(1) get active version
  getActiveVersion(): ConfigVersion | null {
    return this.getVersion(this.config.activeSetting);
  }
  
  // O(n) version creation (maintains chronological order)
  createVersion(name: string, config: T, description?: string): ConfigVersion {
    if (this.hasVersionName(name)) {
      throw new Error(`Version "${name}" already exists`);
    }
    
    const version: ConfigVersion = {
      versionId: this.generateUUID(),
      name,
      description,
      config,
      createdTime: new Date(),
      updatedTime: new Date(),
      isActive: false,
      metadata: {
        isReadOnly: false
      }
    };
    
    // Add to end (maintains chronological order)
    const index = this.config.settings.length;
    this.config.settings.push(version);
    
    // Update lookup maps
    this.versionLookup.set(version.versionId, index);
    this.nameLookup.set(version.name, version.versionId);
    
    return version;
  }
  
  // O(n) version deletion (maintains array integrity)  
  deleteVersion(versionId: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;
    
    if (version.name === 'Default') {
      throw new Error('Cannot delete Default version');
    }
    
    const index = this.versionLookup.get(versionId)!;
    
    // Remove from array
    this.config.settings.splice(index, 1);
    
    // If this was the active version, switch to Default
    if (this.config.activeSetting === versionId) {
      const defaultVersion = this.getVersionByName('Default');
      if (defaultVersion) {
        this.activateVersion(defaultVersion.versionId);
      }
    }
    
    // Rebuild lookup maps (indices have changed)
    this.rebuildLookupMaps();
    
    return true;
  }
  
  // O(1) version activation
  activateVersion(versionId: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;
    
    // Update active version
    const previousActive = this.getActiveVersion();
    if (previousActive) {
      previousActive.isActive = false;
    }
    
    version.isActive = true;
    this.config.activeSetting = versionId;
    
    // Copy version config to main config
    this.config.config = { ...version.config };
    
    return true;
  }
  
  // O(1) version rename
  renameVersion(versionId: string, newName: string): boolean {
    if (this.hasVersionName(newName)) {
      throw new Error(`Version name "${newName}" already exists`);
    }
    
    const version = this.getVersion(versionId);
    if (!version) return false;
    
    if (version.name === 'Default') {
      throw new Error('Cannot rename Default version');
    }
    
    // Update lookup maps
    this.nameLookup.delete(version.name);
    this.nameLookup.set(newName, versionId);
    
    // Update version
    version.name = newName;
    version.updatedTime = new Date();
    
    return true;
  }
  
  // Create duplicate version
  duplicateVersion(versionId: string, newName: string): ConfigVersion {
    const sourceVersion = this.getVersion(versionId);
    if (!sourceVersion) {
      throw new Error(`Version ${versionId} not found`);
    }
    
    return this.createVersion(
      newName,
      { ...sourceVersion.config }, // Deep copy config
      `Copy of ${sourceVersion.name}`
    );
  }
  
  // Rebuild lookup maps after array modifications
  private rebuildLookupMaps(): void {
    this.versionLookup.clear();
    this.nameLookup.clear();
    
    this.config.settings.forEach((version, index) => {
      this.versionLookup.set(version.versionId, index);
      this.nameLookup.set(version.name, version.versionId);
    });
  }
  
  // Get versions in chronological order (Default first)
  getVersionsInOrder(): ConfigVersion[] {
    return [...this.config.settings]; // Return copy to prevent external mutation
  }
  
  // Initialize with default version if none exists
  initializeDefaults(defaultConfig: T): void {
    if (this.config.settings.length === 0) {
      const defaultVersion = this.createVersion('Default', defaultConfig, 'Default configuration');
      defaultVersion.metadata!.isReadOnly = true;
      this.activateVersion(defaultVersion.versionId);
      
      // Ensure Default is always first
      if (this.config.settings[0] !== defaultVersion) {
        const index = this.config.settings.indexOf(defaultVersion);
        this.config.settings.splice(index, 1);
        this.config.settings.unshift(defaultVersion);
        this.rebuildLookupMaps();
      }
    }
  }
  
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

#### Universal Version Integration with REST Configuration Service

```typescript
interface UniversalVersionIntegration {
  storageLocation: {
    primary: 'UnifiedConfig.settings: ConfigVersion[]';
    activeVersion: 'UnifiedConfig.activeSetting: string (versionId)';
    currentState: 'UnifiedConfig.config: any (active configuration)';
    lookup: 'In-memory Maps for O(1) access performance';
  };
  
  synchronization: {
    autoSave: 'Version updates trigger UnifiedConfig.lastUpdated';
    crossWindow: 'Version changes broadcast via OpenFin IAB';
    conflictResolution: 'Last-write-wins with version timestamps';
    changeDetection: 'Deep comparison between config and active version';
  };
  
  initialization: {
    defaultVersion: 'Created automatically with component defaults';
    versionArray: 'Always initialized with Default version at settings[0]';
    activeVersion: 'Set to Default versionId on first component load';
    versionId: 'Stable UUID that never changes for Default version';
  };
  
  validation: {
    uniqueness: 'Version name uniqueness enforced within component';
    reserved: 'Default version name reserved and cannot be used for new versions';
    integrity: 'Default version always maintained at settings[0]';
    identifiers: 'activeSetting always references valid versionId in settings array';
  };
  
  universalApplication: {
    gridProfiles: 'DataGrid uses this pattern for user profile management';
    themeVariations: 'Theme component uses this for color scheme variants';
    workspaceViews: 'Workspace uses this for layout configurations';
    layoutPresets: 'Layout component uses this for panel arrangements';
    dashboardSettings: 'Dashboard uses this for configuration variants';
    anyComponent: 'Any component needing multiple configuration versions';
  };
}

// Usage examples for different component types
interface ComponentVersionExamples {
  // DataGrid profiles
  gridManager: {
    component: UniversalVersionManager<GridConfiguration>;
    terminology: 'profiles';
    examples: ['Default', 'Trading View', 'Analysis Mode', 'Compact View'];
  };
  
  // Theme variations
  themeManager: {
    component: UniversalVersionManager<ThemeConfiguration>;
    terminology: 'themes';
    examples: ['Default', 'Dark Mode', 'High Contrast', 'Trading Floor'];
  };
  
  // Workspace views
  workspaceManager: {
    component: UniversalVersionManager<WorkspaceConfiguration>;
    terminology: 'views';
    examples: ['Default', 'Multi-Monitor', 'Focus Mode', 'Presentation'];
  };
  
  // Layout presets
  layoutManager: {
    component: UniversalVersionManager<LayoutConfiguration>;
    terminology: 'layouts';
    examples: ['Default', 'Dashboard', 'Split Screen', 'Minimal'];
  };
}
```

### Performance Optimizations

#### Dialog Performance
- **Lazy Loading**: Dialogs only load when opened
- **Data Caching**: Configuration data cached to prevent repeated loads  
- **Batch Updates**: AG-Grid changes applied in batches via `requestAnimationFrame`
- **Memory Management**: Proper cleanup when dialogs close

#### Grid Performance
- **Incremental Updates**: Only changed configurations applied to AG-Grid
- **CSS Classes**: Conditional formatting uses CSS classes for speed
- **Transaction API**: Real-time data updates use `applyTransactionAsync`
- **Virtual Scrolling**: Large datasets handled efficiently

### Technical Integration Points

#### AG-Grid Integration
```typescript
interface AGGridIntegration {
  gridOptions: 'Direct setGridOption calls for 200+ settings';
  columnDefinitions: 'Dynamic column modification with calculated columns';
  styling: 'CSS class-based conditional formatting application';
  grouping: 'Column group definitions with columnGroupShow properties';
  events: 'Grid event handlers for user interactions and data changes';
}
```

#### OpenFin Integration
```typescript
interface OpenFinIntegration {
  windowManagement: 'Core OpenFin windows for all customization dialogs';
  stateSync: 'Cross-window configuration synchronization';
  viewIntegration: 'View-specific storage with viewInstanceId mapping';
  workspaceIntegration: 'Workspace snapshot inclusion for layouts';
}
```

### Key Architecture Insights for AGV3-Next

1. **Modular Dialog System**: Each customization feature is a separate, self-contained dialog
2. **Core Window Strategy**: All complex tools open in core OpenFin windows for professional UX
3. **Dual Storage Pattern**: Grid-level reusable configs + profile-level active selections
4. **Callback-Based Communication**: Clean data flow between dialogs and main component
5. **Performance-First Design**: Batch updates, caching, and efficient AG-Grid integration
6. **Professional UX**: Consistent icons, keyboard shortcuts, accessibility compliance

This architecture provides the blueprint for AGV3-Next's customization system, demonstrating how a unified platform can support extensive grid customization while maintaining clean architecture and professional user experience.

---

## Implementation Strategy

### Project Setup & Structure

#### Stern Project Structure
**Root Location**: `C:\Users\andyrao\Documents\projects\stern\`

```
stern/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
├── public/
│   ├── manifest.json          # OpenFin manifest
│   └── assets/
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Main application component
│   ├── router.tsx             # React Router configuration
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── common/           # Common application components
│   │   │   ├── StandardDialog.tsx
│   │   │   ├── ConfigurationDialog.tsx
│   │   │   └── OpenFinCoreWindowDialog.tsx
│   │   ├── blotter/          # Core blotter components
│   │   │   ├── UniversalBlotter.tsx
│   │   │   ├── Toolbar/
│   │   │   ├── DataGrid/
│   │   │   └── BusyIndicator.tsx
│   │   └── customization/    # Customization dialog components
│   │       ├── GridOptions/
│   │       ├── ConditionalFormatting/
│   │       ├── ColumnGroups/
│   │       └── CalculatedColumns/
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useUniversalVersionManager.ts
│   │   ├── useConfiguration.ts
│   │   ├── useDataProvider.ts
│   │   └── useOpenFinServices.ts
│   │
│   ├── services/             # Business logic services
│   │   ├── configuration/    # Configuration management
│   │   │   ├── ConfigurationService.ts
│   │   │   ├── UniversalVersionManager.ts
│   │   │   └── types.ts
│   │   ├── data-providers/   # Multi-protocol data providers
│   │   │   ├── base/
│   │   │   │   └── IDataProvider.ts
│   │   │   ├── StompProvider.ts
│   │   │   ├── WebSocketProvider.ts
│   │   │   ├── SocketIOProvider.ts
│   │   │   ├── RestProvider.ts
│   │   │   └── DataProviderFactory.ts
│   │   ├── storage/          # Data persistence
│   │   │   ├── SqliteStorage.ts
│   │   │   ├── MongoDbStorage.ts
│   │   │   └── IConfigurationStorage.ts
│   │   └── openfin/         # OpenFin platform integration
│   │       ├── OpenFinServiceProvider.ts
│   │       ├── DialogService.ts
│   │       └── WorkspaceManager.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── configuration.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── configuration.ts # UnifiedConfig and related types
│   │   ├── blotter.ts
│   │   ├── providers.ts
│   │   └── openfin.ts
│   │
│   └── styles/             # Global styles
│       ├── globals.css
│       ├── components.css
│       └── themes/
│
├── server/                 # REST Configuration Service
│   ├── package.json
│   ├── src/
│   │   ├── app.ts         # Express server setup
│   │   ├── routes/
│   │   │   └── configurations.ts
│   │   ├── services/
│   │   │   └── ConfigurationService.ts
│   │   ├── storage/
│   │   │   ├── SqliteStorage.ts
│   │   │   └── MongoDbStorage.ts
│   │   └── types/
│   │       └── configuration.ts
│   └── database/
│       └── schema.sql
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
└── scripts/               # Build and deployment scripts
    ├── build.js
    ├── deploy.js
    └── openfin-launch.js
```

#### Reference Implementation Extraction Plan

```typescript
// Components to extract and adapt from AGV3:
interface ExtractionPlan {
  // Phase 1: Core Infrastructure
  configurationService: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/services/configuration/';
    target: 'stern/src/services/configuration/';
    adaptations: ['Convert to UnifiedConfig schema', 'Add REST service integration'];
  };
  
  dataProviders: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/services/providers/StompDatasourceProvider.ts';
    target: 'stern/src/services/data-providers/';
    adaptations: ['Extract as template', 'Create WebSocket/SocketIO/REST variants'];
  };
  
  // Phase 2: Core Components  
  universalBlotter: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/';
    target: 'stern/src/components/blotter/UniversalBlotter.tsx';
    adaptations: ['Remove STOMP-specific code', 'Add data provider abstraction', 'Integrate UniversalVersionManager'];
  };
  
  hookSystem: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/windows/datagrid/components/DataGridStompShared/hooks/';
    target: 'stern/src/hooks/';
    adaptations: ['Make provider-agnostic', 'Add universal version management'];
  };
  
  // Phase 3: Advanced Features
  customizationDialogs: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/components/conditional-formatting/';
    target: 'stern/src/components/customization/';
    adaptations: ['Standardize with ConfigurationDialog template', 'Core window integration'];
  };
  
  openfinIntegration: {
    source: 'C:/Users/andyrao/Documents/projects/agv3/src/services/openfin/';
    target: 'stern/src/services/openfin/';
    adaptations: ['Clean up provider patterns', 'Standardize dialog service'];
  };
}
```

### Phased Approach

#### Phase 1: Foundation (Week 1-2)
**Project Setup & Core Infrastructure**
- [ ] Create Stern project structure at `C:\Users\andyrao\Documents\projects\stern\`
- [ ] Set up Vite + React + TypeScript + OpenFin development environment
- [ ] Extract and adapt UnifiedConfig schema from AGV3 reference
- [ ] Implement REST Configuration Service with SQLite support
- [ ] Extract and adapt ConfigurationService from `C:\Users\andyrao\Documents\projects\agv3\src\services\configuration\`
- [ ] Create UniversalVersionManager based on documented architecture

#### Phase 2: Data Providers (Week 3-4) 
**Multi-Protocol Data Provider System**
- [ ] Extract STOMP provider from `C:\Users\andyrao\Documents\projects\agv3\src\services\providers\StompDatasourceProvider.ts`
- [ ] Adapt as template for other protocols, creating IDataProvider interface
- [ ] Implement Socket.IO provider using STOMP pattern
- [ ] Implement WebSocket provider using STOMP pattern
- [ ] Implement REST provider using STOMP pattern
- [ ] Create DataProviderFactory with configuration-based selection

#### Phase 3: Core Blotter Component (Week 5-6)
**Universal Blotter Implementation**
- [ ] Extract DataGridStompShared from `C:\Users\andyrao\Documents\projects\agv3\src\windows\datagrid\components\DataGridStompShared\`
- [ ] Refactor to UniversalBlotter with provider abstraction  
- [ ] Extract and adapt modular hooks from `DataGridStompShared/hooks\`
- [ ] Integrate UniversalVersionManager for profile management
- [ ] Extract and adapt Toolbar component with provider selection
- [ ] Set up basic OpenFin integration patterns

#### Phase 4: Customization Dialog System (Week 7-9)
**Advanced Customization Features**
- [ ] Extract and adapt Conditional Formatting from `C:\Users\andyrao\Documents\projects\agv3\src\components\conditional-formatting\`
- [ ] Extract Column Groups system from `DataGridStompShared/columnGroups\`
- [ ] Extract Calculated Columns from `DataGridStompShared/calculatedColumns\`
- [ ] Extract Grid Options dialog patterns 
- [ ] Implement StandardDialog and ConfigurationDialog templates
- [ ] Integrate OpenFin core window dialog system from `C:\Users\andyrao\Documents\projects\agv3\src\services\openfin\OpenFinDialogService.ts`

#### Phase 5: Polish & Performance (Week 10-11)
**Production Ready**
- [ ] Performance optimization
- [ ] Error boundaries and recovery
- [ ] Accessibility compliance
- [ ] Comprehensive testing
- [ ] Documentation

#### Phase 6: Migration (Week 12)
**Gradual Migration Strategy**
- [ ] Create configuration presets for existing 40 blotters
- [ ] Side-by-side deployment
- [ ] User training and adoption
- [ ] Decommission old applications

### Migration Strategy

**Key Principles:**
1. **Zero Downtime** - New system runs alongside existing
2. **Gradual Migration** - Migrate one blotter type at a time
3. **Configuration Preservation** - Import existing blotter configurations
4. **User Choice** - Users can opt-in to new system
5. **Fallback Available** - Can revert to old system if needed

**Migration Steps:**
1. **Configuration Mapping** - Analyze existing 40 blotter configurations
2. **Template Creation** - Create configuration templates for each blotter type
3. **Data Migration Tools** - Build tools to import existing settings
4. **Pilot Program** - Start with 2-3 blotter types
5. **Gradual Rollout** - Add more blotter types based on feedback
6. **Full Migration** - Complete transition once all blotters supported

---

## REST Configuration Service Architecture

### Overview
Environment-adaptive REST service providing transparent configuration management with automatic storage backend selection based on deployment environment.

### Environment-Based Storage Selection

```typescript
// Environment-driven storage configuration
interface ConfigurationEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_TYPE?: 'sqlite' | 'mongodb';  // Optional override
  
  // SQLite Configuration (Development)
  SQLITE_DATABASE_PATH?: string;         // Default: './data/stern-configs.db'
  
  // MongoDB Configuration (Production)
  MONGODB_URI?: string;                  // Required for production
  MONGODB_DATABASE?: string;             // Default: 'stern-configurations'
  MONGODB_COLLECTION?: string;           // Default: 'configurations'
}

// Automatic storage selection logic
class StorageFactory {
  static createStorage(): IConfigurationStorage {
    const env = process.env.NODE_ENV || 'development';
    const override = process.env.DATABASE_TYPE;
    
    // Explicit override
    if (override === 'mongodb') return new MongoDbStorage();
    if (override === 'sqlite') return new SqliteStorage();
    
    // Environment-based selection
    switch (env) {
      case 'development':
      case 'test':
        return new SqliteStorage();
      case 'production':
        return new MongoDbStorage();
      default:
        return new SqliteStorage();
    }
  }
}
```

### Unified Storage Interface

```typescript
// Universal storage abstraction for both SQLite and MongoDB
interface IConfigurationStorage {
  // Basic CRUD Operations
  create(config: UnifiedConfig): Promise<UnifiedConfig>;
  findById(configId: string): Promise<UnifiedConfig | null>;
  update(configId: string, updates: Partial<UnifiedConfig>): Promise<UnifiedConfig>;
  delete(configId: string): Promise<boolean>;
  
  // Advanced Operations
  clone(sourceConfigId: string, newName: string, userId: string): Promise<UnifiedConfig>;
  
  // Query Operations with Multiple Criteria
  findByMultipleCriteria(criteria: ConfigurationFilter): Promise<UnifiedConfig[]>;
  findByAppId(appId: string): Promise<UnifiedConfig[]>;
  findByUserId(userId: string): Promise<UnifiedConfig[]>;
  findByComponentType(componentType: string, componentSubType?: string): Promise<UnifiedConfig[]>;
  
  // Pagination and Sorting
  findWithPagination(
    criteria: ConfigurationFilter,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedResult<UnifiedConfig>>;
  
  // Bulk Operations
  bulkCreate(configs: UnifiedConfig[]): Promise<UnifiedConfig[]>;
  bulkUpdate(updates: Array<{configId: string, updates: Partial<UnifiedConfig>}>): Promise<UnifiedConfig[]>;
  bulkDelete(configIds: string[]): Promise<boolean[]>;
  
  // Maintenance Operations
  cleanup(): Promise<void>;  // Remove soft-deleted records older than retention period
  healthCheck(): Promise<StorageHealthStatus>;
}

// Enhanced filter interface for complex queries
interface ConfigurationFilter {
  // Identity Filters
  configIds?: string[];           // Multiple config IDs
  appIds?: string[];              // Multiple app IDs
  userIds?: string[];             // Multiple user IDs
  
  // Component Classification Filters
  componentTypes?: string[];      // Multiple component types
  componentSubTypes?: string[];   // Multiple component subtypes
  
  // Content Filters
  nameContains?: string;          // Name contains text
  descriptionContains?: string;   // Description contains text
  tags?: string[];               // Must have all specified tags
  categories?: string[];         // Multiple categories
  
  // Boolean Filters
  isShared?: boolean;            // Shared configurations
  isDefault?: boolean;           // Default configurations
  isLocked?: boolean;            // Locked configurations
  includeDeleted?: boolean;      // Include soft-deleted records
  
  // Date Range Filters
  createdAfter?: Date;           // Created after date
  createdBefore?: Date;          // Created before date
  updatedAfter?: Date;           // Updated after date
  updatedBefore?: Date;          // Updated before date
  
  // Advanced Filters
  hasVersions?: boolean;         // Has versions in settings array
  activeSettingExists?: boolean; // Has valid activeSetting reference
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface StorageHealthStatus {
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastChecked: Date;
  responseTime: number;
  errorMessage?: string;
  storageType: 'sqlite' | 'mongodb';
}
```

### REST API Design

```typescript
// Express.js REST API routes
interface ConfigurationRESTAPI {
  // Basic CRUD Operations
  'POST /api/v1/configurations': {
    body: Omit<UnifiedConfig, 'configId' | 'creationTime' | 'lastUpdated'>;
    response: UnifiedConfig;
  };
  
  'GET /api/v1/configurations/:configId': {
    params: { configId: string };
    response: UnifiedConfig | { error: 'Configuration not found' };
  };
  
  'PUT /api/v1/configurations/:configId': {
    params: { configId: string };
    body: Partial<UnifiedConfig>;
    response: UnifiedConfig;
  };
  
  'DELETE /api/v1/configurations/:configId': {
    params: { configId: string };
    response: { success: boolean };
  };
  
  // Advanced Operations
  'POST /api/v1/configurations/:configId/clone': {
    params: { configId: string };
    body: { newName: string; userId: string };
    response: UnifiedConfig;
  };
  
  // Query Operations
  'GET /api/v1/configurations': {
    query: ConfigurationFilter & {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
    response: PaginatedResult<UnifiedConfig>;
  };
  
  'GET /api/v1/configurations/by-app/:appId': {
    params: { appId: string };
    query: { includeDeleted?: boolean };
    response: UnifiedConfig[];
  };
  
  'GET /api/v1/configurations/by-user/:userId': {
    params: { userId: string };
    query: { includeDeleted?: boolean };
    response: UnifiedConfig[];
  };
  
  'GET /api/v1/configurations/by-component/:componentType': {
    params: { componentType: string };
    query: { 
      componentSubType?: string;
      includeDeleted?: boolean;
    };
    response: UnifiedConfig[];
  };
  
  // Bulk Operations
  'POST /api/v1/configurations/bulk': {
    body: { configs: Omit<UnifiedConfig, 'configId' | 'creationTime' | 'lastUpdated'>[] };
    response: UnifiedConfig[];
  };
  
  'PUT /api/v1/configurations/bulk': {
    body: { updates: Array<{configId: string, updates: Partial<UnifiedConfig>}> };
    response: UnifiedConfig[];
  };
  
  'DELETE /api/v1/configurations/bulk': {
    body: { configIds: string[] };
    response: { results: Array<{configId: string, success: boolean}> };
  };
  
  // System Operations
  'GET /api/v1/system/health': {
    response: StorageHealthStatus;
  };
  
  'POST /api/v1/system/cleanup': {
    body: { dryRun?: boolean };
    response: { removedCount: number; configs?: UnifiedConfig[] };
  };
}
```

### SQLite Implementation

```typescript
// SQLite storage implementation for development
class SqliteStorage implements IConfigurationStorage {
  private db: Database;
  
  constructor() {
    const dbPath = process.env.SQLITE_DATABASE_PATH || './data/stern-configs.db';
    this.db = new Database(dbPath);
    this.initializeSchema();
  }
  
  private initializeSchema(): void {
    // Create configurations table with JSON support
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS configurations (
        configId TEXT PRIMARY KEY,
        appId TEXT NOT NULL,
        userId TEXT NOT NULL,
        componentType TEXT NOT NULL,
        componentSubType TEXT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        config TEXT NOT NULL,           -- JSON string
        settings TEXT NOT NULL,         -- JSON string (ConfigVersion[])
        activeSetting TEXT NOT NULL,
        tags TEXT,                      -- JSON string (string[])
        category TEXT,
        isShared BOOLEAN DEFAULT FALSE,
        isDefault BOOLEAN DEFAULT FALSE,
        isLocked BOOLEAN DEFAULT FALSE,
        createdBy TEXT NOT NULL,
        lastUpdatedBy TEXT NOT NULL,
        creationTime DATETIME NOT NULL,
        lastUpdated DATETIME NOT NULL,
        deletedAt DATETIME,
        deletedBy TEXT
      );
      
      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_app_user ON configurations(appId, userId);
      CREATE INDEX IF NOT EXISTS idx_component ON configurations(componentType, componentSubType);
      CREATE INDEX IF NOT EXISTS idx_user ON configurations(userId);
      CREATE INDEX IF NOT EXISTS idx_created ON configurations(creationTime);
      CREATE INDEX IF NOT EXISTS idx_updated ON configurations(lastUpdated);
      CREATE INDEX IF NOT EXISTS idx_deleted ON configurations(deletedAt);
    `);
  }
  
  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    const stmt = this.db.prepare(`
      INSERT INTO configurations (
        configId, appId, userId, componentType, componentSubType, name, description, icon,
        config, settings, activeSetting, tags, category, isShared, isDefault, isLocked,
        createdBy, lastUpdatedBy, creationTime, lastUpdated, deletedAt, deletedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    stmt.run(
      config.configId,
      config.appId,
      config.userId,
      config.componentType,
      config.componentSubType || null,
      config.name,
      config.description || null,
      config.icon || null,
      JSON.stringify(config.config),
      JSON.stringify(config.settings),
      config.activeSetting,
      config.tags ? JSON.stringify(config.tags) : null,
      config.category || null,
      config.isShared || false,
      config.isDefault || false,
      config.isLocked || false,
      config.createdBy,
      config.lastUpdatedBy,
      now,
      now,
      null,
      null
    );
    
    return config;
  }
  
  async findById(configId: string): Promise<UnifiedConfig | null> {
    const stmt = this.db.prepare('SELECT * FROM configurations WHERE configId = ? AND deletedAt IS NULL');
    const row = stmt.get(configId);
    return row ? this.deserializeConfig(row) : null;
  }
  
  async findByMultipleCriteria(criteria: ConfigurationFilter): Promise<UnifiedConfig[]> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    const stmt = this.db.prepare(`SELECT * FROM configurations ${whereClause}`);
    const rows = stmt.all(...params);
    return rows.map(row => this.deserializeConfig(row));
  }
  
  private buildWhereClause(criteria: ConfigurationFilter): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Always exclude soft-deleted unless explicitly requested
    if (!criteria.includeDeleted) {
      conditions.push('deletedAt IS NULL');
    }
    
    // Handle array filters with IN clauses
    if (criteria.configIds?.length) {
      conditions.push(`configId IN (${criteria.configIds.map(() => '?').join(',')})`);
      params.push(...criteria.configIds);
    }
    
    if (criteria.appIds?.length) {
      conditions.push(`appId IN (${criteria.appIds.map(() => '?').join(',')})`);
      params.push(...criteria.appIds);
    }
    
    if (criteria.componentTypes?.length) {
      conditions.push(`componentType IN (${criteria.componentTypes.map(() => '?').join(',')})`);
      params.push(...criteria.componentTypes);
    }
    
    // Handle text search
    if (criteria.nameContains) {
      conditions.push('name LIKE ?');
      params.push(`%${criteria.nameContains}%`);
    }
    
    // Handle boolean filters
    if (criteria.isShared !== undefined) {
      conditions.push('isShared = ?');
      params.push(criteria.isShared);
    }
    
    // Handle date range filters
    if (criteria.createdAfter) {
      conditions.push('creationTime > ?');
      params.push(criteria.createdAfter.toISOString());
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }
  
  private deserializeConfig(row: any): UnifiedConfig {
    return {
      configId: row.configId,
      appId: row.appId,
      userId: row.userId,
      componentType: row.componentType,
      componentSubType: row.componentSubType,
      name: row.name,
      description: row.description,
      icon: row.icon,
      config: JSON.parse(row.config),
      settings: JSON.parse(row.settings),
      activeSetting: row.activeSetting,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      category: row.category,
      isShared: row.isShared,
      isDefault: row.isDefault,
      isLocked: row.isLocked,
      createdBy: row.createdBy,
      lastUpdatedBy: row.lastUpdatedBy,
      creationTime: new Date(row.creationTime),
      lastUpdated: new Date(row.lastUpdated),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
      deletedBy: row.deletedBy
    };
  }
  
  async clone(sourceConfigId: string, newName: string, userId: string): Promise<UnifiedConfig> {
    const sourceConfig = await this.findById(sourceConfigId);
    if (!sourceConfig) {
      throw new Error(`Configuration ${sourceConfigId} not found`);
    }
    
    const clonedConfig: UnifiedConfig = {
      ...sourceConfig,
      configId: uuidv4(),
      name: newName,
      createdBy: userId,
      lastUpdatedBy: userId,
      creationTime: new Date(),
      lastUpdated: new Date(),
      isDefault: false,  // Clones are never default
      isLocked: false,   // Clones are never locked
      deletedAt: undefined,
      deletedBy: undefined
    };
    
    return this.create(clonedConfig);
  }
}
```

### MongoDB Implementation

```typescript
// MongoDB storage implementation for production
class MongoDbStorage implements IConfigurationStorage {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<UnifiedConfig>;
  
  constructor() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'stern-configurations';
    const collectionName = process.env.MONGODB_COLLECTION || 'configurations';
    
    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
    
    this.initializeIndexes();
  }
  
  private async initializeIndexes(): Promise<void> {
    await Promise.all([
      // Compound indexes for common query patterns
      this.collection.createIndex({ appId: 1, userId: 1 }),
      this.collection.createIndex({ componentType: 1, componentSubType: 1 }),
      this.collection.createIndex({ userId: 1, deletedAt: 1 }),
      
      // Single field indexes
      this.collection.createIndex({ configId: 1 }, { unique: true }),
      this.collection.createIndex({ creationTime: -1 }),
      this.collection.createIndex({ lastUpdated: -1 }),
      this.collection.createIndex({ deletedAt: 1, sparse: true }),
      
      // Text search index
      this.collection.createIndex({ 
        name: 'text', 
        description: 'text',
        tags: 'text'
      })
    ]);
  }
  
  async create(config: UnifiedConfig): Promise<UnifiedConfig> {
    await this.collection.insertOne(config);
    return config;
  }
  
  async findById(configId: string): Promise<UnifiedConfig | null> {
    return this.collection.findOne({ 
      configId, 
      deletedAt: { $exists: false } 
    });
  }
  
  async findByMultipleCriteria(criteria: ConfigurationFilter): Promise<UnifiedConfig[]> {
    const filter = this.buildMongoFilter(criteria);
    return this.collection.find(filter).toArray();
  }
  
  private buildMongoFilter(criteria: ConfigurationFilter): any {
    const filter: any = {};
    
    // Exclude soft-deleted unless explicitly requested
    if (!criteria.includeDeleted) {
      filter.deletedAt = { $exists: false };
    }
    
    // Handle array filters with $in
    if (criteria.configIds?.length) {
      filter.configId = { $in: criteria.configIds };
    }
    
    if (criteria.appIds?.length) {
      filter.appId = { $in: criteria.appIds };
    }
    
    if (criteria.componentTypes?.length) {
      filter.componentType = { $in: criteria.componentTypes };
    }
    
    // Handle text search with regex
    if (criteria.nameContains) {
      filter.name = { $regex: criteria.nameContains, $options: 'i' };
    }
    
    // Handle boolean filters
    if (criteria.isShared !== undefined) {
      filter.isShared = criteria.isShared;
    }
    
    // Handle date range filters
    if (criteria.createdAfter || criteria.createdBefore) {
      filter.creationTime = {};
      if (criteria.createdAfter) {
        filter.creationTime.$gte = criteria.createdAfter;
      }
      if (criteria.createdBefore) {
        filter.creationTime.$lte = criteria.createdBefore;
      }
    }
    
    return filter;
  }
  
  async clone(sourceConfigId: string, newName: string, userId: string): Promise<UnifiedConfig> {
    const sourceConfig = await this.findById(sourceConfigId);
    if (!sourceConfig) {
      throw new Error(`Configuration ${sourceConfigId} not found`);
    }
    
    const clonedConfig: UnifiedConfig = {
      ...sourceConfig,
      _id: undefined,  // Remove MongoDB _id to create new document
      configId: uuidv4(),
      name: newName,
      createdBy: userId,
      lastUpdatedBy: userId,
      creationTime: new Date(),
      lastUpdated: new Date(),
      isDefault: false,
      isLocked: false,
      deletedAt: undefined,
      deletedBy: undefined
    };
    
    return this.create(clonedConfig);
  }
}
```

### Express.js Service Implementation

```typescript
// Express.js REST service implementation
class ConfigurationService {
  private storage: IConfigurationStorage;
  
  constructor() {
    this.storage = StorageFactory.createStorage();
  }
  
  // Express.js routes
  setupRoutes(app: Express): void {
    // Basic CRUD
    app.post('/api/v1/configurations', this.handleCreate.bind(this));
    app.get('/api/v1/configurations/:configId', this.handleFindById.bind(this));
    app.put('/api/v1/configurations/:configId', this.handleUpdate.bind(this));
    app.delete('/api/v1/configurations/:configId', this.handleDelete.bind(this));
    
    // Advanced operations
    app.post('/api/v1/configurations/:configId/clone', this.handleClone.bind(this));
    app.get('/api/v1/configurations', this.handleQuery.bind(this));
    
    // Specialized queries
    app.get('/api/v1/configurations/by-app/:appId', this.handleFindByApp.bind(this));
    app.get('/api/v1/configurations/by-user/:userId', this.handleFindByUser.bind(this));
    app.get('/api/v1/configurations/by-component/:componentType', this.handleFindByComponent.bind(this));
    
    // System operations
    app.get('/api/v1/system/health', this.handleHealthCheck.bind(this));
  }
  
  private async handleCreate(req: Request, res: Response): Promise<void> {
    try {
      const configData = req.body;
      
      // Add system fields
      const config: UnifiedConfig = {
        ...configData,
        configId: uuidv4(),
        creationTime: new Date(),
        lastUpdated: new Date()
      };
      
      const result = await this.storage.create(config);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  private async handleQuery(req: Request, res: Response): Promise<void> {
    try {
      const criteria = req.query as ConfigurationFilter;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (page && limit) {
        const result = await this.storage.findWithPagination(criteria, page, limit);
        res.json(result);
      } else {
        const result = await this.storage.findByMultipleCriteria(criteria);
        res.json(result);
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  private async handleClone(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const { newName, userId } = req.body;
      
      const result = await this.storage.clone(configId, newName, userId);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

// Environment configuration validation
function validateEnvironment(): void {
  const env = process.env.NODE_ENV;
  
  if (env === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for production environment');
  }
  
  console.log(`🗄️  Storage: ${env === 'production' ? 'MongoDB' : 'SQLite'}`);
  console.log(`🌍 Environment: ${env}`);
}

// Server startup
const app = express();
const port = process.env.PORT || 3001;

validateEnvironment();

const configService = new ConfigurationService();
configService.setupRoutes(app);

app.listen(port, () => {
  console.log(`🚀 Stern Configuration Service running on port ${port}`);
});
```

This comprehensive REST Configuration Service design provides:

1. **🔄 Environment Transparency**: Automatic SQLite/MongoDB selection
2. **🎯 Complete CRUD**: Create, read, update, delete, clone operations  
3. **🔍 Advanced Querying**: Multiple filter criteria with pagination
4. **⚡ Performance**: Optimized indexes for both databases
5. **🛡️ Error Handling**: Comprehensive validation and error responses
6. **📊 System Health**: Health checks and maintenance operations

---

## Technical Decisions Log

### Decision 1: Clean Architecture Approach
**Date**: 2025-01-14  
**Decision**: Implement clean architecture with clear layer separation  
**Rationale**: Current implementation has become complex due to mixing concerns  
**Impact**: 70% reduction in complexity, improved testability, better maintainability

### Decision 2: Multi-Protocol Data Provider Architecture  
**Date**: 2025-01-14  
**Decision**: Create unified interface supporting Socket.IO, WebSocket, STOMP, and REST  
**Rationale**: Trading systems need flexibility in data source protocols  
**Impact**: Supports all existing data sources without migration, enables easy protocol switching

### Decision 3: Extend Existing STOMP Implementation
**Date**: 2025-01-14  
**Decision**: Use current STOMP implementation as template for other providers  
**Rationale**: Existing implementation has proven patterns and performance optimizations  
**Impact**: Faster development, consistent patterns across protocols, zero breaking changes

### Decision 4: REST Service Configuration Management (Revised)
**Date**: 2025-01-14  
**Original Decision**: IAB-Based configuration management  
**Revised Decision**: REST service with environment-specific storage (SQLite/MongoDB)  
**Rationale**: 
- Cross-origin localStorage fragmentation prevents unified configuration
- REST service provides better scalability and standard tooling
- SQLite perfect for development simplicity, MongoDB for production scale
- Standard HTTP patterns easier to test, debug, and monitor
**Impact**: Unified configuration across all views, enterprise-grade persistence, better development experience

### Decision 5: Single Configurable Blotter Platform
**Date**: 2025-01-14  
**Decision**: Replace 40+ separate applications with one configurable system  
**Rationale**: 80% code duplication waste, maintenance nightmare, inconsistent UX  
**Impact**: 90% reduction in code duplication, faster feature development, consistent user experience

### Decision 6: React Router + OpenFin Integration
**Date**: 2025-01-14  
**Decision**: Use React Router for window navigation with OpenFin workspace integration  
**Rationale**: Modern development workflow while maintaining OpenFin capabilities  
**Impact**: Better developer experience, easier testing, clean URL-based navigation

### Decision 7: Zustand for State Management
**Date**: 2025-01-14  
**Decision**: Use Zustand instead of Redux or complex context patterns  
**Rationale**: Lighter weight, better performance, simpler to understand  
**Impact**: Reduced bundle size, faster rendering, easier state management

### Decision 8: Design Mode Implementation
**Date**: 2025-01-14  
**Decision**: Implement runtime configuration through OpenFin dock integration  
**Rationale**: Users need ability to create new blotter types without developer involvement  
**Impact**: Self-service blotter creation, reduced IT bottlenecks, faster time-to-market

### Decision 9: OpenFin Workspace Service Wrapper
**Date**: 2025-01-14  
**Decision**: Create lightweight React wrapper providing OpenFin workspace services to components  
**Rationale**: 
- Keep core components clean and focused on business logic
- Provide consistent workspace integration across all blotters
- Enable easy testing without OpenFin dependency
- Standardize workspace event handling (theme changes, saves, renames)
**Impact**: 
- Clean separation between OpenFin integration and trading logic
- Consistent workspace services across all 40+ blotter types
- Testable components with mock workspace services
- Standardized event handling for workspace lifecycle events

### Decision 10: Unified Dialog Template System with Core Window Integration
**Date**: 2025-01-14  
**Decision**: Create standardized dialog templates with core OpenFin window integration by default
**Rationale**: 
- Current dialog implementations are inconsistent (some use proper templates, others don't)
- Need standardized UX across grid options, column groups, conditional formatting, etc.
- Tool components should open in core OpenFin windows for professional desktop experience
- Complex tools need native OS window features (taskbar icons, independent resize/minimize/maximize)
- Want reusable templates with advanced features (unsaved changes, loading states, previews)
**Updated Decision**: All customization tools (Grid Options, Conditional Formatting, Column Groups, etc.) open in **core OpenFin windows** by default, appearing as separate applications with full OS integration
**Impact**: 
- **Professional desktop experience**: Tools appear as native applications with taskbar icons
- **Enhanced productivity**: Users can work with multiple tools simultaneously across monitors  
- **Consistent user experience**: All tool dialogs follow same core window patterns
- **Native window management**: Tools can be independently resized, minimized, maximized
- **Multi-monitor support**: Tools can be moved and arranged across displays
- **Reduced development time**: Reusable templates handle all window lifecycle
- **Built-in best practices**: Unsaved changes warnings, loading states, proper cleanup

---

## Expected Benefits

### Development Efficiency
- **90% reduction** in code duplication across blotter applications
- **95% faster** new blotter creation (configuration vs new application)
- **80% reduction** in maintenance overhead
- **3x faster** feature development through reusable components

### User Experience
- **Consistent interface** across all blotter types
- **Instant customization** without developer involvement
- **Shared configurations** across trading desks and teams
- **Real-time synchronization** of settings across windows

### Business Value
- **Weeks to hours** for new blotter variants through configuration
- **Single codebase** to maintain and enhance
- **Self-service configuration** reduces IT bottlenecks
- **Unified training** - single interface to learn

### Performance Improvements
- **Bundle Size**: 60% smaller than current implementation
- **Runtime Performance**: 50% faster rendering through optimizations
- **Memory Usage**: 40% reduction through proper resource management
- **Update Latency**: Sub-50ms real-time data updates maintained

### Quality Metrics
- **Maintainability**: 70% easier to understand and modify
- **Testing**: 80% more testable with isolated components
- **Bug Fixing**: 50% faster issue resolution through centralized codebase
- **Code Quality**: TypeScript strict mode, comprehensive error handling

---

## Conclusion

AGV3-Next represents a fundamental shift from maintaining 40+ separate applications to a single, highly configurable trading blotter platform. By leveraging clean architecture principles, modern React patterns, and cohesive OpenFin integration, we can deliver:

**For Users:**
- Consistent, intuitive interface across all trading scenarios
- Self-service configuration capabilities
- Real-time collaboration and configuration sharing
- Reduced learning curve and training requirements

**For Developers:**
- Single codebase to maintain and enhance
- Clean, testable, modular architecture  
- Faster feature development and bug fixes
- Modern development workflow and tooling

**For Business:**
- Dramatic reduction in development and maintenance costs
- Faster time-to-market for new trading scenarios
- Improved operational efficiency through standardization
- Future-proof architecture supporting continued innovation

The phased implementation approach ensures minimal risk while delivering continuous value throughout the development process. The migration strategy preserves existing investments while providing a clear path to the new platform.

---

## Document Change Log

### Version 1.2 - 2025-01-14
**Added**: OpenFin Workspace Service Wrapper architecture
- Lightweight React wrapper for OpenFin workspace integration
- Clean separation between business logic and workspace services
- Comprehensive workspace event handling (theme changes, saves, renames)
- Cross-view communication and workspace management APIs
- Mock services for non-OpenFin development environments
- Technical decision #9 documenting wrapper pattern benefits

### Version 1.1 - 2025-01-14
**Added**: REST Service Configuration Management architecture
- Complete REST API design with Express.js implementation
- Environment-specific storage (SQLite for development, MongoDB for production)
- Comprehensive comparison between IAB vs REST approaches
- Updated technical decision #4 with revised architecture choice
- Full implementation examples for both storage backends

### Version 1.0 - 2025-01-14
**Initial**: Complete AGV3-Next design document
- Business context and problem statement
- Multi-protocol data provider architecture
- IAB-based configuration management (initial design)
- OpenFin platform integration
- Implementation strategy and phases

---

*Document Version: 1.2*  
*Last Updated: 2025-01-14*  
*Status: Architecture Enhanced - Ready for Implementation*