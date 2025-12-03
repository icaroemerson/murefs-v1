// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Usa o mecanismo de alias mais novo do Metro (funciona melhor que extraNodeModules)
config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'use-latest-callback': path.resolve(__dirname, 'src/shims/useLatestCallback.js'),
};

module.exports = config;
