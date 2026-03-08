/**
 * Authentication Middleware for 6-Component Platform Integration
 * Implements JWT-based authentication with RBAC authorization
 *
 * Security Features:
 * - JWT token validation with RSA-256 signatures
 * - Role-based access control (RBAC)
 * - Session management with automatic renewal
 * - Multi-factor authentication support
 * - Rate limiting per user/IP
 */
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { SecurityAuditLogger } from './audit-logger';
export interface AuthenticationContext {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    issueTime: Date;
    expiryTime: Date;
    lastActivity: Date;
    mfaVerified: boolean;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface TokenPayload {
    sub: string;
    username: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
    iat: number;
    exp: number;
    aud: string;
    iss: string;
    securityLevel: string;
    mfaVerified: boolean;
}
export interface AuthenticationError {
    code: string;
    message: string;
    statusCode: number;
    timestamp: Date;
    ipAddress?: string;
    userId?: string;
}
export declare class AuthenticationMiddleware extends EventEmitter {
    private auditLogger;
    private activeSessions;
    private failedAttempts;
    private refreshTokens;
    private readonly jwtSecret;
    private readonly refreshSecret;
    constructor(auditLogger: SecurityAuditLogger);
    /**
     * Express middleware for authentication
     */
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware for component-specific authorization
     */
    authorizeComponent: (componentId: string, requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Generate authentication token for user
     */
    generateToken(user: {
        userId: string;
        username: string;
        roles: string[];
        permissions: string[];
        securityLevel: string;
        mfaVerified: boolean;
    }, ipAddress: string): Promise<{
        token: string;
        refreshToken: string;
        expiryTime: Date;
    }>;
    /**
     * Refresh authentication token
     */
    refreshToken(refreshToken: string, ipAddress: string): Promise<{
        token: string;
        refreshToken: string;
        expiryTime: Date;
    }>;
    /**
     * Validate MFA code for elevated permissions
     */
    validateMFA(sessionId: string, code: string, ipAddress: string): Promise<void>;
    /**
     * Invalidate session and cleanup
     */
    invalidateSession(sessionId: string): Promise<void>;
    /**
     * Get current active sessions for monitoring
     */
    getActiveSessions(): AuthenticationContext[];
    /**
     * Extract JWT token from request
     */
    private extractToken;
    /**
     * Verify JWT token
     */
    private verifyToken;
    /**
     * Validate session context
     */
    private validateSession;
    /**
     * Check rate limiting for user
     */
    private checkRateLimit;
    /**
     * Generate refresh token
     */
    private generateRefreshToken;
    /**
     * Find session by refresh token
     */
    private findSessionByRefreshToken;
    /**
     * Verify MFA code (simplified implementation)
     */
    private verifyMFACode;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Generate secure key for JWT signing
     */
    private generateSecureKey;
    /**
     * Create authentication error
     */
    private createAuthError;
    /**
     * Handle authentication errors
     */
    private handleAuthenticationError;
    /**
     * Setup periodic cleanup of expired data
     */
    private setupCleanupInterval;
    /**
     * Cleanup expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Cleanup expired failed attempts
     */
    private cleanupExpiredAttempts;
}
//# sourceMappingURL=authentication-middleware.d.ts.map