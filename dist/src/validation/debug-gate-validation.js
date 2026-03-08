"use strict";
/**
 * Debug ADW Gate Validation
 * Test individual gate execution to debug issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ADWQualityGates_js_1 = require("./ADWQualityGates.js");
const WorkflowOrchestrator_js_1 = require("../orchestration/WorkflowOrchestrator.js");
async function debugGateValidation() {
    console.log('🔧 DEBUG: ADW Gate Validation');
    console.log('='.repeat(50));
    const qualityGates = new ADWQualityGates_js_1.ADWQualityGates();
    const evidenceTracker = new WorkflowOrchestrator_js_1.EvidenceTrackerImpl();
    const workflowId = 'debug-workflow';
    // Test Gate 0: Zero-Drift Validation
    console.log('🔍 Testing Gate 0: Zero-Drift Validation');
    const gate0Data = {
        driftScore: 0.12, // <0.15 required (should pass)
        scopeChange: 0.18, // <0.20 required (should pass)
        requirementStability: 'STABLE'
    };
    console.log('Gate 0 Data:', gate0Data);
    try {
        const gate0Execution = await qualityGates.executeGate('gate-0-zero-drift', workflowId, evidenceTracker, gate0Data);
        console.log('Gate 0 Execution Result:');
        console.log('- Result:', gate0Execution.result);
        console.log('- Confidence:', gate0Execution.confidence);
        console.log('- Validation Results:');
        gate0Execution.validationResults.forEach(result => {
            console.log(`  - ${result.ruleId}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.message}`);
        });
        console.log('- Evidence:', gate0Execution.evidence.length, 'decisions');
        console.log('- Investigation Triggered:', gate0Execution.investigationTriggered);
        if (gate0Execution.result !== 'PASS') {
            console.log('❌ Gate 0 failed - checking individual rules...');
            // Manual rule checking
            console.log('\nManual Rule Evaluation:');
            console.log('- driftScore < 0.15:', gate0Data.driftScore, '<', 0.15, '=', gate0Data.driftScore < 0.15);
            console.log('- scopeChange < 0.20:', gate0Data.scopeChange, '<', 0.20, '=', gate0Data.scopeChange < 0.20);
        }
        else {
            console.log('✅ Gate 0 passed successfully');
        }
    }
    catch (error) {
        console.error('❌ Gate 0 execution failed:', error.message);
    }
    console.log('\n' + '='.repeat(50));
}
// Run debug
debugGateValidation().catch(console.error);
//# sourceMappingURL=debug-gate-validation.js.map