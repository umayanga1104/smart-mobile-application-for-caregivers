const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Custom Expo config plugin to add all required Health Connect manifest entries.
 * This ensures the entries survive `npx expo prebuild --clean`.
 */
function withHealthConnect(config, { permissions = [] } = {}) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // 1. Add Health Connect permissions to <uses-permission>
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }
    const existingPerms = manifest["uses-permission"].map(
      (p) => p.$?.["android:name"]
    );
    for (const perm of permissions) {
      if (!existingPerms.includes(perm)) {
        manifest["uses-permission"].push({
          $: { "android:name": perm },
        });
      }
    }

    // 2. Add Health Connect package to <queries>
    if (!manifest.queries) {
      manifest.queries = [];
    }
    // Check if the health connect package query already exists
    let hasHealthPackageQuery = false;
    for (const query of manifest.queries) {
      if (query.package) {
        for (const pkg of query.package) {
          if (pkg.$?.["android:name"] === "com.google.android.apps.healthdata") {
            hasHealthPackageQuery = true;
            break;
          }
        }
      }
    }
    if (!hasHealthPackageQuery) {
      // Find existing queries element or add to first one
      if (manifest.queries.length === 0) {
        manifest.queries.push({
          package: [
            { $: { "android:name": "com.google.android.apps.healthdata" } },
          ],
        });
      } else {
        const firstQuery = manifest.queries[0];
        if (!firstQuery.package) {
          firstQuery.package = [];
        }
        firstQuery.package.push({
          $: { "android:name": "com.google.android.apps.healthdata" },
        });
      }
    }

    // 3. Fix intent filters on MainActivity
    const application = manifest.application?.[0];
    if (application) {
      const mainActivity = application.activity?.find(
        (a) =>
          a.$?.["android:name"] === ".MainActivity"
      );

      if (mainActivity) {
        if (!mainActivity["intent-filter"]) {
          mainActivity["intent-filter"] = [];
        }

        // 3a. Remove any existing ACTION_SHOW_PERMISSIONS_RATIONALE (from library plugin)
        //     and re-add it with DEFAULT category
        mainActivity["intent-filter"] = mainActivity["intent-filter"].filter(
          (f) =>
            !f.action?.some(
              (a) =>
                a.$?.["android:name"] ===
                "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"
            )
        );
        // Add a complete rationale filter with DEFAULT category
        mainActivity["intent-filter"].push({
          action: [
            {
              $: {
                "android:name":
                  "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE",
              },
            },
          ],
          category: [
            {
              $: { "android:name": "android.intent.category.DEFAULT" },
            },
          ],
        });

        // 3b. Add VIEW_PERMISSION_USAGE intent filter (makes app visible in Health Connect)
        const hasViewPermFilter = mainActivity["intent-filter"].some((f) =>
          f.action?.some(
            (a) =>
              a.$?.["android:name"] ===
              "android.intent.action.VIEW_PERMISSION_USAGE"
          )
        );
        if (!hasViewPermFilter) {
          mainActivity["intent-filter"].push({
            action: [
              {
                $: {
                  "android:name":
                    "android.intent.action.VIEW_PERMISSION_USAGE",
                },
              },
            ],
            category: [
              {
                $: { "android:name": "android.intent.category.HEALTH_PERMISSIONS" },
              },
            ],
          });
        }
      }
    }

    return config;
  });
}

module.exports = withHealthConnect;
