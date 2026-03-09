/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import baseConfig from './vite.config';

const dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook'),
      }),
    ],
    test: {
      name: 'storybook',
      globals: true,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{ browser: 'chromium' }],
      },
      setupFiles: ['.storybook/vitest.setup.ts'],
    },
  })
);
