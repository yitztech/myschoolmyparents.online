import { test } from '@playwright/test';
import { resolve } from 'node:path';
import { executeScenario, loadAllFeatures } from '../features/gherkin-runner.js';

const featuresDir = resolve(__dirname, '../features');
const features = loadAllFeatures(featuresDir);

for (const feature of features) {
  test.describe(`Gherkin · ${feature.featureName}`, () => {
    for (const scenario of feature.scenarios) {
      test(scenario.name, async ({ page }) => {
        await executeScenario(scenario, { page });
      });
    }
  });
}
