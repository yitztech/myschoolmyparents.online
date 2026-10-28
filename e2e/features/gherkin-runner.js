// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stepDefinitions } from './steps/steps.js';

/**
 * Directorio de este módulo, sea ESM nativo o CJS: Playwright transpila los
 * .spec.ts a CJS en CI, y ahí `import.meta` no existe (SyntaxError). La misma
 * pieza en steps.js.
 */
const moduleDirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : fileURLToPath(new URL('.', import.meta.url));

/** Etiqueta que marca un escenario aún sin pasos implementados: se omite. */
const TAG_PENDIENTE = '@pendiente';

const isStepLine = (l) =>
  /^((Dado|Cuando) .+|Entonces .+|Y .+|Given .+|When .+|Then .+|And .+)/.test(l);

const rowCells = (l) =>
  l
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

/** Sustituye `<var>` por el valor de la fila de Ejemplos. */
const substitute = (text, header, row) => {
  let out = text;
  header.forEach((name, i) => {
    out = out.split(`<${name}>`).join(row[i] ?? '');
  });
  return out;
};

/**
 * Parsea un archivo .feature en estructuras legibles (en español, §36 de la
 * plataforma). Soporta etiquetas (líneas `@etiqueta`) y `Esquema del
 * escenario` con `Ejemplos`.
 */
export function parseFeatureFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const featureTags = [];
  const scenarios = [];
  let featureName = '';
  let pendingTags = [];
  let currentScenario = null;
  let examplesHeader = null;

  const pushScenario = () => {
    if (!currentScenario) return;
    const done = currentScenario;
    currentScenario = null;
    // La plantilla de un Esquema no se ejecuta: solo sus filas de Ejemplos.
    // Un Esquema sin Ejemplos es un .feature inválido: se omite entero.
    if (done.outline) return;
    if (done.tags.includes(TAG_PENDIENTE)) {
      // A propósito: escenario previsto pero aún sin implementación.
      return;
    }
    scenarios.push(done);
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('@')) {
      const tags = line.split(/\s+/).filter((t) => t.startsWith('@'));
      if (!featureName) featureTags.push(...tags);
      else pendingTags.push(...tags);
    } else if (line.startsWith('Característica:') || line.startsWith('Feature:')) {
      featureName = line.split(':')[1].trim();
    } else if (line.startsWith('Escenario:') || line.startsWith('Scenario:')) {
      pushScenario();
      currentScenario = {
        name: line.split(':').slice(1).join(':').trim(),
        tags: [...pendingTags],
        steps: [],
      };
      pendingTags = [];
    } else if (line.startsWith('Esquema del escenario:') || line.startsWith('Scenario Outline:')) {
      pushScenario();
      currentScenario = {
        name: line.split(':').slice(1).join(':').trim(),
        tags: [...pendingTags],
        steps: [],
        outline: true,
      };
      pendingTags = [];
    } else if (currentScenario?.outline && (line.startsWith('Ejemplos:') || line.startsWith('Examples:'))) {
      examplesHeader = null;
    } else if (currentScenario && isStepLine(line)) {
      const firstSpace = line.indexOf(' ');
      currentScenario.steps.push({
        keyword: line.slice(0, firstSpace).trim(),
        text: line.slice(firstSpace + 1).trim(),
      });
    } else if (currentScenario?.outline && line.startsWith('|')) {
      const cells = rowCells(line);
      if (!examplesHeader) {
        examplesHeader = cells;
        continue;
      }
      scenarios.push({
        name: `${currentScenario.name} · ${cells[0] ?? 'ejemplo'}`.trim(),
        tags: [...currentScenario.tags],
        steps: currentScenario.steps.map((st) => ({
          keyword: st.keyword,
          text: substitute(st.text, examplesHeader, cells),
        })),
      });
    }
  }
  pushScenario();


  if (featureTags.includes(TAG_PENDIENTE)) {
    return { featureName, scenarios: [], tags: featureTags, filePath };
  }

  return { featureName, scenarios, tags: featureTags, filePath };
}

/**
 * Obtiene todas las características Gherkin
 */
export function loadAllFeatures(featuresDir = moduleDirname) {
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
