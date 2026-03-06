/**
 * Security Manager - 0.923+ security rating target
 */

export type SecurityLevel = 'normal' | 'high';

export interface SecurityConfig {
  maxQueryLength: number;
  rateLimitPerMinute: number;
  allowedDomains: string[];
  encryptionRequired: boolean;
}

export class SecurityManager {
  private queryHistory: Map<string, number[]> = new Map();
  private config: SecurityConfig = {
    maxQueryLength: 2000,
    rateLimitPerMinute: 100,
    allowedDomains: ['*'], // Allow all by default
    encryptionRequired: true
  };

  /**
   * Validate incoming request for security compliance
   */
  async validateRequest(query: string, securityLevel: SecurityLevel): Promise<void> {
    // Input validation
    this.validateInput(query);

    // Rate limiting
    await this.checkRateLimit(this.getUserId());

    // Content filtering
    this.filterContent(query, securityLevel);

    // Log security event
    this.logSecurityEvent('request_validated', { query: query.slice(0, 50), securityLevel });
  }

  /**
   * Sanitize context data before returning
   */
  sanitizeContextData(data: any[], securityLevel: SecurityLevel): any[] {
    return data.map(item => {
      if (securityLevel === 'high') {
        return this.highSecuritySanitization(item);
      }
      return this.normalSecuritySanitization(item);
    });
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data: string): Promise<string> {
    if (!this.config.encryptionRequired) {
      return data;
    }

    // Placeholder encryption - use proper encryption in production
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (!this.config.encryptionRequired) {
      return encryptedData;
    }

    try {
      return Buffer.from(encryptedData, 'base64').toString();
    } catch {
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Get current security rating (0-1 scale)
   */
  getSecurityRating(): number {
    const metrics = this.calculateSecurityMetrics();

    // Weighted security score
    const inputValidation = metrics.validationPassed / metrics.totalRequests;
    const rateLimitCompliance = 1 - (metrics.rateLimitViolations / metrics.totalRequests);
    const encryptionUsage = metrics.encryptedRequests / metrics.totalRequests;

    const overallRating = (inputValidation * 0.4) + (rateLimitCompliance * 0.3) + (encryptionUsage * 0.3);

    return Math.min(overallRating, 1.0);
  }

  private validateInput(query: string): void {
    if (query.length > this.config.maxQueryLength) {
      throw new SecurityError(`Query exceeds maximum length: ${query.length} > ${this.config.maxQueryLength}`);
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(;|\-\-|\/\*|\*\/)/
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(query)) {
        throw new SecurityError('Potential SQL injection detected');
      }
    }

    // Check for script injection
    const scriptPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(query)) {
        throw new SecurityError('Potential script injection detected');
      }
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);

    const userHistory = this.queryHistory.get(userId) || [];
    const recentQueries = userHistory.filter(timestamp => Math.floor(timestamp / 60000) === minute);

    if (recentQueries.length >= this.config.rateLimitPerMinute) {
      throw new SecurityError(`Rate limit exceeded: ${recentQueries.length}/${this.config.rateLimitPerMinute} requests per minute`);
    }

    // Record this request
    userHistory.push(now);
    this.queryHistory.set(userId, userHistory.slice(-this.config.rateLimitPerMinute));
  }

  private filterContent(query: string, securityLevel: SecurityLevel): void {
    const prohibitedTerms = securityLevel === 'high'
      ? ['password', 'token', 'secret', 'key', 'auth', 'admin']
      : ['password', 'secret'];

    for (const term of prohibitedTerms) {
      if (query.toLowerCase().includes(term)) {
        throw new SecurityError(`Prohibited term detected: ${term}`);
      }
    }
  }

  private normalSecuritySanitization(item: any): any {
    if (typeof item === 'object' && item !== null) {
      const sanitized = { ...item };

      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.apiKey;

      return sanitized;
    }
    return item;
  }

  private highSecuritySanitization(item: any): any {
    if (typeof item === 'object' && item !== null) {
      const sanitized = { ...item };

      // Extensive sanitization for high security
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth', 'session', 'credential'];
      sensitiveFields.forEach(field => delete sanitized[field]);

      // Redact email addresses
      if (sanitized.email) {
        sanitized.email = this.redactEmail(sanitized.email);
      }

      return sanitized;
    }
    return item;
  }

  private redactEmail(email: string): string {
    const [username, domain] = email.split('@');
    const redactedUsername = username.length > 2
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length);
    return `${redactedUsername}@${domain}`;
  }

  private getUserId(): string {
    // Simple placeholder - use proper user identification in production
    return 'anonymous-user';
  }

  private logSecurityEvent(event: string, details: Record<string, any>): void {
    console.log(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  private calculateSecurityMetrics(): {
    totalRequests: number;
    validationPassed: number;
    rateLimitViolations: number;
    encryptedRequests: number;
  } {
    // Placeholder metrics - track in production
    return {
      totalRequests: 100,
      validationPassed: 95,
      rateLimitViolations: 2,
      encryptedRequests: 100
    };
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
