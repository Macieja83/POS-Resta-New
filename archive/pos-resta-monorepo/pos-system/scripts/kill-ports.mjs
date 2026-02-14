#!/usr/bin/env node

import { execSync } from 'child_process';
import { platform } from 'os';

const PORTS = [4000, 5173];

function killPort(port) {
  try {
    if (platform() === 'win32') {
      // Windows
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`, { stdio: 'pipe' });
    } else {
      // Unix/Linux/macOS
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' });
    }
    console.log(`✅ Port ${port} zwolniony`);
  } catch (error) {
    console.log(`ℹ️  Port ${port} już wolny`);
  }
}

console.log('🔫 Zabijanie portów przed startem...');
PORTS.forEach(killPort);
console.log('✅ Porty zwolnione');

