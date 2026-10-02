import * as React from 'react';
import ReactDefault from 'react';
import '@testing-library/jest-dom/vitest';

// Polyfill resiliente para React.act (compatibilidade React 19 / Testing Library / Vite)
const actImpl =
  React.act ||
  ReactDefault?.act ||
  (typeof globalThis !== 'undefined' && globalThis.React?.act) ||
  ((cb) => {
    const res = cb();
    if (res && typeof res?.then === 'function') {
      return res;
    }
    return Promise.resolve();
  });

if (typeof React.act !== 'function') {
  try {
    Object.defineProperty(React, 'act', {
      value: actImpl,
      writable: true,
      configurable: true,
    });
  } catch (_e) {
    React.act = actImpl;
  }
}

if (ReactDefault && typeof ReactDefault.act !== 'function') {
  try {
    Object.defineProperty(ReactDefault, 'act', {
      value: actImpl,
      writable: true,
      configurable: true,
    });
  } catch (_e) {
    ReactDefault.act = actImpl;
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (!globalThis.React) {
    globalThis.React = ReactDefault || React;
  }
  if (!globalThis.React.act) {
    try {
      Object.defineProperty(globalThis.React, 'act', {
        value: actImpl,
        writable: true,
        configurable: true,
      });
    } catch (_e) {
      globalThis.React.act = actImpl;
    }
  }
}
