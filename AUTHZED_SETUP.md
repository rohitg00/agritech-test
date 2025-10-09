# AuthZed/SpiceDB Authorization Setup

This document provides detailed instructions for setting up authorization for the Harvest Logbook RAG system.

## Table of Contents

1. [Overview](#overview)
2. [Setup Options](#setup-options)
3. [Authorization Schema](#authorization-schema)
4. [Managing Permissions](#managing-permissions)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Overview

The Harvest Logbook system uses AuthZed/SpiceDB for fine-grained authorization. This enables:

- **Multi-tenant support**: Multiple organizations can use the system
- **Role-based access control**: Users have different permissions based on their roles
- **Resource-level permissions**: Control access to specific farms and harvest entries
- **Scalable authorization**: Handles complex permission hierarchies efficiently

## Setup Options

### Option 1: AuthZed Cloud (Recommended for Development)

1. **Create Account**
   - Visit [AuthZed Dashboard](https://app.authzed.com/)
   - Sign up for a free account

2. **Create Permission System**
   - Click "Create Permission System"
   - Name it (e.g., "Harvest Logbook Dev")

3. **Get API Token**
   - Go to API Tokens section
   - Create a new token (starts with `tc_`)
   - Copy the token

4. **Configure Environment**
   ```bash
   # Add to .env
   AUTHZED_ENDPOINT=grpc.authzed.com:443
   AUTHZED_TOKEN=tc_your_token_here
   ```

### Option 2: Local SpiceDB (Development/Testing)

1. **Run SpiceDB with Docker**
   ```bash
   docker run -d \
     --name spicedb \
     -p 50051:50051 \
     authzed/spicedb serve \
     --grpc-preshared-key "local_development_key"
   ```

2. **Configure Environment**
   ```bash
   # Add to .env
   AUTHZED_ENDPOINT=localhost:50051
   AUTHZED_TOKEN=local_development_key
   ```

### Option 3: Production SpiceDB

1. **Deploy SpiceDB**
   - Follow [SpiceDB deployment guide](https://docs.authzed.com/spicedb/installing)
   - Options: Kubernetes, Docker Compose, Cloud

2. **Configure with Database**
   ```bash
   docker run -d \
     --name spicedb \
     -p 50051:50051 \
     authzed/spicedb serve \
     --grpc-preshared-key "production_secure_key" \
     --datastore-engine postgres \
     --datastore-conn-uri "postgres://user:pass@localhost/spicedb"
   ```

3. **Configure Environment**
   ```bash
   # Add to .env
   AUTHZED_ENDPOINT=your-spicedb-host:50051
   AUTHZED_TOKEN=your_secure_production_key
   ```

## Authorization Schema

The system implements a hierarchical permission model:

```
definition user {}

definition organization {
    relation admin: user
    relation member: user
    
    permission view = admin + member
    permission edit = admin + member
    permission query = admin + member
    permission manage = admin
}

definition farm {
    relation organization: organization
    relation owner: user
    relation editor: user
    relation viewer: user
    
    permission view = viewer + editor + owner + organization->view
    permission edit = editor + owner + organization->edit
    permission query = viewer + editor + owner + organization->query
    permission manage = owner + organization->admin
}

definition harvest_entry {
    relation farm: farm
    relation creator: user
    
    permission view = farm->view
    permission edit = farm->edit
    permission delete = creator + farm->manage
}

definition query_session {
    relation farm: farm
    relation user: user
    
    permission execute = user & farm->query
    permission view_results = user & farm->view
}
```

### Resource Hierarchy

1. **Organization**: Top-level entity
   - Admins have full control
   - Members have view/edit/query access

2. **Farm**: Belongs to an organization
   - Inherits permissions from organization
   - Has specific owners, editors, and viewers

3. **Harvest Entry**: Individual log entry
   - Linked to a farm
   - Creator can delete their own entries

4. **Query Session**: RAG query execution
   - Must have query permission on farm
   - Must have view permission to see results

## Managing Permissions

### Initialize Schema

```bash
# Write schema to SpiceDB
npm run authz:setup

# Verify schema was written
npm run authz:verify
```

### Create Sample Permissions

```bash
# Creates sample org, farm, and user with permissions
npm run authz:sample
```

This creates:
- Organization: `org_1`
- Farm: `farm_1`
- User: `user_alice` (admin of org_1, owner of farm_1)

### Create Custom Permissions

#### TypeScript/Node.js

```typescript
import { getAuthZedService } from './src/services/harvest-logbook/authzed-service';

const authzed = getAuthZedService();

// Make user an admin of organization
await authzed.createRelationship({
  subjectType: 'user',
  subjectId: 'user_bob',
  relation: 'admin',
  resourceType: 'organization',
  resourceId: 'org_1'
});

// Make user a viewer of farm
await authzed.createRelationship({
  subjectType: 'user',
  subjectId: 'user_charlie',
  relation: 'viewer',
  resourceType: 'farm',
  resourceId: 'farm_1'
});

// Link farm to organization
await authzed.createRelationship({
  subjectType: 'organization',
  subjectId: 'org_1',
  relation: 'organization',
  resourceType: 'farm',
  resourceId: 'farm_2'
});
```

#### Check Permissions

```typescript
const canEdit = await authzed.checkPermission({
  userId: 'user_bob',
  resourceType: 'farm',
  resourceId: 'farm_1',
  permission: 'edit'
});

console.log(`Can edit: ${canEdit}`);
```

#### List Accessible Resources

```typescript
const farmIds = await authzed.lookupResources(
  'user_bob',
  'farm',
  'edit'
);

console.log('Farms user_bob can edit:', farmIds);
```

## Testing

### Test Authorization Flow

1. **Create sample permissions**
   ```bash
   npm run authz:sample
   ```

2. **Test authorized request**
   ```bash
   curl -X POST http://localhost:3000/harvest_logbook \
     -H "Content-Type: application/json" \
     -H "x-user-id: user_alice" \
     -d '{
       "content": "Test harvest entry",
       "farmId": "farm_1"
     }'
   ```

3. **Test unauthorized request** (should fail with 403)
   ```bash
   curl -X POST http://localhost:3000/harvest_logbook \
     -H "Content-Type: application/json" \
     -H "x-user-id: user_unauthorized" \
     -d '{
       "content": "Test harvest entry",
       "farmId": "farm_1"
     }'
   ```

### Common Test Scenarios

#### 1. Organization Admin Can Access All Farms

```typescript
// Make user org admin
await authzed.createRelationship({
  subjectType: 'user',
  subjectId: 'admin_user',
  relation: 'admin',
  resourceType: 'organization',
  resourceId: 'org_1'
});

// Link farm to org
await authzed.createRelationship({
  subjectType: 'organization',
  subjectId: 'org_1',
  relation: 'organization',
  resourceType: 'farm',
  resourceId: 'farm_1'
});

// Admin can now access farm_1
```

#### 2. Farm Editor Can Add Entries but Not Manage

```typescript
// Make user editor
await authzed.createRelationship({
  subjectType: 'user',
  subjectId: 'editor_user',
  relation: 'editor',
  resourceType: 'farm',
  resourceId: 'farm_1'
});

// Can edit
await authzed.checkPermission({
  userId: 'editor_user',
  resourceType: 'farm',
  resourceId: 'farm_1',
  permission: 'edit'
}); // true

// Cannot manage
await authzed.checkPermission({
  userId: 'editor_user',
  resourceType: 'farm',
  resourceId: 'farm_1',
  permission: 'manage'
}); // false
```

#### 3. Farm Viewer Can Query but Not Edit

```typescript
// Make user viewer
await authzed.createRelationship({
  subjectType: 'user',
  subjectId: 'viewer_user',
  relation: 'viewer',
  resourceType: 'farm',
  resourceId: 'farm_1'
});

// Can view and query
await authzed.checkPermission({
  userId: 'viewer_user',
  resourceType: 'farm',
  resourceId: 'farm_1',
  permission: 'view'
}); // true

// Cannot edit
await authzed.checkPermission({
  userId: 'viewer_user',
  resourceType: 'farm',
  resourceId: 'farm_1',
  permission: 'edit'
}); // false
```

## Troubleshooting

### Connection Errors

**Error**: `Failed to connect to AuthZed/SpiceDB`

**Solutions**:
1. Check `AUTHZED_ENDPOINT` is correct
2. Verify `AUTHZED_TOKEN` is set
3. Ensure SpiceDB is running (if local)
4. Check firewall/network settings

### Schema Errors

**Error**: `Schema write failed`

**Solutions**:
1. Verify token has write permissions
2. Check schema syntax
3. Run `npm run authz:verify` to see current schema

### Permission Denied

**Error**: `403 Forbidden - Permission denied`

**Solutions**:
1. Verify user has required permission:
   ```typescript
   const hasPermission = await authzed.checkPermission({
     userId: 'user_id',
     resourceType: 'farm',
     resourceId: 'farm_id',
     permission: 'edit'
   });
   ```
2. Check relationship exists:
   ```typescript
   const farms = await authzed.lookupResources('user_id', 'farm', 'edit');
   ```
3. Verify farm is linked to organization (if using org permissions)

### Missing User ID

**Error**: `401 Unauthorized - User ID is required`

**Solutions**:
1. Add `x-user-id` header to request
2. Or include `userId` in request body (not recommended)

## Best Practices

### 1. Always Use Organizations

Link farms to organizations for easier permission management:

```typescript
await authzed.createRelationship({
  subjectType: 'organization',
  subjectId: 'org_1',
  relation: 'organization',
  resourceType: 'farm',
  resourceId: 'farm_1'
});
```

### 2. Use Specific Roles

Assign the least privilege necessary:
- Viewers for read-only access
- Editors for data entry
- Owners for farm management
- Admins for organization management

### 3. Audit Permissions Regularly

List all permissions for a resource:

```typescript
// Get all users with edit access to farm
const editors = await authzed.lookupResources('farm_1', 'user', 'edit');
```

### 4. Test Before Production

Always test permission changes in development:

```bash
# Setup test permissions
npm run authz:sample

# Test with curl
curl -X POST http://localhost:3000/harvest_logbook/query \
  -H "x-user-id: user_alice" \
  -H "Content-Type: application/json" \
  -d '{"farmId": "farm_1", "query": "test"}'
```

### 5. Use Meaningful IDs

Use descriptive, human-readable IDs:
- Good: `org_acme_farms`, `farm_north_field`, `user_john_doe`
- Bad: `1`, `abc`, `x`

## Additional Resources

- [AuthZed Documentation](https://docs.authzed.com/)
- [SpiceDB GitHub](https://github.com/authzed/spicedb)
- [Permission Systems Playground](https://play.authzed.com/)
- [AuthZed Blog](https://authzed.com/blog)

---

**Questions?** Check the main [README.md](./README.md) for additional information.

