import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare global {
  interface ImportMeta {
    // webpack 5 ESM context loader
    webpackContext(
      request: string,
      options: { recursive?: boolean; regExp?: RegExp }
    ): {
      keys(): string[];
      <T>(id: string): T;
    };
  }
}

export {};

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: true }
  }
);

// Load all spec files.
// In webpack ESM builds, use import.meta.webpackContext instead of require.context.
const context = import.meta.webpackContext('./', {
  recursive: true,
  regExp: /\.spec\.ts$/
});
context.keys().forEach(context);
