/**
 * Create Sample Permissions Script
 * Run this script to create sample organizations, farms, and user permissions
 * 
 * Usage: npx ts-node scripts/create-sample-permissions.ts
 */

import { getAuthZedService } from '../src/services/harvest-logbook/authzed-service';

async function createSamplePermissions() {
  try {
    console.log('🔐 Connecting to AuthZed/SpiceDB...');
    const authzed = getAuthZedService();
    
    // Sample data
    const orgId = 'org_1';
    const farmId = 'farm_1';
    const userId = 'user_alice';
    
    console.log('\n📝 Creating sample organization...');
    await authzed.createRelationship({
      subjectType: 'user',
      subjectId: userId,
      relation: 'admin',
      resourceType: 'organization',
      resourceId: orgId
    });
    console.log(`✅ Created: user:${userId} is admin of organization:${orgId}`);
    
    console.log('\n📝 Creating sample farm...');
    await authzed.createRelationship({
      subjectType: 'organization',
      subjectId: orgId,
      relation: 'organization',
      resourceType: 'farm',
      resourceId: farmId
    });
    console.log(`✅ Created: organization:${orgId} owns farm:${farmId}`);
    
    await authzed.createRelationship({
      subjectType: 'user',
      subjectId: userId,
      relation: 'owner',
      resourceType: 'farm',
      resourceId: farmId
    });
    console.log(`✅ Created: user:${userId} is owner of farm:${farmId}`);
    
    console.log('\n🔍 Verifying permissions...');
    
    // Check view permission
    const canView = await authzed.checkPermission({
      userId,
      resourceType: 'farm',
      resourceId: farmId,
      permission: 'view'
    });
    console.log(`Can user:${userId} view farm:${farmId}? ${canView ? '✅ Yes' : '❌ No'}`);
    
    // Check edit permission
    const canEdit = await authzed.checkPermission({
      userId,
      resourceType: 'farm',
      resourceId: farmId,
      permission: 'edit'
    });
    console.log(`Can user:${userId} edit farm:${farmId}? ${canEdit ? '✅ Yes' : '❌ No'}`);
    
    // Check query permission
    const canQuery = await authzed.checkPermission({
      userId,
      resourceType: 'farm',
      resourceId: farmId,
      permission: 'query'
    });
    console.log(`Can user:${userId} query farm:${farmId}? ${canQuery ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n✅ Sample permissions created successfully!');
    console.log('\n📖 You can now test the API with these credentials:');
    console.log(`   Header: x-user-id: ${userId}`);
    console.log(`   Body: { "farmId": "${farmId}", ... }`);
    
  } catch (error) {
    console.error('❌ Error creating sample permissions:', error);
    process.exit(1);
  }
}

createSamplePermissions();

