/**
 * Enterprise Security Configuration for 6-Component Platform Integration
 * Implements zero-trust architecture with comprehensive security hardening
 *
 * Components Secured:
 * 1. Dossier ↔ ruflo V3 (WebSocket security)
 * 2. ruflo V3 ↔ GitNexus (File access security)
 * 3. ADW Skills ↔ RLM Navigator (MCP protocol security)
 * 4. GitNexus ↔ Claude Code (Native execution isolation)
 * 5. RLM Navigator ↔ Dossier (WebSocket security)
 * 6. Claude Code ↔ ADW Skills (Native process isolation)
 */

import { SecurityPolicy } from '../src/bridges/security/security-bridge-manager';

// Enterprise Security Policy
export const enterpriseSecurityPolicy: SecurityPolicy = {
  authentication: {
    required: true,
    methods: ['jwt', 'oauth2', 'api-key'],
    expiration: 8 * 60 * 60 * 1000 // 8 hours for enterprise sessions
  },
  authorization: {
    rbac: true,
    permissions: [
      // Core system permissions
      'system:read', 'system:write', 'system:admin',

      // Component-specific permissions
      'dossier:project:read', 'dossier:project:write', 'dossier:card:manage',
      'ruflo:swarm:create', 'ruflo:swarm:execute', 'ruflo:agent:spawn',
      'adw:investigate', 'adw:validate', 'adw:evidence:read',
      'gitnexus:graph:read', 'gitnexus:analyze', 'gitnexus:visualization',
      'rlm:navigate', 'rlm:ast:read', 'rlm:context:map',
      'claude-code:execute', 'claude-code:agent:spawn', 'claude-code:task:manage',

      // Bridge permissions
      'bridge:dossier-ruflo', 'bridge:ruflo-gitnexus', 'bridge:adw-rlm',
      'bridge:gitnexus-claude', 'bridge:rlm-dossier', 'bridge:claude-adw',

      // Security permissions
      'security:audit:read', 'security:config:write', 'security:monitor'
    ]
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },
  threatDetection: {
    enabled: true,
    rateLimiting: {
      maxRequests: 1000, // Higher limit for enterprise
      timeWindow: 60 * 1000 // 1 minute
    },
    suspicious: {
      ipBlacklist: [],
      patterns: [
        // Code injection patterns
        /eval\s*\(/gi,
        /new\s+Function\s*\(/gi,
        /setTimeout\s*\(\s*["']/gi,
        /setInterval\s*\(\s*["']/gi,

        // Command injection patterns
        /child_process\.exec/gi,
        /shelljs\.exec/gi,
        /\$\{.*\}/g,

        // Path traversal patterns
        /\.\.\//g,
        /\.\.\\\//g,
        /~\//g,

        // Prototype pollution patterns
        /__proto__/gi,
        /constructor/gi,
        /prototype/gi,

        // SQL injection patterns
        /union\s+select/gi,
        /drop\s+table/gi,
        /delete\s+from/gi,

        // XSS patterns
        /<script[^>]*>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,

        // Credential harvesting patterns
        /password/gi,
        /api[_-]?key/gi,
        /secret/gi,
        /token/gi
      ]
    },
    monitoring: {
      logLevel: 'warn', // Enterprise logging
      alertWebhook: process.env.SECURITY_WEBHOOK_URL || undefined
    }
  }
};

// Component Security Configurations
export interface ComponentSecurityConfig {
  componentId: string;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  isolationLevel: 'none' | 'process' | 'container' | 'vm';
  networkPolicy: NetworkSecurityPolicy;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
}

export interface NetworkSecurityPolicy {
  allowedPorts: number[];
  allowedHosts: string[];
  requireTLS: boolean;
  certificateValidation: boolean;
  corsPolicy: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstSize: number;
  };
}

export const componentSecurityConfigs: ComponentSecurityConfig[] = [
  {
    componentId: 'dossier',
    securityLevel: 'high',
    isolationLevel: 'process',
    dataClassification: 'confidential',
    auditLevel: 'comprehensive',
    networkPolicy: {
      allowedPorts: [3000, 443],
      allowedHosts: ['localhost', '127.0.0.1'],
      requireTLS: true,
      certificateValidation: true,
      corsPolicy: {
        allowedOrigins: ['http://localhost:3000', 'https://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Session-Token']
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 600,
        burstSize: 100
      }
    }
  },
  {
    componentId: 'ruflo',
    securityLevel: 'critical',
    isolationLevel: 'container',
    dataClassification: 'restricted',
    auditLevel: 'comprehensive',
    networkPolicy: {
      allowedPorts: [8080, 8443],
      allowedHosts: ['localhost', '127.0.0.1'],
      requireTLS: true,
      certificateValidation: true,
      corsPolicy: {
        allowedOrigins: [],
        allowedMethods: ['POST'],
        allowedHeaders: ['Authorization', 'Content-Type']
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 300,
        burstSize: 50
      }
    }
  },
  {
    componentId: 'adw-skills',
    securityLevel: 'high',
    isolationLevel: 'process',
    dataClassification: 'confidential',
    auditLevel: 'comprehensive',
    networkPolicy: {
      allowedPorts: [],
      allowedHosts: ['localhost'],
      requireTLS: false, // Native component
      certificateValidation: false,
      corsPolicy: {
        allowedOrigins: [],
        allowedMethods: [],
        allowedHeaders: []
      },
      rateLimiting: {
        enabled: false,
        requestsPerMinute: 0,
        burstSize: 0
      }
    }
  },
  {
    componentId: 'gitnexus',
    securityLevel: 'medium',
    isolationLevel: 'process',
    dataClassification: 'internal',
    auditLevel: 'standard',
    networkPolicy: {
      allowedPorts: [],
      allowedHosts: ['localhost'],
      requireTLS: false, // File system component
      certificateValidation: false,
      corsPolicy: {
        allowedOrigins: [],
        allowedMethods: [],
        allowedHeaders: []
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 120,
        burstSize: 20
      }
    }
  },
  {
    componentId: 'rlm-navigator',
    securityLevel: 'high',
    isolationLevel: 'process',
    dataClassification: 'confidential',
    auditLevel: 'comprehensive',
    networkPolicy: {
      allowedPorts: [8081],
      allowedHosts: ['localhost', '127.0.0.1'],
      requireTLS: true,
      certificateValidation: true,
      corsPolicy: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['POST', 'GET'],
        allowedHeaders: ['Authorization', 'Content-Type']
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 240,
        burstSize: 40
      }
    }
  },
  {
    componentId: 'claude-code',
    securityLevel: 'critical',
    isolationLevel: 'container',
    dataClassification: 'restricted',
    auditLevel: 'comprehensive',
    networkPolicy: {
      allowedPorts: [],
      allowedHosts: ['localhost'],
      requireTLS: false, // Native component with process isolation
      certificateValidation: false,
      corsPolicy: {
        allowedOrigins: [],
        allowedMethods: [],
        allowedHeaders: []
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 60, // Limited due to execution capabilities
        burstSize: 10
      }
    }
  }
];

// Bridge Security Configurations
export interface BridgeSecurityConfig {
  bridgeId: string;
  protocol: 'websocket' | 'http' | 'mcp' | 'file-sync' | 'native';
  encryptionRequired: boolean;
  mutualAuth: boolean;
  messageValidation: boolean;
  circuitBreakerEnabled: boolean;
  auditAllMessages: boolean;
  timeoutMs: number;
  maxRetries: number;
}

export const bridgeSecurityConfigs: BridgeSecurityConfig[] = [
  {
    bridgeId: 'dossier-ruflo-bridge',
    protocol: 'websocket',
    encryptionRequired: true,
    mutualAuth: true,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: true,
    timeoutMs: 30000,
    maxRetries: 3
  },
  {
    bridgeId: 'ruflo-gitnexus-bridge',
    protocol: 'file-sync',
    encryptionRequired: true,
    mutualAuth: false,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: false,
    timeoutMs: 60000,
    maxRetries: 2
  },
  {
    bridgeId: 'adw-rlm-bridge',
    protocol: 'mcp',
    encryptionRequired: true,
    mutualAuth: true,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: true,
    timeoutMs: 45000,
    maxRetries: 3
  },
  {
    bridgeId: 'gitnexus-claude-bridge',
    protocol: 'native',
    encryptionRequired: false, // Native IPC
    mutualAuth: true,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: true,
    timeoutMs: 120000, // Longer for code execution
    maxRetries: 2
  },
  {
    bridgeId: 'rlm-dossier-bridge',
    protocol: 'websocket',
    encryptionRequired: true,
    mutualAuth: true,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: false,
    timeoutMs: 30000,
    maxRetries: 3
  },
  {
    bridgeId: 'claude-adw-bridge',
    protocol: 'native',
    encryptionRequired: false, // Native IPC
    mutualAuth: true,
    messageValidation: true,
    circuitBreakerEnabled: true,
    auditAllMessages: true,
    timeoutMs: 90000,
    maxRetries: 2
  }
];

// Audit Configuration
export interface AuditConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  destinations: ('console' | 'file' | 'database' | 'webhook')[];
  retentionDays: number;
  encryptLogs: boolean;
  realTimeAlerts: {
    enabled: boolean;
    thresholds: {
      failedAuthAttempts: number;
      rateLimitViolations: number;
      suspiciousPatterns: number;
    };
  };
}

export const auditConfig: AuditConfig = {
  enabled: true,
  logLevel: 'info',
  destinations: ['console', 'file', 'database'],
  retentionDays: 90, // Enterprise retention
  encryptLogs: true,
  realTimeAlerts: {
    enabled: true,
    thresholds: {
      failedAuthAttempts: 5,
      rateLimitViolations: 10,
      suspiciousPatterns: 3
    }
  }
};

// Secrets Management Configuration
export interface SecretsConfig {
  provider: 'local' | 'vault' | 'aws-ssm' | 'azure-keyvault' | 'gcp-secret-manager';
  rotation: {
    enabled: boolean;
    intervalDays: number;
    autoRotate: boolean;
  };
  encryption: {
    algorithm: string;
    keyDerivation: string;
  };
  accessControl: {
    requireApproval: boolean;
    auditAccess: boolean;
    expireAccess: boolean;
    maxAccessTime: number;
  };
}

export const secretsConfig: SecretsConfig = {
  provider: 'local', // For development; use 'vault' for production
  rotation: {
    enabled: true,
    intervalDays: 30,
    autoRotate: false // Manual approval required
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  },
  accessControl: {
    requireApproval: true,
    auditAccess: true,
    expireAccess: true,
    maxAccessTime: 4 * 60 * 60 * 1000 // 4 hours
  }
};

// Environment-specific overrides
export const getSecurityConfig = (environment: 'development' | 'staging' | 'production') => {
  const baseConfig = {
    policy: enterpriseSecurityPolicy,
    components: componentSecurityConfigs,
    bridges: bridgeSecurityConfigs,
    audit: auditConfig,
    secrets: secretsConfig
  };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        policy: {
          ...baseConfig.policy,
          authentication: {
            ...baseConfig.policy.authentication,
            expiration: 24 * 60 * 60 * 1000 // 24 hours for dev
          },
          threatDetection: {
            ...baseConfig.policy.threatDetection,
            monitoring: {
              ...baseConfig.policy.threatDetection.monitoring,
              logLevel: 'debug'
            }
          }
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        policy: {
          ...baseConfig.policy,
          threatDetection: {
            ...baseConfig.policy.threatDetection,
            rateLimiting: {
              maxRequests: 500,
              timeWindow: 60 * 1000
            }
          }
        }
      };

    case 'production':
      return {
        ...baseConfig,
        secrets: {
          ...baseConfig.secrets,
          provider: 'vault' as const,
          rotation: {
            ...baseConfig.secrets.rotation,
            intervalDays: 14 // More frequent rotation in production
          }
        }
      };

    default:
      return baseConfig;
  }
};