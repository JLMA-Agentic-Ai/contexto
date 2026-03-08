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
import { SecurityAuditLogger } from './audit-logger';
export declare class InputValidationSchemas {
    private auditLogger;
    readonly dossierRufloSchemas: {
        projectInit: any;
        taskStatus: any;
    };
    readonly rufloGitnexusSchemas: {
        analysisRequest: any;
        analysisResults: any;
    };
    readonly adwRlmSchemas: {
        investigationRequest: any;
        navigationResults: any;
    };
    readonly gitnexusClaudeSchemas: {
        executionRequest: any;
        executionResults: any;
    };
    readonly rlmDossierSchemas: {
        visualizationData: any;
    };
    readonly claudeAdwSchemas: {
        validationRequest: any;
        validationResults: any;
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