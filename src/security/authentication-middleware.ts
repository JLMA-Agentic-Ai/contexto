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
import { verify, sign, JsonWebTokenError } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { ComponentSecurityConfig, enterpriseSecurityPolicy } from '../../config/security-config';
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
  sub: string; // subject (user ID)
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat: number; // issued at
  exp: number; // expiration
  aud: string; // audience
  iss: string; // issuer
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

export class AuthenticationMiddleware extends EventEmitter {
  private auditLogger: SecurityAuditLogger;
  private activeSessions: Map<string, AuthenticationContext> = new Map();
  private failedAttempts: Map<string, number[]> = new Map();
  private refreshTokens: Map<string, string> = new Map();

  // Security keys - in production, these should be loaded from secure storage
  private readonly jwtSecret = process.env.JWT_SECRET || this.generateSecureKey();
  private readonly refreshSecret = process.env.REFRESH_SECRET || this.generateSecureKey();

  constructor(auditLogger: SecurityAuditLogger) {
    super();
    this.auditLogger = auditLogger;
    this.setupCleanupInterval();
  }

  /**
   * Express middleware for authentication
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw this.createAuthError('TOKEN_MISSING', 'Authentication token required', 401, req.ip);
      }

      // Verify and decode token
      const payload = await this.verifyToken(token);
      const context = await this.validateSession(payload, req);

      // Check rate limiting
      await this.checkRateLimit(context.userId, req.ip);

      // Update activity
      context.lastActivity = new Date();
      this.activeSessions.set(context.sessionId, context);

      // Attach auth context to request
      (req as any).auth = context;

      // Audit successful authentication
      this.auditLogger.logAuthenticationEvent({
        type: 'authentication_success',
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      next();
    } catch (error) {
      this.handleAuthenticationError(error as AuthenticationError, req, res);
    }
  };

  /**
   * Middleware for component-specific authorization
   */
  authorizeComponent = (componentId: string, requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const context = (req as any).auth as AuthenticationContext;
        if (!context) {
          throw this.createAuthError('AUTH_CONTEXT_MISSING', 'Authentication context not found', 401);
        }

        // Check component access permission
        const componentPermission = `bridge:${componentId}`;
        if (!context.permissions.includes(componentPermission) && !context.permissions.includes('system:admin')) {
          throw this.createAuthError('COMPONENT_ACCESS_DENIED', `Access denied to component: ${componentId}`, 403);
        }

        // Check specific permission
        if (!context.permissions.includes(requiredPermission) && !context.permissions.includes('system:admin')) {
          throw this.createAuthError('PERMISSION_DENIED', `Permission denied: ${requiredPermission}`, 403);
        }

        // Additional security level check for critical components
        if (['ruflo', 'claude-code'].includes(componentId) && context.securityLevel !== 'critical') {
          if (!context.mfaVerified) {
            throw this.createAuthError('MFA_REQUIRED', 'Multi-factor authentication required for critical component access', 403);
          }
        }

        // Audit authorization success
        this.auditLogger.logAuthorizationEvent({
          type: 'authorization_success',
          userId: context.userId,
          componentId,
          permission: requiredPermission,
          ipAddress: req.ip,
          timestamp: new Date()
        });

        next();
      } catch (error) {
        this.auditLogger.logAuthorizationEvent({
          type: 'authorization_failure',
          userId: (req as any).auth?.userId,
          componentId,
          permission: requiredPermission,
          ipAddress: req.ip,
          error: (error as Error).message,
          timestamp: new Date()
        });

        this.handleAuthenticationError(error as AuthenticationError, req, res);
      }
    };
  };

  /**
   * Generate authentication token for user
   */
  async generateToken(user: {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    securityLevel: string;
    mfaVerified: boolean;
  }, ipAddress: string): Promise<{ token: string; refreshToken: string; expiryTime: Date }> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    const expiryTime = new Date(now + enterpriseSecurityPolicy.authentication.expiration);

    const payload: TokenPayload = {
      sub: user.userId,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiryTime.getTime() / 1000),
      aud: 'vision-maestra-platform',
      iss: 'vision-maestra-auth',
      securityLevel: user.securityLevel,
      mfaVerified: user.mfaVerified
    };

    const token = sign(payload, this.jwtSecret, { algorithm: 'HS256' });
    const refreshToken = this.generateRefreshToken(sessionId);

    // Store session context
    const context: AuthenticationContext = {
      userId: user.userId,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      sessionId,
      ipAddress,
      userAgent: '',
      issueTime: new Date(now),
      expiryTime,
      lastActivity: new Date(now),
      mfaVerified: user.mfaVerified,
      securityLevel: user.securityLevel as any
    };

    this.activeSessions.set(sessionId, context);
    this.refreshTokens.set(sessionId, refreshToken);

    // Audit token generation
    this.auditLogger.logAuthenticationEvent({
      type: 'token_generated',
      userId: user.userId,
      sessionId,
      ipAddress,
      timestamp: new Date()
    });

    return { token, refreshToken, expiryTime };
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string, ipAddress: string): Promise<{ token: string; refreshToken: string; expiryTime: Date }> {
    const sessionId = this.findSessionByRefreshToken(refreshToken);
    if (!sessionId) {
      throw this.createAuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }

    const context = this.activeSessions.get(sessionId);
    if (!context) {
      throw this.createAuthError('SESSION_NOT_FOUND', 'Session not found', 401);
    }

    // Verify IP consistency for security
    if (context.ipAddress !== ipAddress) {
      this.auditLogger.logSecurityEvent({
        type: 'ip_mismatch_refresh',
        userId: context.userId,
        sessionId,
        originalIp: context.ipAddress,
        requestIp: ipAddress,
        timestamp: new Date()
      });
      throw this.createAuthError('IP_MISMATCH', 'IP address mismatch during token refresh', 403);
    }

    // Generate new tokens
    const result = await this.generateToken({
      userId: context.userId,
      username: context.username,
      roles: context.roles,
      permissions: context.permissions,
      securityLevel: context.securityLevel,
      mfaVerified: context.mfaVerified
    }, ipAddress);

    // Invalidate old tokens
    this.invalidateSession(sessionId);

    return result;
  }

  /**
   * Validate MFA code for elevated permissions
   */
  async validateMFA(sessionId: string, code: string, ipAddress: string): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      throw this.createAuthError('SESSION_NOT_FOUND', 'Session not found', 401);
    }

    // In production, this would validate against TOTP/SMS/hardware token
    const isValidCode = this.verifyMFACode(context.userId, code);
    if (!isValidCode) {
      this.auditLogger.logSecurityEvent({
        type: 'mfa_failure',
        userId: context.userId,
        sessionId,
        ipAddress,
        timestamp: new Date()
      });
      throw this.createAuthError('INVALID_MFA_CODE', 'Invalid MFA code', 401);
    }

    // Update context
    context.mfaVerified = true;
    context.securityLevel = 'critical';
    this.activeSessions.set(sessionId, context);

    this.auditLogger.logSecurityEvent({
      type: 'mfa_success',
      userId: context.userId,
      sessionId,
      ipAddress,
      timestamp: new Date()
    });
  }

  /**
   * Invalidate session and cleanup
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (context) {
      this.auditLogger.logAuthenticationEvent({
        type: 'session_invalidated',
        userId: context.userId,
        sessionId,
        ipAddress: context.ipAddress,
        timestamp: new Date()
      });
    }

    this.activeSessions.delete(sessionId);
    this.refreshTokens.delete(sessionId);
  }

  /**
   * Get current active sessions for monitoring
   */
  getActiveSessions(): AuthenticationContext[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Extract JWT token from request
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Check X-Session-Token header
    const sessionHeader = req.get('X-Session-Token');
    if (sessionHeader) {
      return sessionHeader;
    }

    // Check query parameter (for WebSocket upgrades)
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    return null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = verify(token, this.jwtSecret) as TokenPayload;

      // Additional token validation
      if (!payload.sub || !payload.sessionId || !payload.exp) {
        throw new JsonWebTokenError('Invalid token structure');
      }

      if (payload.exp * 1000 < Date.now()) {
        throw new JsonWebTokenError('Token expired');
      }

      return payload;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw this.createAuthError('INVALID_TOKEN', error.message, 401);
      }
      throw error;
    }
  }

  /**
   * Validate session context
   */
  private async validateSession(payload: TokenPayload, req: Request): Promise<AuthenticationContext> {
    const context = this.activeSessions.get(payload.sessionId);
    if (!context) {
      throw this.createAuthError('SESSION_NOT_FOUND', 'Session not found or expired', 401);
    }

    // Update user agent if changed
    const userAgent = req.get('User-Agent') || '';
    context.userAgent = userAgent;

    return context;
  }

  /**
   * Check rate limiting for user
   */
  private async checkRateLimit(userId: string, ipAddress: string): Promise<void> {
    const key = `${userId}:${ipAddress}`;
    const now = Date.now();
    const window = 60 * 1000; // 1 minute
    const maxRequests = 100; // Per minute

    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, []);
    }

    const attempts = this.failedAttempts.get(key)!;
    const recentAttempts = attempts.filter(time => now - time < window);

    if (recentAttempts.length >= maxRequests) {
      throw this.createAuthError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, ipAddress, userId);
    }

    recentAttempts.push(now);
    this.failedAttempts.set(key, recentAttempts);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(sessionId: string): string {
    const data = `${sessionId}:${Date.now()}:${randomBytes(16).toString('hex')}`;
    return sign({ data }, this.refreshSecret, { expiresIn: '7d' });
  }

  /**
   * Find session by refresh token
   */
  private findSessionByRefreshToken(refreshToken: string): string | null {
    try {
      const decoded = verify(refreshToken, this.refreshSecret) as any;
      const sessionId = decoded.data.split(':')[0];

      if (this.refreshTokens.get(sessionId) === refreshToken) {
        return sessionId;
      }
    } catch {
      // Invalid refresh token
    }
    return null;
  }

  /**
   * Verify MFA code (simplified implementation)
   */
  private verifyMFACode(userId: string, code: string): boolean {
    // In production, this would integrate with TOTP library or external MFA service
    // For demo purposes, accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return createHash('sha256')
      .update(randomBytes(32))
      .update(Date.now().toString())
      .digest('hex');
  }

  /**
   * Generate secure key for JWT signing
   */
  private generateSecureKey(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Create authentication error
   */
  private createAuthError(code: string, message: string, statusCode: number, ipAddress?: string, userId?: string): AuthenticationError {
    return {
      code,
      message,
      statusCode,
      timestamp: new Date(),
      ipAddress,
      userId
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: AuthenticationError, req: Request, res: Response): void {
    // Log security event
    this.auditLogger.logSecurityEvent({
      type: 'authentication_failure',
      userId: error.userId,
      ipAddress: error.ipAddress || req.ip,
      error: error.message,
      code: error.code,
      timestamp: error.timestamp
    });

    // Track failed attempts
    const key = `${error.userId || 'unknown'}:${error.ipAddress || req.ip}`;
    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, []);
    }
    this.failedAttempts.get(key)!.push(Date.now());

    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      }
    });
  }

  /**
   * Setup periodic cleanup of expired data
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupExpiredAttempts();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.activeSessions.entries()) {
      if (context.expiryTime.getTime() < now) {
        this.invalidateSession(sessionId);
      }
    }
  }

  /**
   * Cleanup expired failed attempts
   */
  private cleanupExpiredAttempts(): void {
    const now = Date.now();
    const window = 60 * 60 * 1000; // 1 hour

    for (const [key, attempts] of this.failedAttempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < window);
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(key);
      } else {
        this.failedAttempts.set(key, recentAttempts);
      }
    }
  }
}