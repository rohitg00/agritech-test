/**
 * Setup AuthZed Schema Script
 * Run this script to initialize the SpiceDB schema
 * 
 * Usage: npx ts-node scripts/setup-authzed-schema.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAuthZedService } from '../src/services/harvest-logbook/authzed-service';

async function setupSchema() {
  try {
    console.log('📝 Reading schema file...');
    const schemaPath = path.join(__dirname, '../src/services/harvest-logbook/authzed.schema');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('🔐 Connecting to AuthZed/SpiceDB...');
    const authzed = getAuthZedService();
    
    console.log('📤 Writing schema to SpiceDB...');
    await authzed.writeSchema(schema);
    
    console.log('✅ Schema successfully written to SpiceDB!');
    console.log('\n📖 You can now verify the schema with:');
    console.log('   npx ts-node scripts/verify-authzed-schema.ts');
    
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    process.exit(1);
  }
}

setupSchema();

