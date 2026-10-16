// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stepDefinitions } from './steps/steps.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Parsea un archivo .feature en estructuras legibles
 */
export function parseFeatureFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let featureName = '';
  const scenarios = [];
  let currentScenario = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('Característica:') || line.startsWith('Feature:')) {
      featureName = line.split(':')[1].trim();
    } else if (line.startsWith('Escenario:') || line.startsWith('Scenario:')) {
      if (currentScenario) scenarios.push(currentScenario);
      currentScenario = {
        name: line.split(':')[1].trim(),
        steps: [],
      };
    } else if (
      currentScenario &&
      (line.startsWith('Dado ') ||
        line.startsWith('Cuando ') ||
        line.startsWith('Entonces ') ||
        line.startsWith('Y ') ||
        line.startsWith('Given ') ||
        line.startsWith('When ') ||
        line.startsWith('Then ') ||
        line.startsWith('And '))
    ) {
      const firstSpace = line.indexOf(' ');
      const keyword = line.slice(0, firstSpace).trim();
      const text = line.slice(firstSpace + 1).trim();
      currentScenario.steps.push({ keyword, text, line });
    }
  }

  if (currentScenario) scenarios.push(currentScenario);

  return { featureName, scenarios, filePath };
}

/**
 * Obtiene todas las características Gherkin
 */
export function loadAllFeatures(featuresDir = __dirname) {
  const files = readdirSync(featuresDir).filter((f) => f.endsWith('.feature'));
  return files.map((file) => parseFeatureFile(join(featuresDir, file)));
}

/**
 * Ejecuta un escenario paso a paso en el contexto de Playwright
 */
export async function executeScenario(scenario, { page }) {
  const world = {};

  for (const step of scenario.steps) {
    let matched = null;
    let matchResult = null;

    for (const def of stepDefinitions) {
      const match = step.text.match(def.pattern);
      if (match) {
        matched = def;
        matchResult = match.slice(1);
        break;
      }
    }

    if (!matched) {
      throw new Error(`Paso no implementado: "${step.keyword} ${step.text}"`);
    }

    try {
      await matched.fn({ page, world }, ...matchResult);
    } catch (err) {
      console.error(`Error en paso: "${step.keyword} ${step.text}"`);
      throw err;
    }
  }
}
