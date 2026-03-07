/**
 * REPLAnalystAgent - RLM Navigator REPL specialist for repo-wide pattern analysis
 *
 * MISSION: Execute cross-cutting pattern searches and analysis using RLM Navigator's REPL capabilities
 *
 * CORE RESPONSIBILITIES:
 * - Execute cross-cutting pattern searches and analysis
 * - Maintain buffers of findings with staleness tracking
 * - Mine repositories for TODOs, technical debt, and error patterns
 * - Conduct temporal analysis of code evolution patterns
 *
 * TOOL CONSTRAINTS:
 * ✅ PRIMARY TOOLS: RLM Navigator REPL tools
 * ✅ SUPPORTING: RLM Navigator status tools
 * ❌ NEVER USE: GitNexus tools, direct file operations, one-shot search tools
 */

class REPLAnalystAgent {
    constructor() {
        this.agentId = 'repl-analyst-agent';
        this.agentType = 'REPLAnalyst';
        this.allowedTools = [
            'rlm_repl_init',
            'rlm_repl_exec',
            'rlm_repl_status',
            'rlm_repl_export',
            'rlm_repl_reset',
            'get_status'
        ];
        this.forbiddenTools = [
            'gitnexus_query',
            'gitnexus_context',
            'gitnexus_impact',
            'gitnexus_cypher',
            'Read',
            'Write',
            'Edit',
            'Bash'
        ];
        this.workingDir = '/workspaces/jlmaworkspace/new_projects/new_ideas/contexto';
        this.venvPath = './rlm-venv';
    }

    /**
     * Validate tool usage against constraints
     */
    validateToolUsage(toolName) {
        if (this.forbiddenTools.includes(toolName)) {
            throw new Error(`❌ TOOL CONSTRAINT VIOLATION: REPLAnalystAgent cannot use ${toolName}. Use RLM Navigator REPL tools only.`);
        }

        if (!this.allowedTools.includes(toolName)) {
            console.warn(`⚠️  Tool ${toolName} not in allowed list for REPLAnalystAgent`);
        }

        return true;
    }

    /**
     * WORKFLOW: RepoWidePatternMining
     * Input: Pattern description (e.g., "TODO comments", "error handling patterns")
     */
    async executePatternMining(pattern) {
        console.log(`🔍 REPLAnalystAgent: Starting pattern mining for "${pattern}"`);

        const workflow = {
            phase1: 'rlm_repl_init',
            phase2: 'pattern_search_execution',
            phase3: 'context_analysis',
            phase4: 'staleness_check',
            phase5: 'pattern_categorization',
            phase6: 'export_results'
        };

        return {
            workflow,
            agent: this.agentId,
            pattern,
            status: 'ready_for_execution',
            expectedOutput: {
                pattern_count: 'number',
                categories: 'object',
                locations: 'array',
                confidence_score: 'float'
            }
        };
    }

    /**
     * Get agent status and capabilities
     */
    getStatus() {
        return {
            agentId: this.agentId,
            agentType: this.agentType,
            status: 'operational',
            allowedTools: this.allowedTools,
            forbiddenTools: this.forbiddenTools,
            workingDir: this.workingDir,
            venvPath: this.venvPath,
            capabilities: [
                'Cross-cutting pattern searches',
                'Technical debt mining',
                'TODO/FIXME analysis',
                'Error pattern detection',
                'Code evolution analysis',
                'Staleness tracking',
                'Buffer management'
            ]
        };
    }
}

module.exports = REPLAnalystAgent;
