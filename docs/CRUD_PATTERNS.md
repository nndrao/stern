# Standard CRUD Patterns for Stern Platform

## Overview

This document defines the standard patterns for Create, Read, Update, Delete (CRUD) operations between the React client and REST API endpoints.

## Core Principles

1. **Server owns identity** - The server generates all IDs, timestamps, and audit fields
2. **Client is stateless** - No client-generated IDs that might conflict with server
3. **Simple logic** - No ID = CREATE, Has ID = UPDATE
4. **Standard HTTP methods** - POST (create), GET (read), PUT (update), DELETE (delete)
5. **Idempotent updates** - PUT operations can be safely retried

## Standard CRUD Pattern

### CREATE (POST)

**Client sends:**
```typescript
POST /api/v1/configurations
{
  // Required business data
  appId: "stern-platform",
  userId: "user-123",
  componentType: "dock",
  name: "My Dock Config",
  config: { menuItems: [...] },

  // Optional fields
  description: "My custom dock",
  tags: ["custom"],

  // Audit fields (optional)
  createdBy: "user-123",
  lastUpdatedBy: "user-123"

  // DO NOT SEND:
  // - configId (server generates)
  // - creationTime (server generates)
  // - lastUpdated (server generates)
}
```

**Server responds:**
```typescript
201 Created
{
  configId: "uuid-generated-by-server",
  creationTime: "2025-10-02T10:00:00Z",
  lastUpdated: "2025-10-02T10:00:00Z",
  ...allOtherFields
}
```

### READ (GET)

**Get single resource:**
```typescript
GET /api/v1/configurations/:id
Response: 200 OK with full resource, or 404 Not Found
```

**Query resources:**
```typescript
GET /api/v1/configurations?userId=user-123&componentType=dock
Response: 200 OK with array of resources
```

### UPDATE (PUT)

**Client sends:**
```typescript
PUT /api/v1/configurations/:id
{
  // Only send fields that can be updated
  name: "Updated Name",
  description: "Updated description",
  config: { menuItems: [...] },
  tags: ["updated"],

  // Audit field
  lastUpdatedBy: "user-123"

  // DO NOT SEND:
  // - configId (in URL path)
  // - creationTime (immutable)
  // - lastUpdated (server manages)
  // - createdBy (immutable)
}
```

**Server responds:**
```typescript
200 OK with full updated resource
404 Not Found if ID doesn't exist
400 Bad Request if validation fails
```

### DELETE (DELETE)

**Client sends:**
```typescript
DELETE /api/v1/configurations/:id
```

**Server responds:**
```typescript
204 No Content (soft delete successful)
404 Not Found if ID doesn't exist
```

## Client Implementation Pattern

### Service Layer (dockConfigService.ts)

```typescript
export const dockConfigService = {
  // CREATE - no ID in payload
  async create(config: Partial<DockConfiguration>): Promise<DockConfiguration> {
    // Strip any server-managed fields
    const { configId, creationTime, lastUpdated, ...data } = config;

    return apiClient.post('/configurations', {
      ...data,
      lastUpdatedBy: config.userId
    });
  },

  // READ - by ID
  async getById(id: string): Promise<DockConfiguration> {
    return apiClient.get(`/configurations/${id}`);
  },

  // UPDATE - ID in URL, not payload
  async update(id: string, updates: Partial<DockConfiguration>): Promise<DockConfiguration> {
    // Strip server-managed and immutable fields
    const { configId, creationTime, lastUpdated, createdBy, ...data } = updates;

    return apiClient.put(`/configurations/${id}`, {
      ...data,
      lastUpdatedBy: updates.userId
    });
  },

  // DELETE - soft delete
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/configurations/${id}`);
  }
};
```

### Store Layer (dockConfigStore.ts)

```typescript
export const useDockConfigStore = create<DockConfigStore>((set, get) => ({
  currentConfig: null,

  async saveConfig() {
    const { currentConfig } = get();
    if (!currentConfig) return;

    try {
      let saved: DockConfiguration;

      if (currentConfig.configId) {
        // Has ID = UPDATE
        saved = await dockConfigService.update(currentConfig.configId, currentConfig);
      } else {
        // No ID = CREATE
        saved = await dockConfigService.create(currentConfig);
      }

      set({ currentConfig: saved, isDirty: false });
    } catch (error) {
      // Handle error
      set({ error: error.message });
    }
  }
}));
```

### Component Layer (DockConfigEditor.tsx)

```typescript
const handleSave = async () => {
  // Validate (but configId is NOT required for new configs)
  const validation = validateDockConfiguration(config);
  if (!validation.isValid) {
    showError(validation.errors);
    return;
  }

  // Simple save - store handles create vs update logic
  await store.saveConfig();
  showSuccess('Configuration saved');
};
```

## Validation Rules

### Client-Side Validation

**Required for CREATE and UPDATE:**
- userId
- appId
- componentType
- name
- config (business data)

**NOT Required:**
- configId (server generates for CREATE, included in URL for UPDATE)
- creationTime (server generates)
- lastUpdated (server generates)

### Server-Side Validation

**Create Schema:**
- All required business fields
- configId is optional (server generates if not provided)
- Timestamps are optional (server generates if not provided)

**Update Schema:**
- At least one field must be provided
- Cannot update: configId, creationTime, createdBy
- Server automatically sets: lastUpdated

## Error Handling

| Status Code | Meaning | Client Action |
|------------|---------|---------------|
| 200 OK | Update successful | Update local state |
| 201 Created | Create successful | Update local state with new ID |
| 400 Bad Request | Validation error | Show validation errors to user |
| 404 Not Found | Resource doesn't exist | Treat as CREATE, or show error |
| 409 Conflict | Duplicate/conflict | Show error, refresh data |
| 500 Server Error | Server problem | Show generic error, retry |

## Migration from Old Pattern

**Old Pattern Issues:**
❌ Client generated configId (`dock-${Date.now()}-...`)
❌ Client set creationTime and lastUpdated
❌ Validation required configId for new configs
❌ Update endpoint received configId in payload
❌ Confusion between create and update logic

**New Pattern Benefits:**
✅ Server is single source of truth for IDs
✅ No risk of ID conflicts
✅ Clear separation: no ID = create, has ID = update
✅ Validation matches actual requirements
✅ Clean, predictable CRUD operations

## Testing Checklist

- [ ] Create new config (no ID) → POST → receives generated ID
- [ ] Update existing config → PUT with ID → receives updated resource
- [ ] Delete config → DELETE → soft delete successful
- [ ] Get config by ID → GET → receives full resource
- [ ] Query configs with filters → GET with params → receives array
- [ ] Create validation (no configId required)
- [ ] Update validation (configId in URL, not payload)
- [ ] 404 handling for non-existent resources
- [ ] 400 handling for validation errors

## References

- REST API Best Practices: https://restfulapi.net/
- HTTP Status Codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- Server validation: `server/src/utils/validation.ts`
- Client types: `client/src/types/dockConfig.ts`
- Service layer: `client/src/services/dockConfigService.ts`
- Store layer: `client/src/stores/dockConfigStore.ts`
