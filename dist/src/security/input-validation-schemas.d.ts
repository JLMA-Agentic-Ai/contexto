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
import { SecurityAuditLogger } from './audit-logger';
export declare class InputValidationSchemas {
    private auditLogger;
    readonly dossierRufloSchemas: {
        projectInit: Joi.ObjectSchema<any>;
        taskStatus: Joi.ObjectSchema<any>;
    };
    readonly rufloGitnexusSchemas: {
        analysisRequest: Joi.ObjectSchema<any>;
        analysisResults: Joi.ObjectSchema<any>;
    };
    readonly adwRlmSchemas: {
        investigationRequest: Joi.ObjectSchema<any>;
        navigationResults: Joi.ObjectSchema<any>;
    };
    readonly gitnexusClaudeSchemas: {
        executionRequest: Joi.ObjectSchema<any>;
        executionResults: Joi.ObjectSchema<any>;
    };
    readonly rlmDossierSchemas: {
        visualizationData: Joi.ObjectSchema<any>;
    };
    readonly claudeAdwSchemas: {
        validationRequest: Joi.ObjectSchema<any>;
        validationResults: Joi.ObjectSchema<any>;
    };
    constructor(auditLogger: SecurityAuditLogger);
    /**
     * Validate message for specific bridge
     */
    validateBridgeMessage(bridgeId: string, message: any): Promise<any>;
    /**
     * Sanitize message to prevent XSS and injection attacks
     */
    private sanitizeMessage;
    /**
     * Schema selection methods
     */
    private selectDossierRufloSchema;
    private selectRufloGitnexusSchema;
    private selectAdwRlmSchema;
    private selectGitnexusClaudeSchema;
    private selectRlmDossierSchema;
    private selectClaudeAdwSchema;
}
//# sourceMappingURL=input-validation-schemas.d.ts.map