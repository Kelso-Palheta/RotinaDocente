const { defineConfig } = require('vitest/config');
const path = require('path');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    transformMode: { web: [/\\.(js|jsx|ts|tsx)$/] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react': path.resolve(__dirname, './node_modules/react'),
    },
  },
});
