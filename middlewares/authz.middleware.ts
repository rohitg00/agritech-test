/**
 * AuthZed Authorization Middleware
 * Enforces permission checks on API endpoints
 */

import { ApiMiddleware } from 'motia';
import { getAuthZedService } from '../src/services/harvest-logbook/authzed-service';

export interface AuthZedMiddlewareConfig {
  /**
   * Type of resource being accessed
   */
  resourceType: 'organization' | 'farm' | 'harvest_entry' | 'query_session';
  
  /**
   * Permission required to access this endpoint
   */
  permission: 'view' | 'edit' | 'query' | 'manage' | 'delete' | 'execute' | 'view_results';
  
  /**
   * Function to extract resource ID from request
   * If not provided, looks for 'farmId' or 'organizationId' in body or path params
   */
  getResourceId?: (req: any) => string;
  
  /**
   * Function to extract user ID from request
   * If not provided, looks for 'userId' in headers or body
   */
  getUserId?: (req: any) => string;
}

/**
 * Create authorization middleware for API steps
 */
export function createAuthZMiddleware(config: AuthZedMiddlewareConfig): ApiMiddleware {
  return async (req, ctx, next) => {
    const { logger } = ctx;
    
    try {
      // Extract user ID from request
      const userId = config.getUserId 
        ? config.getUserId(req)
        : (req.headers['x-user-id'] as string) || (req.body as any)?.userId;
      
      if (!userId) {
        logger.warn('Authorization failed: No user ID provided');
        return {
          status: 401,
          body: { 
            error: 'Unauthorized',
            message: 'User ID is required. Include x-user-id header or userId in request body.'
          }
        };
      }
      
      // Extract resource ID from request
      const resourceId = config.getResourceId
        ? config.getResourceId(req)
        : (req.body as any)?.farmId || (req.body as any)?.organizationId || req.pathParams?.id;
      
      if (!resourceId) {
        logger.warn('Authorization failed: No resource ID provided', { userId });
        return {
          status: 400,
          body: { 
            error: 'Bad Request',
            message: 'Resource ID is required (farmId, organizationId, or path parameter).'
          }
        };
      }
      
      // Check permission with AuthZed
      const authzed = getAuthZedService();
      const hasPermission = await authzed.checkPermission({
        userId,
        resourceType: config.resourceType,
        resourceId,
        permission: config.permission
      });
      
      if (!hasPermission) {
        logger.warn('Authorization failed: Permission denied', {
          userId,
          resourceType: config.resourceType,
          resourceId,
          permission: config.permission
        });
        
        return {
          status: 403,
          body: { 
            error: 'Forbidden',
            message: `You do not have ${config.permission} permission on this ${config.resourceType}.`
          }
        };
      }
      
      logger.info('Authorization successful', {
        userId,
        resourceType: config.resourceType,
        resourceId,
        permission: config.permission
      });
      
      // Add authorization context to request for use in handler
      (req as any).authz = {
        userId,
        resourceId,
        resourceType: config.resourceType,
        permission: config.permission
      };
      
      // Permission granted, continue to handler
      return await next();
      
    } catch (error) {
      logger.error('Authorization middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        status: 500,
        body: { 
          error: 'Internal Server Error',
          message: 'Authorization check failed. Please try again.'
        }
      };
    }
  };
}

/**
 * Middleware for harvest entry write operations
 */
export const harvestEntryEditMiddleware = createAuthZMiddleware({
  resourceType: 'farm',
  permission: 'edit'
});

/**
 * Middleware for query operations
 */
export const harvestQueryMiddleware = createAuthZMiddleware({
  resourceType: 'farm',
  permission: 'query'
});

/**
 * Middleware for view operations
 */
export const harvestViewMiddleware = createAuthZMiddleware({
  resourceType: 'farm',
  permission: 'view'
});

/**
 * Middleware for admin operations
 */
export const harvestManageMiddleware = createAuthZMiddleware({
  resourceType: 'farm',
  permission: 'manage'
});
