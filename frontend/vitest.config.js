const { defineConfig } = require('vitest/config');
const path = require('path');
const vite = require('vite');

const jsxInJsPlugin = () => ({
  name: 'jsx-in-js-plugin',
  enforce: 'pre',
  async transform(code, id) {
    if (id.endsWith('.js') && (code.includes('</') || code.includes('/>'))) {
      return vite.transformWithOxc(code, id, { lang: 'jsx' });
    }
  },
});

const sharedResolve = {
  alias: {
    '@': path.resolve(__dirname, './src'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    'react': path.resolve(__dirname, './node_modules/react'),
    '@testing-library/react': path.resolve(__dirname, './node_modules/@testing-library/react'),
    'xlsx': path.resolve(__dirname, './node_modules/xlsx'),
  },
};

const sharedServer = {
  fs: {
    allow: [path.resolve(__dirname, '..')],
  },
};

module.exports = defineConfig({
  plugins: [jsxInJsPlugin()],
  resolve: sharedResolve,
  server: sharedServer,
  test: {
    globals: true,
    projects: [
      {
        plugins: [jsxInJsPlugin()],
        resolve: sharedResolve,
        server: sharedServer,
        test: {
          name: 'dom',
          globals: true,
          environment: 'jsdom',
          include: [
            '../tests/unit/components/**/*.test.{js,jsx}',
            '../tests/e2e/**/*.test.{js,jsx}',
          ],
          exclude: ['**/node_modules/**'],
          setupFiles: [path.resolve(__dirname, './src/setupTests.js')],
        },
      },
      {
        plugins: [jsxInJsPlugin()],
        resolve: sharedResolve,
        server: sharedServer,
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['../tests/**/*.test.{js,jsx}'],
          exclude: ['../tests/unit/components/**', '../tests/e2e/**', '**/node_modules/**'],
        },
      },
    ],
  },
});
