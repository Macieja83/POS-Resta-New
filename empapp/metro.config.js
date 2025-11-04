const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Normalize paths for Windows - always use forward slashes
// This is critical for Windows where backslashes cause path resolution issues
const normalizePath = (filePath) => {
  if (!filePath) return filePath;
  return String(filePath).replace(/\\/g, '/');
};

// Get project root and normalize it
const projectRoot = path.resolve(__dirname);
const normalizedRoot = normalizePath(projectRoot);

// Get default config with normalized root path
const config = getDefaultConfig(normalizedRoot);

// Enhanced resolver for Windows compatibility
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
  platforms: ['ios', 'android', 'native', 'web'],
};

// Custom resolver to normalize all paths on Windows
const originalResolveRequest = config.resolver?.resolveRequest;
if (originalResolveRequest) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Normalize module name to handle Windows backslashes
    const normalizedModuleName = normalizePath(moduleName);
    const result = originalResolveRequest(context, normalizedModuleName, platform);
    
    // Normalize result paths if returned
    if (result && result.filePath) {
      result.filePath = normalizePath(result.filePath);
    }
    
    return result;
  };
}

// Ensure proper path handling on Windows - use normalized paths
config.watchFolders = [normalizedRoot];

// Transformer configuration for better performance
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
