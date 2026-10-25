#!/usr/bin/env node
/**
 * Diagnóstico del entorno de desarrollo local (scripts/dev-doctor.mjs).
 * Verifica versiones, existencia de .env.dev, puertos y conectividad básica.
 */
import { existsSync, readFileSync, copyFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
console.log('🔍 MySchoolMyParents — Diagnóstico del entorno de desarrollo\n');

let issues = 0;

// 1. Node.js
const currentVer = process.versions.node;
let nvmrcVer = '24';
try {
  nvmrcVer = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
} catch {}
const major = parseInt(currentVer.split('.')[0], 10);
if (major < 22) {
  console.error(`❌ Versión de Node.js demasiado baja: v${currentVer} (requerida: v${nvmrcVer} o >= 22)`);
  issues++;
} else {
  console.log(`✅ Node.js: v${currentVer} (compatible con .nvmrc: v${nvmrcVer})`);
}

// 2. .env.dev
const envDevPath = path.join(root, '.env.dev');
const envExamplePath = path.join(root, '.env.example');
if (!existsSync(envDevPath)) {
  if (existsSync(envExamplePath)) {
    console.log('⚠️  .env.dev no existía. Creando .env.dev a partir de .env.example...');
    copyFileSync(envExamplePath, envDevPath);
    console.log('✅ Creado .env.dev automáticamente');
  } else {
    console.error('❌ Falta .env.example para generar .env.dev');
    issues++;
  }
} else {
  console.log('✅ Archivo .env.dev presente');
}

// 3. Docker & Docker Compose
try {
  const dockerVer = execSync('docker --version', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  console.log(`✅ Docker CLI: ${dockerVer}`);
} catch {
  console.error('❌ Docker CLI no disponible en PATH');
  issues++;
}

try {
  const composeVer = execSync('docker compose version', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  console.log(`✅ Docker Compose: ${composeVer}`);
} catch {
  console.error('❌ Docker Compose no disponible');
  issues++;
}

// 4. Puertos de desarrollo
const PORTS = [
  { port: 6060, name: 'nginx (dev gateway)' },
  { port: 5173, name: 'Vite frontend' },
  { port: 3001, name: 'NestJS backend' },
  { port: 5462, name: 'PostgreSQL' },
  { port: 8027, name: 'Mailpit (SMTP web UI)' },
];

async function checkPort(port) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(false);
      else resolve(true);
    });
    s.once('listening', () => {
      s.close();
      resolve(true);
    });
    s.listen(port, '127.0.0.1');
  });
}

console.log('\nComprobando disponibilidad de puertos de desarrollo:');
for (const item of PORTS) {
  const free = await checkPort(item.port);
  if (!free) {
    console.log(`ℹ️  Puerto ${item.port} (${item.name}): en uso (puede ser un contenedor del proyecto ya levantado)`);
  } else {
    console.log(`✅ Puerto ${item.port} (${item.name}): libre`);
  }
}

// 5. Dependencias locales
const PKG_PATHS = [
  'apps/backend/package.json',
  'apps/frontend/package.json',
  'apps/mobile/package.json',
  'e2e/package.json',
];

let allPkgs = true;
for (const p of PKG_PATHS) {
  if (!existsSync(path.join(root, p))) {
    console.error(`❌ Falta ${p}`);
    allPkgs = false;
    issues++;
  }
}
if (allPkgs) {
  console.log('✅ Estructura de paquetes apps/{backend,frontend,mobile} y e2e encontrada');
}

console.log('\n' + (issues === 0 ? '✨ Diagnóstico completado: El entorno está listo para trabajar con `npm run up`.' : `⚠️ Se detectaron ${issues} problema(s). Revisa las advertencias anteriores.`));
process.exit(issues === 0 ? 0 : 1);
