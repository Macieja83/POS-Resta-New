/**
 * Prosty skrypt do sprawdzenia połączenia z PostgreSQL
 */
const { execSync } = require('child_process');
require('dotenv').config();

console.log('\n🔍 Sprawdzam połączenie z PostgreSQL...\n');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_system';

console.log('📋 Connection String:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  // Sprawdź czy PostgreSQL odpowiada
  const { Client } = require('pg');
  
  (async () => {
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
      await client.connect();
      console.log('✅ Połączenie z PostgreSQL: SUKCES');
      
      const result = await client.query('SELECT version()');
      console.log('📊 Wersja PostgreSQL:', result.rows[0].version.split(' ')[1]);
      
      await client.end();
      
      console.log('\n✨ Wszystko gotowe do uruchomienia migracji!\n');
      console.log('Uruchom teraz:');
      console.log('  npm run db:generate  # Wygeneruj Prisma Client');
      console.log('  npm run db:migrate   # Uruchom migracje');
      console.log('  npm run db:seed      # Załaduj dane testowe\n');
      
    } catch (error) {
      console.error('❌ Błąd połączenia:', error.message);
      console.log('\n🔧 Rozwiązania:');
      console.log('  1. Upewnij się że PostgreSQL jest uruchomiony');
      console.log('  2. Sprawdź czy baza "pos_system" istnieje');
      console.log('  3. Zweryfikuj dane logowania w .env');
      console.log('\nDla Docker: docker start pos-postgres');
      console.log('Dla lokalnego: sprawdź services.msc (PostgreSQL service)\n');
    }
  })();
  
} catch (error) {
  console.error('❌ Błąd:', error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('\n📦 Brak pakietu "pg". Instaluję...\n');
    execSync('npm install --save-dev pg', { stdio: 'inherit' });
    console.log('\n✅ Zainstalowano. Uruchom skrypt ponownie.\n');
  }
}



