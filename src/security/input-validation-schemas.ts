/**
 * Input Validation Schemas for 6-Component Platform Integration
 * Implements comprehensive validation for all inter-component data transfers
 *
 * Validation Coverage:
 * 1. Dossier ↔ ruflo V3 (Project management data)
 * 2. ruflo V3 ↔ GitNexus (Code analysis requests)
 * 3. ADW Skills ↔ RLM Navigator (Investigation data)
 * 4. GitNexus ↔ Claude Code (Execution contexts)
 * 5. RLM Navigator ↔ Dossier (Navigation results)
 * 6. Claude Code ↔ ADW Skills (Validation results)
 */

import Joi from 'joi';
// import { sanitize } from 'sanitizer'; // Temporarily disabled - package not installed
const sanitize = (input: string) => input.replace(/<[^>]*>/g, ''); // Basic HTML sanitization fallback
import { SecurityAuditLogger } from './audit-logger';

// Base validation schemas
const baseMessageSchema = Joi.object({
  id: Joi.string().uuid().required(),
  type: Joi.string().pattern(/^[a-zA-Z0-9_:-]+$/).max(100).required(),
  timestamp: Joi.date().iso().required(),
  metadata: Joi.object({
    source: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).max(50).required(),
    target: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).max(50).required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
    correlationId: Joi.string().uuid().optional(),
    sessionId: Joi.string().uuid().optional()
  }).required()
});

// File path validation (security critical)
const safePathSchema = Joi.string()
  .pattern(/^[^<>:"|?*\x00-\x1f]*$/) // No dangerous characters
  .pattern(/^(?!.*\.\.)/) // No directory traversal
  .pattern(/^(?![\/\\])/) // No absolute paths
  .max(260) // Windows MAX_PATH limit
  .required();

// Project context validation
const projectContextSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  projectPath: safePathSchema,
  name: Joi.string().pattern(/^[a-zA-Z0-9_.-\s]+$/).max(200).required(),
  owner: Joi.string().pattern(/^[a-zA-Z0-9_.-]+$/).max(100).required(),
  permissions: Joi.array().items(Joi.string().pattern(/^[a-zA-Z0-9_:-]+$/)).max(20)
});

// Evidence validation for ADW methodology
const evidenceSchema = Joi.object({
  id: Joi.string().uuid().required(),
  level: Joi.string().valid('SOLID', 'SOFT', 'SHAKY', 'UNKNOWN').required(),
  confidence: Joi.number().min(0).max(100).required(),
  decision: Joi.string().max(1000).required(),
  reasoning: Joi.string().max(5000).required(),
  sources: Joi.array().items(Joi.object({
    type: Joi.string().valid('code-analysis', 'expert-opinion', 'test-results', 'user-feedback', 'research-paper', 'performance-data').required(),
    identifier: Joi.string().max(200).required(),
    content: Joi.string().max(10000).required(),
    reliability: Joi.number().min(0).max(100).required(),
    relevance: Joi.number().min(0).max(100).required(),
    timestamp: Joi.date().iso().required(),
    metadata: Joi.object().optional()
  })).max(20).required(),
  context: Joi.object({
    workflowId: Joi.string().uuid().optional(),
    phase: Joi.string().valid('investigation', 'analysis', 'implementation', 'validation', 'visualization').optional(),
    component: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).optional(),
    decisionType: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).optional(),
    stakeholders: Joi.array().items(Joi.string().pattern(/^[a-zA-Z0-9_-]+$/)).optional(),
    businessImpact: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    technicalComplexity: Joi.number().min(1).max(10).optional()
  }).optional()
});

// Component-specific validation schemas

export class InputValidationSchemas {
  private auditLogger: SecurityAuditLogger;

  // Dossier ↔ ruflo V3 validation schemas
  public readonly dossierRufloSchemas = {
    // Dossier to ruflo: Project initialization
    projectInit: baseMessageSchema.keys({
      type: Joi.string().valid('project:init').required(),
      payload: Joi.object({
        project: projectContextSchema.required(),
        settings: Joi.object({
          swarmConfig: Joi.object({
            topology: Joi.string().valid('hierarchical', 'mesh', 'star').default('hierarchical'),
            maxAgents: Joi.number().min(1).max(20).default(8),
            strategy: Joi.string().valid('collaborative', 'competitive', 'specialized').default('specialized')
          }).optional(),
          memoryConfig: Joi.object({
            enabled: Joi.boolean().default(true),
            hnswEnabled: Joi.boolean().default(true),
            neuralEnabled: Joi.boolean().default(true)
          }).optional()
        }).optional()
      }).required()
    }),

    // ruflo to Dossier: Task status updates
    taskStatus: baseMessageSchema.keys({
      type: Joi.string().valid('task:status').required(),
      payload: Joi.object({
        taskId: Joi.string().uuid().required(),
        status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').required(),
        progress: Joi.number().min(0).max(100).required(),
        agentCount: Joi.number().min(0).max(50).required(),
        metrics: Joi.object({
          tokensUsed: Joi.number().min(0).optional(),
          latencyMs: Joi.number().min(0).optional(),
          errorCount: Joi.number().min(0).optional()
        }).optional(),
        results: Joi.object().optional()
      }).required()
    })
  };

  // ruflo V3 ↔ GitNexus validation schemas
  public readonly rufloGitnexusSchemas = {
    // ruflo to GitNexus: Analysis request
    analysisRequest: baseMessageSchema.keys({
      type: Joi.string().valid('analyze:codebase').required(),
      payload: Joi.object({
        projectPath: safePathSchema,
        analysisType: Joi.string().valid('full', 'incremental', 'focused').default('full'),
        scope: Joi.object({
          includePatterns: Joi.array().items(Joi.string().max(100)).max(20).optional(),
          excludePatterns: Joi.array().items(Joi.string().max(100)).max(20).optional(),
          maxDepth: Joi.number().min(1).max(20).default(10)
        }).optional(),
        investigationContext: Joi.string().uuid().optional()
      }).required()
    }),

    // GitNexus to ruflo: Analysis results
    analysisResults: baseMessageSchema.keys({
      type: Joi.string().valid('analysis:results').required(),
      payload: Joi.object({
        requestId: Joi.string().uuid().required(),
        graphData: Joi.object({
          nodes: Joi.array().items(Joi.object({
            id: Joi.string().required(),
            type: Joi.string().required(),
            properties: Joi.object().optional()
          })).max(50000),
          edges: Joi.array().items(Joi.object({
            from: Joi.string().required(),
            to: Joi.string().required(),
            type: Joi.string().required(),
            weight: Joi.number().min(0).max(1).optional()
          })).max(100000)
        }).optional(),
        metrics: Joi.object({
          nodeCount: Joi.number().min(0).required(),
          edgeCount: Joi.number().min(0).required(),
          analysisTime: Joi.number().min(0).required(),
          complexity: Joi.number().min(0).max(100).optional()
        }).required(),
        insights: Joi.array().items(Joi.object({
          type: Joi.string().required(),
          severity: Joi.string().valid('info', 'warning', 'error', 'critical').required(),
          message: Joi.string().max(1000).required(),
          location: Joi.object({
            file: safePathSchema,
            line: Joi.number().min(1).optional(),
            column: Joi.number().min(1).optional()
          }).optional()
        })).max(1000).optional()
      }).required()
    })
  };

  // ADW Skills ↔ RLM Navigator validation schemas
  public readonly adwRlmSchemas = {
    // ADW to RLM: Investigation request
    investigationRequest: baseMessageSchema.keys({
      type: Joi.string().valid('investigation:drill').required(),
      payload: Joi.object({
        query: Joi.string().max(2000).required(),
        depth: Joi.string().valid('shallow', 'medium', 'deep').default('medium'),
        context: Joi.object({
          projectPath: safePathSchema,
          evidenceId: Joi.string().uuid().optional(),
          focusAreas: Joi.array().items(Joi.string().max(100)).max(10).optional()
        }).required(),
        methodology: Joi.object({
          assumptions: Joi.array().items(Joi.string().max(500)).max(10).optional(),
          decisions: Joi.array().items(Joi.string().max(500)).max(10).optional(),
          wisdom: Joi.array().items(Joi.string().max(500)).max(10).optional()
        }).optional()
      }).required()
    }),

    // RLM to ADW: Navigation results
    navigationResults: baseMessageSchema.keys({
      type: Joi.string().valid('navigation:results').required(),
      payload: Joi.object({
        requestId: Joi.string().uuid().required(),
        astContext: Joi.object({
          symbols: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            type: Joi.string().required(),
            location: Joi.object({
              file: safePathSchema,
              line: Joi.number().min(1).required(),
              column: Joi.number().min(1).required()
            }).required(),
            scope: Joi.string().required(),
            references: Joi.array().items(Joi.object()).max(100).optional()
          })).max(10000),
          relationships: Joi.array().items(Joi.object({
            from: Joi.string().required(),
            to: Joi.string().required(),
            type: Joi.string().required(),
            strength: Joi.number().min(0).max(1).optional()
          })).max(50000)
        }).required(),
        evidence: evidenceSchema.optional(),
        recommendations: Joi.array().items(Joi.object({
          type: Joi.string().required(),
          priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
          description: Joi.string().max(1000).required(),
          rationale: Joi.string().max(2000).optional()
        })).max(20).optional()
      }).required()
    })
  };

  // GitNexus ↔ Claude Code validation schemas
  public readonly gitnexusClaudeSchemas = {
    // GitNexus to Claude Code: Execution request
    executionRequest: baseMessageSchema.keys({
      type: Joi.string().valid('swarm:coordinate').required(),
      payload: Joi.object({
        agents: Joi.array().items(Joi.string().valid(
          'coder', 'reviewer', 'tester', 'security-auditor', 'architect',
          'planner', 'researcher', 'performance-engineer'
        )).min(1).max(10).required(),
        context: Joi.object({
          prompt: Joi.string().max(5000).required(),
          projectPath: safePathSchema,
          codeGraph: Joi.object().optional(),
          evidenceTracker: Joi.string().uuid().optional(),
          constraints: Joi.object({
            maxDuration: Joi.number().min(1000).max(3600000).optional(), // 1 second to 1 hour
            maxTokens: Joi.number().min(100).max(1000000).optional(),
            securityLevel: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
          }).optional()
        }).required(),
        strategy: Joi.string().valid('collaborative', 'hierarchical', 'competitive').default('hierarchical'),
        queenWeight: Joi.number().min(1).max(3).default(1.5).optional()
      }).required()
    }),

    // Claude Code to GitNexus: Execution results
    executionResults: baseMessageSchema.keys({
      type: Joi.string().valid('execution:results').required(),
      payload: Joi.object({
        requestId: Joi.string().uuid().required(),
        swarmId: Joi.string().required(),
        status: Joi.string().valid('completed', 'failed', 'partial', 'timeout').required(),
        agents: Joi.array().items(Joi.object({
          agentId: Joi.string().required(),
          type: Joi.string().required(),
          status: Joi.string().valid('completed', 'failed', 'timeout').required(),
          results: Joi.object().optional(),
          metrics: Joi.object({
            tokensUsed: Joi.number().min(0).optional(),
            executionTime: Joi.number().min(0).optional(),
            errorCount: Joi.number().min(0).optional()
          }).optional()
        })).max(20),
        aggregatedResults: Joi.object({
          filesModified: Joi.array().items(safePathSchema).max(1000).optional(),
          testsCreated: Joi.array().items(safePathSchema).max(100).optional(),
          docsGenerated: Joi.array().items(safePathSchema).max(50).optional(),
          errors: Joi.array().items(Joi.object({
            agentId: Joi.string().required(),
            error: Joi.string().max(2000).required(),
            severity: Joi.string().valid('warning', 'error', 'critical').required()
          })).max(100).optional()
        }).optional(),
        evidence: evidenceSchema.optional()
      }).required()
    })
  };

  // RLM Navigator ↔ Dossier validation schemas
  public readonly rlmDossierSchemas = {
    // RLM to Dossier: Visualization data
    visualizationData: baseMessageSchema.keys({
      type: Joi.string().valid('visualization:update').required(),
      payload: Joi.object({
        cardId: Joi.string().uuid().required(),
        visualizationType: Joi.string().valid('graph', 'hierarchy', 'flow', 'metrics').required(),
        data: Joi.object({
          nodes: Joi.array().items(Joi.object({
            id: Joi.string().required(),
            label: Joi.string().max(200).required(),
            type: Joi.string().required(),
            position: Joi.object({
              x: Joi.number().required(),
              y: Joi.number().required()
            }).optional(),
            metadata: Joi.object().optional()
          })).max(5000),
          edges: Joi.array().items(Joi.object({
            from: Joi.string().required(),
            to: Joi.string().required(),
            label: Joi.string().max(100).optional(),
            type: Joi.string().optional(),
            weight: Joi.number().min(0).max(1).optional()
          })).max(10000),
          metadata: Joi.object({
            layout: Joi.string().valid('force', 'hierarchical', 'circular', 'grid').optional(),
            theme: Joi.string().valid('light', 'dark', 'auto').optional(),
            interactive: Joi.boolean().default(true)
          }).optional()
        }).required()
      }).required()
    })
  };

  // Claude Code ↔ ADW Skills validation schemas
  public readonly claudeAdwSchemas = {
    // Claude Code to ADW: Validation request
    validationRequest: baseMessageSchema.keys({
      type: Joi.string().valid('validate:implementation').required(),
      payload: Joi.object({
        implementation: Joi.object({
          swarmId: Joi.string().required(),
          results: Joi.object().required(),
          metrics: Joi.object().optional()
        }).required(),
        evidenceTracker: Joi.string().uuid().required(),
        gates: Joi.array().items(Joi.string().valid(
          'build', 'test', 'security', 'performance', 'documentation',
          'compliance', 'accessibility', 'i18n'
        )).min(1).max(10).required(),
        criteria: Joi.object({
          buildSuccess: Joi.boolean().default(true),
          testCoverage: Joi.number().min(0).max(100).default(80),
          securityScore: Joi.number().min(0).max(100).default(85),
          performanceThreshold: Joi.number().min(0).default(2000),
          documentationRequired: Joi.boolean().default(false)
        }).optional()
      }).required()
    }),

    // ADW to Claude Code: Validation results
    validationResults: baseMessageSchema.keys({
      type: Joi.string().valid('validation:results').required(),
      payload: Joi.object({
        requestId: Joi.string().uuid().required(),
        overallResult: Joi.string().valid('passed', 'failed', 'partial').required(),
        confidence: Joi.number().min(0).max(100).required(),
        gates: Joi.array().items(Joi.object({
          name: Joi.string().required(),
          status: Joi.string().valid('passed', 'failed', 'skipped', 'warning').required(),
          score: Joi.number().min(0).max(100).optional(),
          message: Joi.string().max(1000).optional(),
          details: Joi.object().optional(),
          evidence: evidenceSchema.optional()
        })).required(),
        recommendations: Joi.array().items(Joi.object({
          gate: Joi.string().required(),
          priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
          action: Joi.string().max(500).required(),
          rationale: Joi.string().max(1000).optional()
        })).max(50).optional(),
        evidence: evidenceSchema.required()
      }).required()
    })
  };

  constructor(auditLogger: SecurityAuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Validate message for specific bridge
   */
  async validateBridgeMessage(bridgeId: string, message: any): Promise<any> {
    try {
      let schema: Joi.ObjectSchema;

      // Select appropriate schema based on bridge and message type
      switch (bridgeId) {
        case 'dossier-ruflo-bridge':
          schema = this.selectDossierRufloSchema(message.type);
          break;
        case 'ruflo-gitnexus-bridge':
          schema = this.selectRufloGitnexusSchema(message.type);
          break;
        case 'adw-rlm-bridge':
          schema = this.selectAdwRlmSchema(message.type);
          break;
        case 'gitnexus-claude-bridge':
          schema = this.selectGitnexusClaudeSchema(message.type);
          break;
        case 'rlm-dossier-bridge':
          schema = this.selectRlmDossierSchema(message.type);
          break;
        case 'claude-adw-bridge':
          schema = this.selectClaudeAdwSchema(message.type);
          break;
        default:
          throw new Error(`Unknown bridge: ${bridgeId}`);
      }

      // Validate message structure
      const { error, value } = schema.validate(message, {
        stripUnknown: true,
        abortEarly: false
      });

      if (error) {
        this.auditLogger.logValidationEvent({
          type: 'validation_failure',
          bridgeId,
          messageType: message.type,
          errors: error.details.map(d => d.message),
          timestamp: new Date()
        });
        throw new Error(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Sanitize string fields
      const sanitizedValue = this.sanitizeMessage(value);

      this.auditLogger.logValidationEvent({
        type: 'validation_success',
        bridgeId,
        messageType: message.type,
        timestamp: new Date()
      });

      return sanitizedValue;

    } catch (error) {
      this.auditLogger.logValidationEvent({
        type: 'validation_error',
        bridgeId,
        messageType: message.type || 'unknown',
        error: (error as Error).message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Sanitize message to prevent XSS and injection attacks
   */
  private sanitizeMessage(obj: any): any {
    if (typeof obj === 'string') {
      return sanitize(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeMessage(item));
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeMessage(value);
      }
      return sanitized;
    }
    return obj;
  }

  /**
   * Schema selection methods
   */
  private selectDossierRufloSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'project:init':
        return this.dossierRufloSchemas.projectInit;
      case 'task:status':
        return this.dossierRufloSchemas.taskStatus;
      default:
        throw new Error(`Unknown Dossier-ruflo message type: ${messageType}`);
    }
  }

  private selectRufloGitnexusSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'analyze:codebase':
        return this.rufloGitnexusSchemas.analysisRequest;
      case 'analysis:results':
        return this.rufloGitnexusSchemas.analysisResults;
      default:
        throw new Error(`Unknown ruflo-GitNexus message type: ${messageType}`);
    }
  }

  private selectAdwRlmSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'investigation:drill':
        return this.adwRlmSchemas.investigationRequest;
      case 'navigation:results':
        return this.adwRlmSchemas.navigationResults;
      default:
        throw new Error(`Unknown ADW-RLM message type: ${messageType}`);
    }
  }

  private selectGitnexusClaudeSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'swarm:coordinate':
        return this.gitnexusClaudeSchemas.executionRequest;
      case 'execution:results':
        return this.gitnexusClaudeSchemas.executionResults;
      default:
        throw new Error(`Unknown GitNexus-Claude message type: ${messageType}`);
    }
  }

  private selectRlmDossierSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'visualization:update':
        return this.rlmDossierSchemas.visualizationData;
      default:
        throw new Error(`Unknown RLM-Dossier message type: ${messageType}`);
    }
  }

  private selectClaudeAdwSchema(messageType: string): Joi.ObjectSchema {
    switch (messageType) {
      case 'validate:implementation':
        return this.claudeAdwSchemas.validationRequest;
      case 'validation:results':
        return this.claudeAdwSchemas.validationResults;
      default:
        throw new Error(`Unknown Claude-ADW message type: ${messageType}`);
    }
  }
}