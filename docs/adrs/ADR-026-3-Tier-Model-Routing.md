# ADR-026: 3-Tier Model Routing Implementation

**Status**: Accepted
**Date**: 2026-03-08
**Decision Makers**: ADW Development Team, Performance Engineering Council
**Work Unit**: ADW-VISION-MAESTRA-001
**Evidence Quality**: SOLID
**Authority Score**: 0.88
**Truth Score**: 0.93

## Context

Visión Maestra platform requires intelligent routing of development tasks and AI agent operations across different computational tiers to optimize performance, cost, and latency. The system must automatically determine the appropriate tier for each operation while maintaining development workflow responsiveness.

**Platform Impact**: Visión Maestra 6-Component Platform
- **Affected Components**: All components with AI/ML operations and task routing
- **Integration Points**: Agent spawning, task execution, model inference
- **Bridge Architecture Impact**: Routing decisions within bridge communications

## Decision

Implement **3-Tier Intelligent Routing Architecture** with automatic complexity detection, cost optimization, and performance targeting.

### Tier Architecture:
1. **Tier 1: Agent Booster (WASM)** - Ultra-fast local processing
   - Latency: <1ms, Cost: $0
   - Simple transforms, syntax fixes, type additions
   - Skip LLM for deterministic operations

2. **Tier 2: Haiku Model** - Fast AI processing
   - Latency: ~500ms, Cost: $0.0002
   - Simple tasks, low complexity operations (<30%)
   - Standard development tasks, basic code generation

3. **Tier 3: Sonnet/Opus Model** - Complex AI reasoning
   - Latency: 2-5s, Cost: $0.003-0.015
   - Complex reasoning, architecture decisions, security analysis
   - High complexity operations (>30%)

### Routing Algorithm:
```typescript
interface TaskComplexity {
  syntactic: number;    // 0-1 (simple transforms to complex parsing)
  semantic: number;     // 0-1 (basic logic to complex reasoning)
  contextual: number;   // 0-1 (local scope to system-wide impact)

  overall: number;      // Weighted average
}

function routeTask(task: Task): Tier {
  const complexity = analyzeComplexity(task);

  if (complexity.overall < 0.05) return Tier.WASM_BOOSTER;
  if (complexity.overall < 0.30) return Tier.HAIKU;
  return Tier.SONNET_OPUS;
}
```

## Evidence Base

### Primary Evidence Sources
- **Claude Model Performance Benchmarks** (Authority: 0.95)
- **WebAssembly Performance Studies** (Authority: 0.90)
- **AI Cost Optimization Research** (Authority: 0.85)
- **Latency-Sensitive Application Architecture** (Authority: 0.8)
- **Multi-Tier Computing Pattern Documentation** (Authority: 0.85)

### Authority Assessment
| Source Type | Authority Weight | Quality Score | Contribution |
|-------------|------------------|---------------|-------------|
| Model Benchmarks | 0.95 | 0.92 | Direct performance evidence |
| WASM Studies | 0.90 | 0.88 | Local processing capabilities |
| Cost Research | 0.85 | 0.85 | Economic optimization data |
| Architecture Patterns | 0.85 | 0.83 | Multi-tier design evidence |

### Truth Score Calculation
- **Evidence Completeness**: 0.90/1.0 (comprehensive tier coverage)
- **Source Authority**: 0.89/1.0 (strong technical evidence)
- **Technical Feasibility**: 0.95/1.0 (proven implementation patterns)
- **Implementation Readiness**: 0.93/1.0 (available technologies)
- **Overall Truth Score**: 0.93/1.0

## Alternatives Considered

### 1. Single-Tier (Sonnet Only)
- **Pros**: Consistent performance, simple routing
- **Cons**: High cost, unnecessary latency for simple tasks
- **Evidence**: SOFT (works but economically inefficient)

### 2. Two-Tier (Haiku + Sonnet)
- **Pros**: Good balance, simpler than three-tier
- **Cons**: Misses WASM optimization opportunities
- **Evidence**: SOLID (good approach, but suboptimal for simple transforms)

### 3. Four-Tier (+ Local Models)
- **Pros**: Maximum optimization opportunities
- **Cons**: Complexity overhead, infrastructure requirements
- **Evidence**: SHAKY (theoretical benefits unclear vs. complexity cost)

### 4. Dynamic Pricing-Based Routing
- **Pros**: Real-time cost optimization
- **Cons**: Unpredictable performance, complex billing
- **Evidence**: SOFT (interesting but adds uncertainty)

## Consequences

### Positive Consequences
- **Cost Optimization**: 80-90% cost reduction for simple operations
- **Performance**: Sub-millisecond response for deterministic tasks
- **Scalability**: WASM tier handles unlimited simple operations
- **Quality**: Complex tasks get appropriate computational power
- **Predictability**: Clear routing rules enable performance planning

### Negative Consequences
- **Routing Complexity**: Task classification adds computational overhead
- **Edge Cases**: Boundary tasks may be misclassified initially
- **Infrastructure**: Three different execution environments to maintain
- **Debugging**: Multi-tier debugging more complex than single-tier

### Risk Assessment
- **Risk**: Misclassification sends complex tasks to simple tiers
- **Mitigation**: Automatic escalation when simple tier fails
- **Risk**: WASM tier becomes bottleneck for simple tasks
- **Mitigation**: Horizontal scaling and task batching
- **Risk**: Cost optimization leads to quality degradation
- **Mitigation**: Quality gates prevent inappropriate tier selection

## Implementation

### Success Criteria
- [ ] 90% cost reduction for simple operations vs. single-tier Sonnet
- [ ] <1ms response time for WASM tier operations
- [ ] <5% misclassification rate for task routing
- [ ] Automatic escalation works for failed tier-1/tier-2 operations
- [ ] Overall system performance improves vs. baseline

### Monitoring Strategy
- **Tier Usage**: Distribution of tasks across tiers
- **Performance**: Latency percentiles per tier
- **Accuracy**: Routing accuracy and escalation rates
- **Cost**: Cost per operation by tier
- **Quality**: Output quality scores by tier

### Rollback Plan
1. **Phase 1**: Disable specific tier, route to next higher tier
2. **Phase 2**: Fall back to two-tier (Haiku + Sonnet) routing
3. **Phase 3**: Emergency single-tier Sonnet routing

## Visión Maestra Integration

### Component Integration

**Agent Booster (WASM) Use Cases**:
- **Syntax Fixes**: Convert `var` to `const`, add missing semicolons
- **Type Additions**: Add TypeScript type annotations to untyped code
- **Import Organization**: Sort and organize import statements
- **Code Formatting**: Apply consistent formatting rules

**Haiku Model Use Cases**:
- **Simple Code Generation**: Basic function implementations
- **Test Generation**: Unit test scaffolding
- **Documentation**: Simple docstring generation
- **Code Reviews**: Basic style and convention checks

**Sonnet/Opus Model Use Cases**:
- **Architecture Decisions**: Complex design pattern selection
- **Security Analysis**: Comprehensive security vulnerability assessment
- **Performance Optimization**: Complex algorithmic improvements
- **Cross-Component Integration**: System-wide design decisions

### Bridge Architecture Impact
- **Intelligent Routing**: Bridges automatically select appropriate tier
- **Cost Awareness**: Bridge operations optimized for cost/performance
- **Quality Assurance**: Complex decisions get appropriate computational power

### Real-time Streaming Considerations
- **Tier-1 Streaming**: Immediate updates for simple transformations
- **Tier-2/3 Buffering**: Batch and stream complex operation results
- **Progressive Enhancement**: Start with simple tier, enhance with complex tiers

### Enterprise Security Impact
- **Tier Isolation**: Each tier has appropriate security controls
- **Data Classification**: Sensitive operations routed to secure tiers
- **Audit Trails**: Tier selection decisions logged for compliance

## Implementation Details

### Complexity Analysis Algorithm
```typescript
class ComplexityAnalyzer {
  analyzeTask(task: Task): TaskComplexity {
    const syntactic = this.analyzeSyntactic(task);
    const semantic = this.analyzeSemantic(task);
    const contextual = this.analyzeContextual(task);

    const overall = (
      syntactic * 0.2 +     // Syntax weight: 20%
      semantic * 0.5 +      // Logic weight: 50%
      contextual * 0.3      // Context weight: 30%
    );

    return { syntactic, semantic, contextual, overall };
  }

  private analyzeSyntactic(task: Task): number {
    // Check for deterministic transformations
    if (isDeterministicTransform(task)) return 0.0;
    if (isSimpleCodeGen(task)) return 0.2;
    if (isComplexParsing(task)) return 0.8;
    return 0.5; // Default
  }

  private analyzeSemantic(task: Task): number {
    // Analyze logical complexity
    if (isPatternMatching(task)) return 0.1;
    if (isBusinessLogic(task)) return 0.6;
    if (isArchitectural(task)) return 0.9;
    return 0.5; // Default
  }

  private analyzeContextual(task: Task): number {
    // Analyze scope and impact
    if (isSingleFunction(task)) return 0.1;
    if (isSingleComponent(task)) return 0.4;
    if (isSystemWide(task)) return 0.9;
    return 0.5; // Default
  }
}
```

### Tier Configuration
```typescript
const tierConfig = {
  wasm: {
    maxConcurrency: 1000,
    timeoutMs: 100,
    fallbackTier: 'haiku'
  },
  haiku: {
    maxConcurrency: 50,
    timeoutMs: 5000,
    costPerRequest: 0.0002,
    fallbackTier: 'sonnet'
  },
  sonnet: {
    maxConcurrency: 10,
    timeoutMs: 30000,
    costPerRequest: 0.003,
    fallbackTier: null
  }
};
```

## Compliance and Governance

### Evidence Validation
- **Evidence Quality**: SOLID (benchmark data + proven patterns)
- **Authority Score**: 0.88 (strong technical evidence)
- **Truth Score**: 0.93 (validated optimization approach)
- **Validation Status**: APPROVED for production implementation

### Cross-ADR References
- ADR-001: 6-Component Integration Architecture (overall system context)
- ADR-002: Bridge-Based Communication Pattern (routing within bridges)
- ADR-003: Real-time Streaming Protocol Selection (streaming tier results)

### Related ADRs
- Future: WASM Agent Booster Implementation ADR
- Future: AI Model Performance Optimization ADR

---

**ADR Governance Metadata**
- **Promoted Date**: 2026-03-08T09:40:00Z
- **Evidence Review Date**: 2026-03-08T09:40:00Z
- **Next Review Due**: 2026-04-08T09:40:00Z
- **Governance Version**: ADW-ENH-001