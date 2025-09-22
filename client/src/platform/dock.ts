import { Dock, DockButtonNames, type App, type RegistrationMetaInfo } from "@openfin/workspace";
import { CustomActionCallerType } from "@openfin/workspace-platform";
import type { PlatformSettings } from "./shapes";
import { launchApp } from "./launch";

/**
 * Register the dock provider.
 * @param platformSettings The platform settings from the manifest.
 * @param apps The list of apps from the manifest.
 * @returns The registration details for dock.
 */
export async function register(
  platformSettings: PlatformSettings,
  apps?: App[]
): Promise<RegistrationMetaInfo | undefined> {
  try {
    const metaInfo = await Dock.register({
      ...platformSettings,
      workspaceComponents: ["home", "store", "notifications"],
      disableUserRearrangement: true,
      buttons: [
        {
          type: "DropdownButton" as DockButtonNames.DropdownButton,
          tooltip: "Apps",
          id: "stern-apps",
          iconUrl: "http://localhost:5173/icons/app.svg",
          options: (apps ?? []).map((app) => ({
            tooltip: app.title,
            iconUrl: app.icons?.length ? app.icons[0].src : "http://localhost:5173/icons/platform-icon.svg",
            action: {
              id: "launch-app",
              customData: app
            }
          }))
        }
      ]
    });
    return metaInfo;
  } catch (err) {
    console.error("Error registering dock provider:", err);
  }
}

/**
 * Get custom actions for dock buttons.
 */
export function dockGetCustomActions(): Record<string, (e: {callerType: unknown, customData?: unknown}) => Promise<void>> {
  return {
    "launch-app": async (e): Promise<void> => {
      if (e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem) {
        try {
          await launchApp(e.customData as App);
        } catch (error) {
          console.error("Error launching app:", error);
        }
      }
    }
  };
}