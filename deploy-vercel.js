#!/usr/bin/env node

/**
 * Script automatizado para desplegar el frontend en Vercel
 * Uso: node deploy-vercel.js [railway-url]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} completado`, 'green');
    return result;
  } catch (error) {
    log(`❌ Error en ${description}: ${error.message}`, 'red');
    throw error;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function updatePackageJson() {
  const packagePath = path.join(__dirname, 'frontend', 'package.json');
  
  if (!checkFileExists(packagePath)) {
    log('❌ No se encontró frontend/package.json', 'red');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Asegurar que los scripts estén correctos
    packageJson.scripts = {
      ...packageJson.scripts,
      "build": "vite build",
      "preview": "vite preview --host 0.0.0.0 --port 3000"
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    log('✅ package.json actualizado', 'green');
    return true;
  } catch (error) {
    log(`❌ Error actualizando package.json: ${error.message}`, 'red');
    return false;
  }
}

function createVercelConfig(railwayUrl) {
  const vercelConfig = {
    "name": "reparaciones-juanpa-frontend",
    "version": 2,
    "buildCommand": "cd frontend && npm install && npm run build",
    "outputDirectory": "frontend/dist",
    "installCommand": "cd frontend && npm install",
    "framework": "vite",
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ],
    "env": railwayUrl ? {
      "VITE_API_URL": railwayUrl
    } : {},
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          },
          {
            "key": "Access-Control-Allow-Methods", 
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization"
          }
        ]
      }
    ]
  };

  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  log('✅ vercel.json creado/actualizado', 'green');
}

function checkDependencies() {
  const frontendPath = path.join(__dirname, 'frontend');
  
  if (!checkFileExists(frontendPath)) {
    log('❌ Directorio frontend no encontrado', 'red');
    return false;
  }

  try {
    process.chdir(frontendPath);
    runCommand('npm list --depth=0', 'Verificando dependencias');
    process.chdir('..');
    return true;
  } catch (error) {
    log('⚠️  Algunas dependencias pueden estar faltando', 'yellow');
    return true; // Continuar de todos modos
  }
}

function testBuild() {
  const frontendPath = path.join(__dirname, 'frontend');
  
  try {
    process.chdir(frontendPath);
    runCommand('npm run build', 'Probando build local');
    
    const distPath = path.join(frontendPath, 'dist');
    if (checkFileExists(distPath)) {
      log('✅ Build exitoso - directorio dist creado', 'green');
      process.chdir('..');
      return true;
    } else {
      log('❌ Build falló - no se creó directorio dist', 'red');
      process.chdir('..');
      return false;
    }
  } catch (error) {
    process.chdir('..');
    log(`❌ Error en build: ${error.message}`, 'red');
    return false;
  }
}

function deployToVercel() {
  try {
    // Verificar si Vercel CLI está instalado
    runCommand('vercel --version', 'Verificando Vercel CLI');
  } catch (error) {
    log('❌ Vercel CLI no está instalado', 'red');
    log('📥 Instala Vercel CLI: npm install -g vercel', 'yellow');
    return false;
  }

  try {
    const frontendPath = path.join(__dirname, 'frontend');
    process.chdir(frontendPath);

    log('🚀 Iniciando despliegue en Vercel...', 'magenta');
    runCommand('vercel --prod --yes', 'Desplegando en Vercel');

    process.chdir('..');
    return true;
  } catch (error) {
    process.chdir('..');
    log(`❌ Error en despliegue: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  const railwayUrl = process.argv[2];
  
  log('🚀 SCRIPT DE DESPLIEGUE VERCEL - REPARACIONES JUANPA', 'bright');
  log('=' .repeat(60), 'cyan');
  
  if (!railwayUrl) {
    log('⚠️  No se proporcionó URL de Railway', 'yellow');
    log('💡 Uso: node deploy-vercel.js https://tu-backend.railway.app', 'yellow');
    log('📝 Puedes continuar y configurar la URL manualmente en Vercel', 'yellow');
  } else {
    log(`🔗 URL de Railway: ${railwayUrl}`, 'cyan');
  }

  try {
    // Paso 1: Verificar estructura del proyecto
    log('\n📁 Verificando estructura del proyecto...', 'bright');
    if (!checkFileExists('frontend')) {
      throw new Error('Directorio frontend no encontrado');
    }

    // Paso 2: Actualizar configuraciones
    log('\n⚙️  Actualizando configuraciones...', 'bright');
    updatePackageJson();
    createVercelConfig(railwayUrl);

    // Paso 3: Verificar dependencias
    log('\n📦 Verificando dependencias...', 'bright');
    checkDependencies();

    // Paso 4: Probar build local
    log('\n🔨 Probando build local...', 'bright');
    if (!testBuild()) {
      throw new Error('Build local falló');
    }

    // Paso 5: Desplegar a Vercel
    log('\n🚀 Desplegando a Vercel...', 'bright');
    if (deployToVercel()) {
      log('\n🎉 ¡DESPLIEGUE EXITOSO!', 'green');
      log('=' .repeat(60), 'green');
      log('✅ Frontend desplegado en Vercel', 'green');
      log('🔗 Revisa tu dashboard de Vercel para obtener la URL final', 'cyan');
      
      if (railwayUrl) {
        log(`🔧 Backend configurado: ${railwayUrl}`, 'cyan');
      } else {
        log('⚠️  Recuerda configurar VITE_API_URL en Vercel dashboard', 'yellow');
      }
      
      log('\n📋 Próximos pasos:', 'bright');
      log('1. Ve a vercel.com y verifica el despliegue', 'cyan');
      log('2. Configura las variables de entorno si no lo hiciste', 'cyan');
      log('3. Prueba la aplicación en la URL de Vercel', 'cyan');
    }

  } catch (error) {
    log(`\n💥 ERROR: ${error.message}`, 'red');
    log('=' .repeat(60), 'red');
    log('📖 Consulta VERCEL_DEPLOYMENT_GUIDE.md para más ayuda', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}