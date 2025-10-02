# Detailed Plan: Runtime Dock Configuration with UI Editor

## Overview
Implement a comprehensive runtime dock configuration system with a visual editor in the Provider component, allowing users to dynamically create menu items and submenus, persist configurations via REST API, and manage dock layouts through a tree-based interface. This implementation will follow the OpenFin wrapper patterns described in the STERN_DESIGN_DOCUMENT.

## Phase 1: Data Models & Types (Backend & Frontend)

### 1.1 Create Dock Configuration Types
**File: `client/src/types/dockConfig.ts`**
- Define `DockMenuItem` interface with properties:
  - `id: string` (auto-generated or user-provided)
  - `caption: string` (display text)
  - `url: string` (component path)
  - `openMode: 'window' | 'view'`
  - `icon?: string`
  - `children?: DockMenuItem[]` (for submenus)
  - `order: number` (for sorting)
  - `metadata?: any`
  - `windowOptions?: OpenFinWindowOptions` (for window mode)
  - `viewOptions?: OpenFinViewOptions` (for view mode)

- Define `DockConfiguration` interface extending UnifiedConfig:
  ```typescript
  interface DockConfiguration extends UnifiedConfig {
    componentType: 'dock';
    componentSubType?: 'default' | 'custom';
    configId: string;
    userId: string;
    name: string;
    config: {
      menuItems: DockMenuItem[];
      theme: 'light' | 'dark' | 'auto';
      position?: 'left' | 'right' | 'top' | 'bottom';
      autoHide?: boolean;
    };
    settings: ConfigVersion[]; // Version history for dock layouts
    activeSetting: string; // Active dock layout version
  }
  ```

### 1.2 Extend Server Configuration Type
**File: `server/src/types/configuration.ts`**
- Add 'dock' to COMPONENT_TYPES constant
- Ensure UnifiedConfig can handle dock configurations
- Add dock-specific validation rules

## Phase 2: OpenFin Workspace Service Wrapper

### 2.1 Create OpenFin Workspace Provider
**File: `client/src/services/openfin/OpenFinWorkspaceProvider.tsx`**
```typescript
export interface OpenFinWorkspaceServices {
  // Dock Management
  registerDock: (config: DockConfiguration) => Promise<void>;
  updateDock: (config: DockConfiguration) => Promise<void>;
  showDock: () => Promise<void>;
  hideDock: () => Promise<void>;

  // Window/View Creation
  createWindow: (options: WindowOptions) => Promise<OpenFin.Window>;
  createView: (options: ViewOptions) => Promise<OpenFin.View>;

  // Theme Services
  getCurrentTheme: () => Promise<string>;
  subscribeToThemeChanges: (callback: (theme: string) => void) => () => void;

  // Cross-View Communication
  broadcastToAllViews: (message: any, topic?: string) => Promise<void>;
  subscribeToMessages: (topic: string, callback: (message: any) => void) => () => void;

  // Workspace Events
  onWorkspaceSaved: (callback: (workspace: any) => void) => () => void;
  onViewClosed: (callback: (viewId: string) => void) => () => void;
}
```

### 2.2 Create React Hook for OpenFin Integration
**File: `client/src/hooks/useOpenFinWorkspace.ts`**
- Provides access to OpenFin workspace services
- Returns mock services in non-OpenFin environments
- Handles cleanup on unmount

## Phase 3: Provider Component UI Redesign

### 3.1 Transform Provider to Dashboard Layout
**File: `client/src/platform/Provider.tsx`**
```typescript
export default function Provider() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="stern-theme">
      <OpenFinWorkspaceProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/dock" element={<DockConfigEditor />} />
              <Route path="/settings" element={<SettingsPanel />} />
              <Route path="/help" element={<HelpPanel />} />
            </Routes>
          </main>
        </div>
      </OpenFinWorkspaceProvider>
    </ThemeProvider>
  );
}
```

### 3.2 Create Sidebar Navigation Component
**File: `client/src/components/provider/Sidebar.tsx`**
- Use shadcn/ui components:
  - `Tabs` component in vertical orientation
  - `Button` for navigation items
  - `Tooltip` for hover hints
  - `Switch` for theme toggle
- Icons for each tab (Dock, Settings, Help)
- Collapsible for mobile responsiveness
- Active state highlighting

### 3.3 Create Dock Configuration Editor
**File: `client/src/components/provider/DockConfigEditor.tsx`**
- Main editor interface using shadcn/ui components:
  - `ResizablePanelGroup` for layout
  - `Card` for content sections
  - `Toolbar` with action buttons
  - `Alert` for status messages

## Phase 4: Tree Editor Implementation

### 4.1 Create Tree View Component
**File: `client/src/components/provider/TreeView.tsx`**
- Using shadcn/ui components:
  - `Accordion` for expandable menu items
  - `ContextMenu` for right-click actions
  - `DragDropContext` for reordering
- Features:
  - Recursive rendering for nested menus
  - Visual indicators (icons, badges)
  - Selected state highlighting
  - Drag handles for reordering

### 4.2 Create Properties Panel
**File: `client/src/components/provider/PropertiesPanel.tsx`**
- Dynamic form using shadcn/ui components:
  - `Form` with react-hook-form integration
  - `Input` for text fields
  - `Select` for dropdown options
  - `Switch` for boolean options
  - `Button` for actions
- Fields:
  - Caption (with validation)
  - URL Path (with base URL preview)
  - ID (with uniqueness check)
  - Open Mode (Window/View selector)
  - Window/View Options (conditional fields)
  - Icon Selection

### 4.3 Create Icon Picker Dialog
**File: `client/src/components/provider/IconPicker.tsx`**
- Using shadcn/ui `Dialog` component
- Features:
  - `ScrollArea` for icon grid
  - `Input` for search
  - `Tabs` for icon categories
  - Preview area
  - Custom URL input option

## Phase 5: State Management

### 5.1 Create Dock Configuration Store
**File: `client/src/stores/dockConfigStore.ts`**
```typescript
interface DockConfigStore {
  // State
  currentConfig: DockConfiguration | null;
  selectedNode: DockMenuItem | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConfig: (userId: string) => Promise<void>;
  saveConfig: () => Promise<void>;
  addMenuItem: (parent?: DockMenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<DockMenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  reorderItems: (sourceId: string, targetId: string, position: 'before' | 'after') => void;
  selectNode: (node: DockMenuItem | null) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### 5.2 Create Configuration API Service
**File: `client/src/services/dockConfigService.ts`**
- API functions with proper error handling:
  ```typescript
  export const dockConfigService = {
    save: async (config: DockConfiguration) => {
      return apiClient.post('/api/v1/configurations', config);
    },
    load: async (userId: string) => {
      return apiClient.get('/api/v1/configurations/by-user/' + userId, {
        params: { componentType: 'dock' }
      });
    },
    update: async (configId: string, updates: Partial<DockConfiguration>) => {
      return apiClient.put('/api/v1/configurations/' + configId, updates);
    },
    delete: async (configId: string) => {
      return apiClient.delete('/api/v1/configurations/' + configId);
    }
  };
  ```

## Phase 6: REST API Integration

### 6.1 Create API Client
**File: `client/src/utils/apiClient.ts`**
```typescript
import axios from 'axios';
import { buildUrl } from '../openfin-utils';

export const apiClient = axios.create({
  baseURL: buildUrl('/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth
apiClient.interceptors.request.use(config => {
  // Add auth token if available
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

### 6.2 Implement Save/Load Functionality
- Auto-save draft to localStorage every 30 seconds
- Debounced save to server on changes
- Optimistic updates with rollback on error
- Conflict resolution with version comparison
- Toast notifications for save status

## Phase 7: Dynamic Dock Generation

### 7.1 Update Dock Registration
**File: `client/src/platform/dock.ts`**
```typescript
export async function registerDockFromConfig(config: DockConfiguration): Promise<void> {
  const workspace = useOpenFinWorkspace();

  const dockButtons = convertMenuItemsToButtons(config.config.menuItems);

  await workspace.registerDock({
    id: config.configId,
    title: config.name,
    icon: buildUrl('/icons/dock.svg'),
    buttons: dockButtons
  });
}

function convertMenuItemsToButtons(items: DockMenuItem[]): DockButton[] {
  return items.map(item => {
    if (item.children?.length) {
      return {
        type: 'DropdownButton',
        id: item.id,
        tooltip: item.caption,
        iconUrl: item.icon ? buildUrl(item.icon) : buildUrl('/icons/default.svg'),
        options: item.children.map(child => ({
          tooltip: child.caption,
          iconUrl: child.icon ? buildUrl(child.icon) : buildUrl('/icons/default.svg'),
          action: {
            id: 'launch-component',
            customData: {
              ...child,
              parentId: item.id
            }
          }
        }))
      };
    } else {
      return {
        type: 'CustomButton',
        id: item.id,
        tooltip: item.caption,
        iconUrl: item.icon ? buildUrl(item.icon) : buildUrl('/icons/default.svg'),
        action: {
          id: 'launch-component',
          customData: item
        }
      };
    }
  });
}
```

### 7.2 Create Menu Item Launcher
**File: `client/src/platform/menuLauncher.ts`**
```typescript
export async function launchMenuItem(item: DockMenuItem, workspace: OpenFinWorkspaceServices) {
  const url = buildUrl(item.url) + '?id=' + encodeURIComponent(item.id);

  if (item.openMode === 'window') {
    await workspace.createWindow({
      name: `${item.id}-window-${Date.now()}`,
      url,
      defaultWidth: item.windowOptions?.width || 1200,
      defaultHeight: item.windowOptions?.height || 800,
      autoShow: true,
      frame: true,
      contextMenu: true,
      ...item.windowOptions
    });
  } else {
    // Launch as view in current window
    await workspace.createView({
      name: `${item.id}-view-${Date.now()}`,
      url,
      ...item.viewOptions
    });
  }
}
```

## Phase 8: Component Routing

### 8.1 Create Component Registry
**File: `client/src/components/registry/index.ts`**
```typescript
import { lazy } from 'react';

export const componentRegistry = new Map([
  ['data-grid', lazy(() => import('../data-grid/DataGrid'))],
  ['chart', lazy(() => import('../chart/Chart'))],
  ['watchlist', lazy(() => import('../watchlist/Watchlist'))],
  ['order-entry', lazy(() => import('../order-entry/OrderEntry'))],
  // Add more components as needed
]);

export function getComponent(path: string) {
  // Extract component name from path
  const componentName = path.split('/').pop();
  return componentRegistry.get(componentName);
}
```

### 8.2 Create Component Wrapper
**File: `client/src/components/ComponentWrapper.tsx`**
```typescript
export function ComponentWrapper() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const componentId = searchParams.get('id');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (componentId) {
      // Load configuration for this component instance
      loadComponentConfig(componentId).then(setConfig);
    }
  }, [componentId]);

  const Component = getComponent(location.pathname);

  if (!Component) {
    return <div>Component not found</div>;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Component id={componentId} config={config} />
    </Suspense>
  );
}
```

## Phase 9: UI Polish & UX

### 9.1 Add Validation & Error Handling
- Implement Zod schemas for validation
- Use react-hook-form with zodResolver
- Display inline validation errors
- Toast notifications using sonner
- Error boundaries for component failures

### 9.2 Add Keyboard Shortcuts
```typescript
useHotkeys('ctrl+s', () => saveConfiguration());
useHotkeys('delete', () => deleteSelectedNode());
useHotkeys('ctrl+z', () => store.undo());
useHotkeys('ctrl+y', () => store.redo());
useHotkeys('ctrl+n', () => addNewMenuItem());
```

### 9.3 Add Loading States
- Use shadcn/ui `Skeleton` component for loading
- `Progress` component for save operations
- Optimistic updates with rollback
- Suspense boundaries for lazy components

### 9.4 Add Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader announcements

## Phase 10: Testing & Documentation

### 10.1 Add Unit Tests
```typescript
// Test tree manipulation
describe('DockConfigStore', () => {
  it('should add menu item to root');
  it('should add submenu item');
  it('should update menu item properties');
  it('should delete menu item and children');
  it('should reorder items');
});

// Test API service
describe('DockConfigService', () => {
  it('should save configuration');
  it('should load user configurations');
  it('should handle API errors');
});
```

### 10.2 Add Integration Tests
```typescript
describe('Dock Configuration Editor', () => {
  it('should create and save new dock configuration');
  it('should load and edit existing configuration');
  it('should register dock with OpenFin');
  it('should launch components from dock');
});
```

## File Structure Summary

```
client/src/
├── types/
│   └── dockConfig.ts (new)
├── services/
│   ├── openfin/
│   │   └── OpenFinWorkspaceProvider.tsx (new)
│   └── dockConfigService.ts (new)
├── hooks/
│   └── useOpenFinWorkspace.ts (new)
├── components/
│   ├── provider/
│   │   ├── Sidebar.tsx (new)
│   │   ├── DockConfigEditor.tsx (new)
│   │   ├── TreeView.tsx (new)
│   │   ├── PropertiesPanel.tsx (new)
│   │   └── IconPicker.tsx (new)
│   ├── registry/
│   │   └── index.ts (new)
│   └── ComponentWrapper.tsx (new)
├── stores/
│   └── dockConfigStore.ts (new)
├── utils/
│   └── apiClient.ts (new)
├── platform/
│   ├── Provider.tsx (modify)
│   ├── dock.ts (modify)
│   └── menuLauncher.ts (new)

server/src/
├── types/
│   └── configuration.ts (extend with 'dock' type)
```

## Implementation Order
1. OpenFin Workspace Provider and hooks
2. Data models and types
3. Basic UI layout with sidebar
4. Tree editor components
5. State management with Zustand
6. API client and services
7. Save/Load functionality
8. Dynamic dock generation
9. Component routing and launching
10. Polish, accessibility, and testing

## Key Features Delivered
✅ Runtime dock configuration with visual editor
✅ OpenFin workspace service wrapper for clean integration
✅ Tree-based menu editor with drag-and-drop
✅ Menu and submenu creation with full customization
✅ Configurable properties (caption, URL, ID, open mode)
✅ REST API persistence using existing configuration service
✅ Dark/light theme support via ThemeProvider
✅ Real-time preview and validation
✅ Component launching with unique IDs as query parameters
✅ Window vs View mode selection
✅ Auto-save and version history
✅ Keyboard shortcuts and accessibility
✅ Mock services for non-OpenFin development

## Technical Highlights
- **OpenFin Integration**: Clean separation using service wrapper pattern
- **Component Architecture**: Lazy loading with dynamic imports
- **State Management**: Zustand with undo/redo support
- **UI Components**: Full shadcn/ui component usage
- **API Integration**: Axios with interceptors and error handling
- **Testing**: Comprehensive unit and integration tests
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimistic updates and debounced saves

## Migration Path from Current Implementation
1. Current dock configuration is hardcoded in manifest
2. New system allows runtime configuration without manifest changes
3. Existing dock will continue to work during migration
4. Gradual migration of menu items to database
5. Full backwards compatibility maintained