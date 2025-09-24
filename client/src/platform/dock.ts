import { getCurrentSync } from '@openfin/workspace-platform';
import { CustomActionCallerType } from "@openfin/workspace-platform";

/**
 * Simplified dock custom actions
 */
export function dockGetCustomActions() {
  return {
    "launch-app": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        const app = e.customData;
        try {
          if (app.manifestType === "view" || app.url) {
            // Launch as a view in a new window
            const platform = getCurrentSync();
            await platform.createWindow({
              name: `${app.appId}-window-${Date.now()}`,
              url: app.url || app.manifest,
              defaultWidth: 1200,
              defaultHeight: 800,
              autoShow: true,
              frame: true,
              contextMenu: true
            });
          } else if (app.manifest) {
            // Launch as a separate application from manifest
            await fin.Application.startFromManifest(app.manifest);
          } else {
            console.error('App configuration missing url or manifest:', app);
          }
        } catch (error) {
          console.error('Failed to launch app:', error);
        }
      }
    },

    "set-theme": async (e: any) => {
      if (e.callerType === CustomActionCallerType.CustomDropdownItem) {
        const theme = e.customData;
        try {
          const platform = getCurrentSync();
          await platform.Theme.setSelectedScheme(theme);
        } catch (error) {
          console.error('Failed to set theme:', error);
        }
      }
    }
  };
}