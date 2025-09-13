import { v4 as uuidv4 } from 'uuid';
import { UnifiedConfig, ConfigVersion, COMPONENT_TYPES } from '../../types/configuration';

export const createMockConfigVersion = (overrides: Partial<ConfigVersion> = {}): ConfigVersion => ({
  versionId: uuidv4(),
  name: 'Default Version',
  description: 'Default configuration version',
  config: { theme: 'dark', layout: 'grid' },
  createdTime: new Date(),
  updatedTime: new Date(),
  isActive: true,
  metadata: {},
  ...overrides
});

export const createMockUnifiedConfig = (overrides: Partial<UnifiedConfig> = {}): UnifiedConfig => {
  const configId = uuidv4();
  const activeSettingId = uuidv4();
  const defaultVersion = createMockConfigVersion({ 
    versionId: activeSettingId,
    isActive: true 
  });

  return {
    configId,
    appId: 'test-app',
    userId: 'test-user',
    componentType: COMPONENT_TYPES.DATA_GRID,
    componentSubType: 'custom',
    name: 'Test Configuration',
    description: 'Test configuration for unit tests',
    icon: 'grid-icon',
    config: { theme: 'dark', layout: 'grid' },
    settings: [defaultVersion],
    activeSetting: activeSettingId,
    tags: ['test', 'grid'],
    category: 'testing',
    isShared: false,
    isDefault: false,
    isLocked: false,
    createdBy: 'test-user',
    lastUpdatedBy: 'test-user',
    creationTime: new Date(),
    lastUpdated: new Date(),
    ...overrides
  };
};

export const createMultipleMockConfigs = (count: number): UnifiedConfig[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockUnifiedConfig({
      name: `Test Configuration ${index + 1}`,
      appId: `test-app-${index + 1}`,
      userId: `test-user-${Math.ceil((index + 1) / 2)}` // Multiple configs per user
    })
  );
};

export const createMockFilter = () => ({
  appIds: ['test-app-1', 'test-app-2'],
  userIds: ['test-user-1'],
  componentTypes: [COMPONENT_TYPES.DATA_GRID],
  includeDeleted: false
});

export const createMockBulkUpdate = (configs: UnifiedConfig[]) => {
  return configs.map(config => ({
    configId: config.configId,
    updates: {
      name: `Updated ${config.name}`,
      lastUpdatedBy: 'bulk-updater'
    }
  }));
};