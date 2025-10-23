/**
 * Migration Script: Separate Dock Menu Items from Data Provider Configs
 *
 * This script:
 * 1. Finds all configs with menuItems in their config
 * 2. Extracts menuItems into a new singleton DockApplicationsMenuItems config
 * 3. Creates separate DataProvider configs without menuItems
 * 4. Deletes the old mixed configurations
 */

import { StorageFactory } from '../src/storage/StorageFactory.js';
import { UnifiedConfig } from '../src/types/configuration.js';
import { v4 as uuidv4 } from 'uuid';

async function migrate() {
  const storage = await StorageFactory.createAndConnect();

  console.log('\n=== Starting Dock Config Migration ===\n');

  // Get all configurations for default-user
  const configs = await storage.findByUserId('default-user', false);

  console.log(`Found ${configs.length} configurations for default-user\n`);

  // Track if we've created the singleton dock config
  let dockMenuItemsConfig: UnifiedConfig | null = null;

  // Process each config
  for (const config of configs) {
    console.log(`\nProcessing config: ${config.name} (${config.configId})`);
    console.log(`  Component: ${config.componentType}/${config.componentSubType}`);

    // Check if this config has menuItems
    if (config.config && 'menuItems' in config.config && Array.isArray(config.config.menuItems)) {
      console.log(`  ✓ Found menuItems (${config.config.menuItems.length} items)`);

      // Create/update the singleton dock menu items config
      if (!dockMenuItemsConfig) {
        console.log('  → Creating singleton DockApplicationsMenuItems config');
        dockMenuItemsConfig = {
          configId: uuidv4(),
          appId: config.appId,
          userId: config.userId,
          componentType: 'Dock',
          componentSubType: 'DockApplicationsMenuItems',
          name: 'Applications Menu',
          description: 'Dock Applications Button Menu Items (Singleton)',
          icon: config.icon,
          config: {
            menuItems: config.config.menuItems
          },
          settings: [],
          activeSetting: 'default',
          tags: ['dock', 'applications', 'menu'],
          category: 'dock',
          isShared: false,
          isDefault: true,  // Mark as default
          isLocked: false,
          createdBy: config.userId,
          lastUpdatedBy: config.userId,
          creationTime: new Date(),
          lastUpdated: new Date()
        };

        await storage.create(dockMenuItemsConfig);
        console.log(`  ✓ Created DockApplicationsMenuItems config: ${dockMenuItemsConfig.configId}`);
      } else {
        console.log('  ℹ Singleton DockApplicationsMenuItems already exists, merging menuItems');
        // Merge menu items if multiple configs had them (unlikely but handle it)
        const existingItems = (dockMenuItemsConfig.config as any).menuItems || [];
        const newItems = config.config.menuItems;

        // Simple merge - in production you'd want to check for duplicates
        (dockMenuItemsConfig.config as any).menuItems = [...existingItems, ...newItems];
        dockMenuItemsConfig.lastUpdated = new Date();

        await storage.update(dockMenuItemsConfig.configId, dockMenuItemsConfig);
        console.log(`  ✓ Updated DockApplicationsMenuItems config`);
      }

      // If this was a data provider config mixed with dock items, clean it
      if (config.componentType === 'dock' && 'providerType' in config.config) {
        console.log('  → Converting to pure DataProvider config');

        // Extract data provider fields
        const { menuItems, ...dataProviderConfig } = config.config;

        // Create new DataProvider config
        const providerType = (config.config as any).providerType;
        const newProviderConfig: UnifiedConfig = {
          ...config,
          configId: uuidv4(),
          componentType: 'DataProvider',
          componentSubType: providerType === 'stomp' ? 'Stomp' :
                           providerType === 'rest' ? 'Rest' :
                           providerType === 'websocket' ? 'WebSocket' :
                           providerType === 'socketio' ? 'SocketIO' : 'Mock',
          name: `${config.name} (Data Provider)`,
          config: dataProviderConfig,
          creationTime: new Date(),
          lastUpdated: new Date()
        };

        await storage.create(newProviderConfig);
        console.log(`  ✓ Created DataProvider config: ${newProviderConfig.configId}`);

        // Delete old mixed config
        await storage.delete(config.configId, config.userId);
        console.log(`  ✓ Deleted old mixed config: ${config.configId}`);
      }
    } else {
      console.log('  - No menuItems found, skipping');
    }
  }

  // Summary
  console.log('\n=== Migration Complete ===\n');

  const finalConfigs = await storage.findByUserId('default-user', false);

  console.log('Final configuration summary:');
  for (const config of finalConfigs) {
    console.log(`  ${config.componentType}/${config.componentSubType}: ${config.name}`);
    if (config.componentType === 'Dock' && config.componentSubType === 'DockApplicationsMenuItems') {
      const menuCount = (config.config as any).menuItems?.length || 0;
      console.log(`    → ${menuCount} menu items`);
    }
  }

  await storage.close();
  console.log('\nMigration complete!');
}

// Run migration
migrate().catch(console.error);
