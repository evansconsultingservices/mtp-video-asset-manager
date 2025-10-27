/**
 * Menu configuration for Video Asset Manager
 * This configuration is dynamically loaded by the parent shell app
 * to populate the navigation sidebar and provide version information
 */

// Load version info (generated at build time)
let versionInfo = null;
try {
  versionInfo = require('./version.json');
} catch (error) {
  // Version info not available (dev mode without build)
  versionInfo = {
    version: 'dev',
    buildTimestamp: new Date().toISOString(),
    gitCommit: 'unknown',
    gitBranch: 'unknown',
    environment: 'development',
    buildNumber: 0,
  };
}

export const menuConfig = {
  version: versionInfo,
  items: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/',
    },
  ],
};
