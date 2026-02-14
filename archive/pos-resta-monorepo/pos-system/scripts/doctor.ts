#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: '✅' | '⚠️' | '❌';
  message: string;
  details?: string;
}

class EnvironmentDoctor {
  private results: CheckResult[] = [];

  async runChecks() {
    console.log('🏥 POS System Environment Doctor');
    console.log('================================\n');

    this.checkNodeVersion();
    this.checkPorts();
    this.checkEnvFiles();
    this.checkDatabase();
    this.checkPrisma();
    this.checkViteProxy();
    this.checkCORS();

    this.printResults();
    this.printSummary();
  }

  private checkNodeVersion() {
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      
      if (major >= 20) {
        this.addResult('Node.js Version', '✅', `Node.js ${version} (>=20.0.0)`, 'Wymagana wersja spełniona');
      } else {
        this.addResult('Node.js Version', '❌', `Node.js ${version} (<20.0.0)`, 'Wymagana wersja 20+');
      }
    } catch (error) {
      this.addResult('Node.js Version', '❌', 'Nie można sprawdzić wersji Node.js', error.message);
    }
  }

  private checkPorts() {
    const ports = [4000, 5173];
    
    ports.forEach(port => {
      try {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
        this.addResult(`Port ${port}`, '⚠️', `Port ${port} jest zajęty`, 'Uruchom "npm run predev" aby zwolnić');
      } catch (error) {
        this.addResult(`Port ${port}`, '✅', `Port ${port} jest wolny`, 'Gotowy do użycia');
      }
    });
  }

  private checkEnvFiles() {
    const envFiles = [
      'apps/backend/.env',
      'apps/frontend/.env'
    ];

    envFiles.forEach(envFile => {
      if (existsSync(envFile)) {
        this.addResult(`Env File: ${envFile}`, '✅', 'Plik .env istnieje', 'Konfiguracja obecna');
      } else {
        this.addResult(`Env File: ${envFile}`, '⚠️', 'Plik .env nie istnieje', 'Skopiuj z .env.example');
      }
    });
  }

  private checkDatabase() {
    try {
      // Sprawdź czy Docker działa
      execSync('docker ps', { stdio: 'pipe' });
      this.addResult('Docker', '✅', 'Docker działa', 'Kontenery mogą być uruchomione');
    } catch (error) {
      this.addResult('Docker', '⚠️', 'Docker nie działa', 'Uruchom Docker Desktop');
    }

    // Sprawdź połączenie do bazy (jeśli .env istnieje)
    const backendEnv = join(process.cwd(), 'apps/backend/.env');
    if (existsSync(backendEnv)) {
      try {
        const envContent = readFileSync(backendEnv, 'utf8');
        if (envContent.includes('DATABASE_URL')) {
          this.addResult('Database URL', '✅', 'DATABASE_URL skonfigurowany', 'Połączenie do bazy gotowe');
        } else {
          this.addResult('Database URL', '❌', 'Brak DATABASE_URL', 'Dodaj DATABASE_URL do .env');
        }
      } catch (error) {
        this.addResult('Database URL', '❌', 'Nie można odczytać .env', error.message);
      }
    }
  }

  private checkPrisma() {
    try {
      execSync('npx prisma generate', { 
        cwd: join(process.cwd(), 'apps/backend'),
        stdio: 'pipe' 
      });
      this.addResult('Prisma Client', '✅', 'Prisma Client wygenerowany', 'Gotowy do użycia');
    } catch (error) {
      this.addResult('Prisma Client', '❌', 'Błąd generowania Prisma Client', 'Uruchom "npm run fix:prisma"');
    }
  }

  private checkViteProxy() {
    const viteConfig = join(process.cwd(), 'apps/frontend/vite.config.ts');
    if (existsSync(viteConfig)) {
      try {
        const configContent = readFileSync(viteConfig, 'utf8');
        if (configContent.includes('proxy') && configContent.includes('localhost:4000')) {
          this.addResult('Vite Proxy', '✅', 'Proxy skonfigurowany', 'Frontend → Backend proxy OK');
        } else {
          this.addResult('Vite Proxy', '❌', 'Proxy nie skonfigurowany', 'Sprawdź vite.config.ts');
        }
      } catch (error) {
        this.addResult('Vite Proxy', '❌', 'Nie można odczytać vite.config.ts', error.message);
      }
    } else {
      this.addResult('Vite Config', '❌', 'vite.config.ts nie istnieje', 'Sprawdź strukturę projektu');
    }
  }

  private checkCORS() {
    const backendEnv = join(process.cwd(), 'apps/backend/.env');
    if (existsSync(backendEnv)) {
      try {
        const envContent = readFileSync(backendEnv, 'utf8');
        if (envContent.includes('CORS_ORIGIN=http://localhost:5173')) {
          this.addResult('CORS Configuration', '✅', 'CORS skonfigurowany', 'Frontend może łączyć się z backendem');
        } else {
          this.addResult('CORS Configuration', '⚠️', 'CORS może nie być skonfigurowany', 'Sprawdź CORS_ORIGIN w .env');
        }
      } catch (error) {
        this.addResult('CORS Configuration', '❌', 'Nie można sprawdzić CORS', error.message);
      }
    }
  }

  private addResult(name: string, status: '✅' | '⚠️' | '❌', message: string, details?: string) {
    this.results.push({ name, status, message, details });
  }

  private printResults() {
    this.results.forEach(result => {
      console.log(`${result.status} ${result.name}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   → ${result.details}`);
      }
      console.log('');
    });
  }

  private printSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === '✅').length;
    const warnings = this.results.filter(r => r.status === '⚠️').length;
    const errors = this.results.filter(r => r.status === '❌').length;

    console.log('📊 Podsumowanie:');
    console.log(`   ✅ Przeszło: ${passed}`);
    console.log(`   ⚠️  Ostrzeżenia: ${warnings}`);
    console.log(`   ❌ Błędy: ${errors}`);
    console.log(`   📈 Ogółem: ${total}`);

    if (errors === 0) {
      console.log('\n🎉 Środowisko gotowe do uruchomienia!');
      console.log('   Uruchom: npm run dev');
    } else {
      console.log('\n🔧 Napraw błędy przed uruchomieniem:');
      console.log('   npm run fix:cache    - Wyczyść cache');
      console.log('   npm run fix:prisma   - Napraw Prisma');
      console.log('   npm run doctor       - Sprawdź ponownie');
    }

    // Zwróć kod wyjścia
    process.exit(errors === 0 ? 0 : 1);
  }
}

// Uruchom diagnostykę
const doctor = new EnvironmentDoctor();
doctor.runChecks();

