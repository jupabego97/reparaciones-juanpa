#!/usr/bin/env node

/**
 * Script simple para desplegar frontend en Vercel
 * Uso: node deploy-simple.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 DESPLIEGUE SIMPLE A VERCEL');
console.log('=' .repeat(40));

try {
  // Cambiar al directorio frontend
  const frontendPath = path.join(__dirname, 'frontend');
  process.chdir(frontendPath);

  console.log('📁 Cambiando a directorio frontend...');
  console.log(`📍 Directorio actual: ${process.cwd()}`);

  // Verificar que estamos en el directorio correcto
  const packageJson = require('./package.json');
  console.log(`📦 Proyecto: ${packageJson.name}`);

  // Desplegar con confirmación automática
  console.log('🚀 Desplegando a Vercel...');
  const result = execSync('vercel --prod --yes', {
    encoding: 'utf8',
    stdio: 'inherit'
  });

  console.log('✅ ¡Despliegue completado!');
  console.log('🌐 Revisa tu dashboard de Vercel para obtener la URL final');

} catch (error) {
  console.error('❌ Error en el despliegue:', error.message);
  console.log('\n💡 Alternativas:');
  console.log('1. Ve a vercel.com y conecta tu repo manualmente');
  console.log('2. Configura Root Directory: frontend');
  console.log('3. Framework: Vite');
  console.log('4. Variable: VITE_API_URL=https://reparaciones-back-production.up.railway.app');
  process.exit(1);
}