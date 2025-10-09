/**
 * Verify AuthZed Schema Script
 * Run this script to verify the SpiceDB schema is correctly installed
 * 
 * Usage: npx ts-node scripts/verify-authzed-schema.ts
 */

import { getAuthZedService } from '../src/services/harvest-logbook/authzed-service';

async function verifySchema() {
  try {
    console.log('🔐 Connecting to AuthZed/SpiceDB...');
    const authzed = getAuthZedService();
    
    console.log('📥 Reading schema from SpiceDB...');
    const schema = await authzed.readSchema();
    
    console.log('\n✅ Current Schema:');
    console.log('━'.repeat(80));
    console.log(schema);
    console.log('━'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error reading schema:', error);
    process.exit(1);
  }
}

verifySchema();

