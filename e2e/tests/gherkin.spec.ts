import { test } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeScenario, loadAllFeatures } from '../features/gherkin-runner.js';

// Los escenarios de gherkin hacen OCR real contra el stack: los 60 s por
// defecto se quedan cortos en los que tocan la cola de OCR.
test.setTimeout(120_000);

const featuresDir = resolve(fileURLToPath(import.meta.url), '..', '..', 'features');
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
