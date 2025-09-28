#!/usr/bin/env node

/**
 * Script de troubleshooting para problemas con npm en el frontend
 * Uso: node troubleshoot-npm.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 TROUBLESHOOTING NPM - REPARACIONES JUANPA');
console.log('=' .repeat(50));

const frontendPath = path.join(__dirname, 'frontend');

function runCommand(command, description, cwd = frontendPath) {
  try {
    console.log(`\n🔄 ${description}...`);
    const result = execSync(command, {
      encoding: 'utf8',
      cwd: cwd,
      stdio: 'inherit'
    });
    console.log(`✅ ${description} completado`);
    return true;
  } catch (error) {
    console.log(`❌ Error en ${description}: ${error.message}`);
    return false;
  }
}

function checkNodeVersion() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`📦 Node.js: ${version}`);
    console.log(`📦 npm: ${npmVersion}`);
    return true;
  } catch (error) {
    console.log(`❌ Error obteniendo versiones: ${error.message}`);
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(frontendPath, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ No se encuentra package.json');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`📄 package.json válido - ${Object.keys(packageJson.dependencies || {}).length} dependencias`);
    return true;
  } catch (error) {
    console.log(`❌ Error en package.json: ${error.message}`);
    return false;
  }
}

function cleanAndReinstall() {
  console.log('\n🧹 Limpiando e instalando dependencias...');

  // Limpiar cache
  runCommand('npm cache clean --force', 'Limpiando cache de npm');

  // Eliminar node_modules y package-lock.json
  const nodeModulesPath = path.join(frontendPath, 'node_modules');
  const lockFilePath = path.join(frontendPath, 'package-lock.json');

  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('🗑️  Eliminado node_modules');
  }

  if (fs.existsSync(lockFilePath)) {
    fs.unlinkSync(lockFilePath);
    console.log('🗑️  Eliminado package-lock.json');
  }

  // Reinstalar
  return runCommand('npm install', 'Reinstalando dependencias');
}

function main() {
  console.log('🔍 Verificando entorno...\n');

  // Verificar versiones
  if (!checkNodeVersion()) {
    console.log('\n💡 Instala Node.js desde https://nodejs.org');
    process.exit(1);
  }

  // Verificar package.json
  if (!checkPackageJson()) {
    console.log('\n💡 Verifica que el archivo package.json esté presente y sea válido');
    process.exit(1);
  }

  // Intentar instalación normal
  console.log('\n📦 Intentando instalación normal...');
  if (runCommand('npm install', 'Instalando dependencias')) {
    console.log('\n✅ ¡Instalación exitosa!');
    console.log('🎯 Ahora puedes ejecutar: npm run build');
    return;
  }

  // Si falla, intentar limpieza y reinstalación
  console.log('\n🔄 Instalación falló, intentando limpieza...');
  if (cleanAndReinstall()) {
    console.log('\n✅ ¡Reinstalación exitosa!');
    console.log('🎯 Ahora puedes ejecutar: npm run build');
    return;
  }

  // Si todo falla, dar consejos
  console.log('\n❌ No se pudo resolver automáticamente');
  console.log('\n💡 Consejos para resolver manualmente:');
  console.log('1. Verifica tu conexión a internet');
  console.log('2. Intenta: npm install --verbose');
  console.log('3. Si hay errores de permisos, ejecuta como administrador');
  console.log('4. Borra manualmente node_modules y package-lock.json, luego npm install');
  console.log('5. Verifica que Node.js esté actualizado (versión 18+)');

  process.exit(1);
}

if (require.main === module) {
  main();
}