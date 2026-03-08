"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputValidationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
const sanitizer_1 = require("sanitizer");
// Base validation schemas
const baseMessageSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    type: joi_1.default.string().pattern(/^[a-zA-Z0-9_:-]+$/).max(100).required(),
    timestamp: joi_1.default.date().iso().required(),
    metadata: joi_1.default.object({
        source: joi_1.default.string().pattern(/^[a-zA-Z0-9_-]+$/).max(50).required(),
        target: joi_1.default.string().pattern(/^[a-zA-Z0-9_-]+$/).max(50).required(),
        priority: joi_1.default.string().valid('low', 'normal', 'high', 'critical').default('normal'),
        correlationId: joi_1.default.string().uuid().optional(),
        sessionId: joi_1.default.string().uuid().optional()
    }).required()
});
// File path validation (security critical)
const safePathSchema = joi_1.default.string()
    .pattern(/^[^<>:"|?*\x00-\x1f]*$/) // No dangerous characters
    .pattern(/^(?!.*\.\.)/) // No directory traversal
    .pattern(/^(?![\/\\])/) // No absolute paths
    .max(260) // Windows MAX_PATH limit
    .required();
// Project context validation
const projectContextSchema = joi_1.default.object({
    projectId: joi_1.default.string().uuid().required(),
    projectPath: safePathSchema,
    name: joi_1.default.string().pattern(/^[a-zA-Z0-9_.-\s]+$/).max(200).required(),
    owner: joi_1.default.string().pattern(/^[a-zA-Z0-9_.-]+$/).max(100).required(),
    permissions: joi_1.default.array().items(joi_1.default.string().pattern(/^[a-zA-Z0-9_:-]+$/)).max(20)
});
// Evidence validation for ADW methodology
const evidenceSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    level: joi_1.default.string().valid('SOLID', 'SOFT', 'SHAKY', 'UNKNOWN').required(),
    confidence: joi_1.default.number().min(0).max(100).required(),
    decision: joi_1.default.string().max(1000).required(),
    reasoning: joi_1.default.string().max(5000).required(),
    sources: joi_1.default.array().items(joi_1.default.object({
        type: joi_1.default.string().valid('code-analysis', 'expert-opinion', 'test-results', 'user-feedback', 'research-paper', 'performance-data').required(),
        identifier: joi_1.default.string().max(200).required(),
        content: joi_1.default.string().max(10000).required(),
        reliability: joi_1.default.number().min(0).max(100).required(),
        relevance: joi_1.default.number().min(0).max(100).required(),
        timestamp: joi_1.default.date().iso().required(),
        metadata: joi_1.default.object().optional()
    })).max(20).required(),
    context: joi_1.default.object({
        workflowId: joi_1.default.string().uuid().optional(),
        phase: joi_1.default.string().valid('investigation', 'analysis', 'implementation', 'validation', 'visualization').optional(),
        component: joi_1.default.string().pattern(/^[a-zA-Z0-9_-]+$/).optional(),
        decisionType: joi_1.default.string().pattern(/^[a-zA-Z0-9_-]+$/).optional(),
        stakeholders: joi_1.default.array().items(joi_1.default.string().pattern(/^[a-zA-Z0-9_-]+$/)).optional(),
        businessImpact: joi_1.default.string().valid('low', 'medium', 'high', 'critical').optional(),
        technicalComplexity: joi_1.default.number().min(1).max(10).optional()
    }).optional()
});
// Component-specific validation schemas
class InputValidationSchemas {
    auditLogger;
    // Dossier ↔ ruflo V3 validation schemas
    dossierRufloSchemas = {
        // Dossier to ruflo: Project initialization
        projectInit: baseMessageSchema.keys({
            type: joi_1.default.string().valid('project:init').required(),
            payload: joi_1.default.object({
                project: projectContextSchema.required(),
                settings: joi_1.default.object({
                    swarmConfig: joi_1.default.object({
                        topology: joi_1.default.string().valid('hierarchical', 'mesh', 'star').default('hierarchical'),
                        maxAgents: joi_1.default.number().min(1).max(20).default(8),
                        strategy: joi_1.default.string().valid('collaborative', 'competitive', 'specialized').default('specialized')
                    }).optional(),
                    memoryConfig: joi_1.default.object({
                        enabled: joi_1.default.boolean().default(true),
                        hnswEnabled: joi_1.default.boolean().default(true),
                        neuralEnabled: joi_1.default.boolean().default(true)
                    }).optional()
                }).optional()
            }).required()
        }),
        // ruflo to Dossier: Task status updates
        taskStatus: baseMessageSchema.keys({
            type: joi_1.default.string().valid('task:status').required(),
            payload: joi_1.default.object({
                taskId: joi_1.default.string().uuid().required(),
                status: joi_1.default.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').required(),
                progress: joi_1.default.number().min(0).max(100).required(),
                agentCount: joi_1.default.number().min(0).max(50).required(),
                metrics: joi_1.default.object({
                    tokensUsed: joi_1.default.number().min(0).optional(),
                    latencyMs: joi_1.default.number().min(0).optional(),
                    errorCount: joi_1.default.number().min(0).optional()
                }).optional(),
                results: joi_1.default.object().optional()
            }).required()
        })
    };
    // ruflo V3 ↔ GitNexus validation schemas
    rufloGitnexusSchemas = {
        // ruflo to GitNexus: Analysis request
        analysisRequest: baseMessageSchema.keys({
            type: joi_1.default.string().valid('analyze:codebase').required(),
            payload: joi_1.default.object({
                projectPath: safePathSchema,
                analysisType: joi_1.default.string().valid('full', 'incremental', 'focused').default('full'),
                scope: joi_1.default.object({
                    includePatterns: joi_1.default.array().items(joi_1.default.string().max(100)).max(20).optional(),
                    excludePatterns: joi_1.default.array().items(joi_1.default.string().max(100)).max(20).optional(),
                    maxDepth: joi_1.default.number().min(1).max(20).default(10)
                }).optional(),
                investigationContext: joi_1.default.string().uuid().optional()
            }).required()
        }),
        // GitNexus to ruflo: Analysis results
        analysisResults: baseMessageSchema.keys({
            type: joi_1.default.string().valid('analysis:results').required(),
            payload: joi_1.default.object({
                requestId: joi_1.default.string().uuid().required(),
                graphData: joi_1.default.object({
                    nodes: joi_1.default.array().items(joi_1.default.object({
                        id: joi_1.default.string().required(),
                        type: joi_1.default.string().required(),
                        properties: joi_1.default.object().optional()
                    })).max(50000),
                    edges: joi_1.default.array().items(joi_1.default.object({
                        from: joi_1.default.string().required(),
                        to: joi_1.default.string().required(),
                        type: joi_1.default.string().required(),
                        weight: joi_1.default.number().min(0).max(1).optional()
                    })).max(100000)
                }).optional(),
                metrics: joi_1.default.object({
                    nodeCount: joi_1.default.number().min(0).required(),
                    edgeCount: joi_1.default.number().min(0).required(),
                    analysisTime: joi_1.default.number().min(0).required(),
                    complexity: joi_1.default.number().min(0).max(100).optional()
                }).required(),
                insights: joi_1.default.array().items(joi_1.default.object({
                    type: joi_1.default.string().required(),
                    severity: joi_1.default.string().valid('info', 'warning', 'error', 'critical').required(),
                    message: joi_1.default.string().max(1000).required(),
                    location: joi_1.default.object({
                        file: safePathSchema,
                        line: joi_1.default.number().min(1).optional(),
                        column: joi_1.default.number().min(1).optional()
                    }).optional()
                })).max(1000).optional()
            }).required()
        })
    };
    // ADW Skills ↔ RLM Navigator validation schemas
    adwRlmSchemas = {
        // ADW to RLM: Investigation request
        investigationRequest: baseMessageSchema.keys({
            type: joi_1.default.string().valid('investigation:drill').required(),
            payload: joi_1.default.object({
                query: joi_1.default.string().max(2000).required(),
                depth: joi_1.default.string().valid('shallow', 'medium', 'deep').default('medium'),
                context: joi_1.default.object({
                    projectPath: safePathSchema,
                    evidenceId: joi_1.default.string().uuid().optional(),
                    focusAreas: joi_1.default.array().items(joi_1.default.string().max(100)).max(10).optional()
                }).required(),
                methodology: joi_1.default.object({
                    assumptions: joi_1.default.array().items(joi_1.default.string().max(500)).max(10).optional(),
                    decisions: joi_1.default.array().items(joi_1.default.string().max(500)).max(10).optional(),
                    wisdom: joi_1.default.array().items(joi_1.default.string().max(500)).max(10).optional()
                }).optional()
            }).required()
        }),
        // RLM to ADW: Navigation results
        navigationResults: baseMessageSchema.keys({
            type: joi_1.default.string().valid('navigation:results').required(),
            payload: joi_1.default.object({
                requestId: joi_1.default.string().uuid().required(),
                astContext: joi_1.default.object({
                    symbols: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        type: joi_1.default.string().required(),
                        location: joi_1.default.object({
                            file: safePathSchema,
                            line: joi_1.default.number().min(1).required(),
                            column: joi_1.default.number().min(1).required()
                        }).required(),
                        scope: joi_1.default.string().required(),
                        references: joi_1.default.array().items(joi_1.default.object()).max(100).optional()
                    })).max(10000),
                    relationships: joi_1.default.array().items(joi_1.default.object({
                        from: joi_1.default.string().required(),
                        to: joi_1.default.string().required(),
                        type: joi_1.default.string().required(),
                        strength: joi_1.default.number().min(0).max(1).optional()
                    })).max(50000)
                }).required(),
                evidence: evidenceSchema.optional(),
                recommendations: joi_1.default.array().items(joi_1.default.object({
                    type: joi_1.default.string().required(),
                    priority: joi_1.default.string().valid('low', 'medium', 'high', 'critical').required(),
                    description: joi_1.default.string().max(1000).required(),
                    rationale: joi_1.default.string().max(2000).optional()
                })).max(20).optional()
            }).required()
        })
    };
    // GitNexus ↔ Claude Code validation schemas
    gitnexusClaudeSchemas = {
        // GitNexus to Claude Code: Execution request
        executionRequest: baseMessageSchema.keys({
            type: joi_1.default.string().valid('swarm:coordinate').required(),
            payload: joi_1.default.object({
                agents: joi_1.default.array().items(joi_1.default.string().valid('coder', 'reviewer', 'tester', 'security-auditor', 'architect', 'planner', 'researcher', 'performance-engineer')).min(1).max(10).required(),
                context: joi_1.default.object({
                    prompt: joi_1.default.string().max(5000).required(),
                    projectPath: safePathSchema,
                    codeGraph: joi_1.default.object().optional(),
                    evidenceTracker: joi_1.default.string().uuid().optional(),
                    constraints: joi_1.default.object({
                        maxDuration: joi_1.default.number().min(1000).max(3600000).optional(), // 1 second to 1 hour
                        maxTokens: joi_1.default.number().min(100).max(1000000).optional(),
                        securityLevel: joi_1.default.string().valid('low', 'medium', 'high', 'critical').default('medium')
                    }).optional()
                }).required(),
                strategy: joi_1.default.string().valid('collaborative', 'hierarchical', 'competitive').default('hierarchical'),
                queenWeight: joi_1.default.number().min(1).max(3).default(1.5).optional()
            }).required()
        }),
        // Claude Code to GitNexus: Execution results
        executionResults: baseMessageSchema.keys({
            type: joi_1.default.string().valid('execution:results').required(),
            payload: joi_1.default.object({
                requestId: joi_1.default.string().uuid().required(),
                swarmId: joi_1.default.string().required(),
                status: joi_1.default.string().valid('completed', 'failed', 'partial', 'timeout').required(),
                agents: joi_1.default.array().items(joi_1.default.object({
                    agentId: joi_1.default.string().required(),
                    type: joi_1.default.string().required(),
                    status: joi_1.default.string().valid('completed', 'failed', 'timeout').required(),
                    results: joi_1.default.object().optional(),
                    metrics: joi_1.default.object({
                        tokensUsed: joi_1.default.number().min(0).optional(),
                        executionTime: joi_1.default.number().min(0).optional(),
                        errorCount: joi_1.default.number().min(0).optional()
                    }).optional()
                })).max(20),
                aggregatedResults: joi_1.default.object({
                    filesModified: joi_1.default.array().items(safePathSchema).max(1000).optional(),
                    testsCreated: joi_1.default.array().items(safePathSchema).max(100).optional(),
                    docsGenerated: joi_1.default.array().items(safePathSchema).max(50).optional(),
                    errors: joi_1.default.array().items(joi_1.default.object({
                        agentId: joi_1.default.string().required(),
                        error: joi_1.default.string().max(2000).required(),
                        severity: joi_1.default.string().valid('warning', 'error', 'critical').required()
                    })).max(100).optional()
                }).optional(),
                evidence: evidenceSchema.optional()
            }).required()
        })
    };
    // RLM Navigator ↔ Dossier validation schemas
    rlmDossierSchemas = {
        // RLM to Dossier: Visualization data
        visualizationData: baseMessageSchema.keys({
            type: joi_1.default.string().valid('visualization:update').required(),
            payload: joi_1.default.object({
                cardId: joi_1.default.string().uuid().required(),
                visualizationType: joi_1.default.string().valid('graph', 'hierarchy', 'flow', 'metrics').required(),
                data: joi_1.default.object({
                    nodes: joi_1.default.array().items(joi_1.default.object({
                        id: joi_1.default.string().required(),
                        label: joi_1.default.string().max(200).required(),
                        type: joi_1.default.string().required(),
                        position: joi_1.default.object({
                            x: joi_1.default.number().required(),
                            y: joi_1.default.number().required()
                        }).optional(),
                        metadata: joi_1.default.object().optional()
                    })).max(5000),
                    edges: joi_1.default.array().items(joi_1.default.object({
                        from: joi_1.default.string().required(),
                        to: joi_1.default.string().required(),
                        label: joi_1.default.string().max(100).optional(),
                        type: joi_1.default.string().optional(),
                        weight: joi_1.default.number().min(0).max(1).optional()
                    })).max(10000),
                    metadata: joi_1.default.object({
                        layout: joi_1.default.string().valid('force', 'hierarchical', 'circular', 'grid').optional(),
                        theme: joi_1.default.string().valid('light', 'dark', 'auto').optional(),
                        interactive: joi_1.default.boolean().default(true)
                    }).optional()
                }).required()
            }).required()
        })
    };
    // Claude Code ↔ ADW Skills validation schemas
    claudeAdwSchemas = {
        // Claude Code to ADW: Validation request
        validationRequest: baseMessageSchema.keys({
            type: joi_1.default.string().valid('validate:implementation').required(),
            payload: joi_1.default.object({
                implementation: joi_1.default.object({
                    swarmId: joi_1.default.string().required(),
                    results: joi_1.default.object().required(),
                    metrics: joi_1.default.object().optional()
                }).required(),
                evidenceTracker: joi_1.default.string().uuid().required(),
                gates: joi_1.default.array().items(joi_1.default.string().valid('build', 'test', 'security', 'performance', 'documentation', 'compliance', 'accessibility', 'i18n')).min(1).max(10).required(),
                criteria: joi_1.default.object({
                    buildSuccess: joi_1.default.boolean().default(true),
                    testCoverage: joi_1.default.number().min(0).max(100).default(80),
                    securityScore: joi_1.default.number().min(0).max(100).default(85),
                    performanceThreshold: joi_1.default.number().min(0).default(2000),
                    documentationRequired: joi_1.default.boolean().default(false)
                }).optional()
            }).required()
        }),
        // ADW to Claude Code: Validation results
        validationResults: baseMessageSchema.keys({
            type: joi_1.default.string().valid('validation:results').required(),
            payload: joi_1.default.object({
                requestId: joi_1.default.string().uuid().required(),
                overallResult: joi_1.default.string().valid('passed', 'failed', 'partial').required(),
                confidence: joi_1.default.number().min(0).max(100).required(),
                gates: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    status: joi_1.default.string().valid('passed', 'failed', 'skipped', 'warning').required(),
                    score: joi_1.default.number().min(0).max(100).optional(),
                    message: joi_1.default.string().max(1000).optional(),
                    details: joi_1.default.object().optional(),
                    evidence: evidenceSchema.optional()
                })).required(),
                recommendations: joi_1.default.array().items(joi_1.default.object({
                    gate: joi_1.default.string().required(),
                    priority: joi_1.default.string().valid('low', 'medium', 'high', 'critical').required(),
                    action: joi_1.default.string().max(500).required(),
                    rationale: joi_1.default.string().max(1000).optional()
                })).max(50).optional(),
                evidence: evidenceSchema.required()
            }).required()
        })
    };
    constructor(auditLogger) {
        this.auditLogger = auditLogger;
    }
    /**
     * Validate message for specific bridge
     */
    async validateBridgeMessage(bridgeId, message) {
        try {
            let schema;
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
        }
        catch (error) {
            this.auditLogger.logValidationEvent({
                type: 'validation_error',
                bridgeId,
                messageType: message.type || 'unknown',
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Sanitize message to prevent XSS and injection attacks
     */
    sanitizeMessage(obj) {
        if (typeof obj === 'string') {
            return (0, sanitizer_1.sanitize)(obj);
        }
        else if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeMessage(item));
        }
        else if (obj && typeof obj === 'object') {
            const sanitized = {};
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
    selectDossierRufloSchema(messageType) {
        switch (messageType) {
            case 'project:init':
                return this.dossierRufloSchemas.projectInit;
            case 'task:status':
                return this.dossierRufloSchemas.taskStatus;
            default:
                throw new Error(`Unknown Dossier-ruflo message type: ${messageType}`);
        }
    }
    selectRufloGitnexusSchema(messageType) {
        switch (messageType) {
            case 'analyze:codebase':
                return this.rufloGitnexusSchemas.analysisRequest;
            case 'analysis:results':
                return this.rufloGitnexusSchemas.analysisResults;
            default:
                throw new Error(`Unknown ruflo-GitNexus message type: ${messageType}`);
        }
    }
    selectAdwRlmSchema(messageType) {
        switch (messageType) {
            case 'investigation:drill':
                return this.adwRlmSchemas.investigationRequest;
            case 'navigation:results':
                return this.adwRlmSchemas.navigationResults;
            default:
                throw new Error(`Unknown ADW-RLM message type: ${messageType}`);
        }
    }
    selectGitnexusClaudeSchema(messageType) {
        switch (messageType) {
            case 'swarm:coordinate':
                return this.gitnexusClaudeSchemas.executionRequest;
            case 'execution:results':
                return this.gitnexusClaudeSchemas.executionResults;
            default:
                throw new Error(`Unknown GitNexus-Claude message type: ${messageType}`);
        }
    }
    selectRlmDossierSchema(messageType) {
        switch (messageType) {
            case 'visualization:update':
                return this.rlmDossierSchemas.visualizationData;
            default:
                throw new Error(`Unknown RLM-Dossier message type: ${messageType}`);
        }
    }
    selectClaudeAdwSchema(messageType) {
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
exports.InputValidationSchemas = InputValidationSchemas;
//# sourceMappingURL=input-validation-schemas.js.map