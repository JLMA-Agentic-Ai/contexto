# Full Comparison: FACT vs. RLMgw

This document provides a deep, side-by-side comparison of two distinct approaches to solving the problem of "giving AI the right context": **FACT (Fast Augmented Context Tools)** and **RLMgw (Recursive Language Model Gateway)**.

---

## 1. The Core Problem Each System Solves

Both systems are trying to solve the same core challenge in AI engineering:
> *"How do you give an LLM accurate, fresh, relevant context without flooding it with your entire dataset?"*

However, they solve this from **fundamentally different philosophies**.

| Question | FACT | RLMgw |
|---|---|---|
| **What kind of data?** | Structured data (databases, SQL, APIs) | Unstructured code (source files, repositories) |
| **Core paradigm** | Replace RAG with MCP tool execution + prompt caching | Replace manual context-pasting with autonomous AI exploration |
| **Target user** | Data scientists, financial analysts, business teams | Software developers, coding agents, IDEs |
| **Data source** | Live databases & external APIs | Local filesystem / Git repository |

---

## 2. Architecture Overview (How Each One Works)

### FACT — The "Cache-First Tool Caller"

FACT is a **complete application** powered 100% natively by Anthropic's API (`anthropic` SDK). Its flow is:

```
User Query
    │
    ▼
[1] Check local cache (by query hash) ─── Cache HIT ──► Return cached response (Sub-50ms)
    │
    Cache MISS
    │
    ▼
[2] Call Anthropic (Claude) with the query AND a list of registered MCP "tools" 
    (e.g., SQL.QueryReadonly, SQL.GetSchema, System.GetMetrics)
    │
    ▼
[3] Claude decides which tools to call (if any) → ToolUseBlock is returned
    │
    ▼
[4] FACT executes the chosen tool locally or via Arcade.dev cloud 
    (real SQL query, live API call, etc.)
    │
    ▼
[5] Tool result (exact data) is appended to conversation → Claude generates final answer
    │
    ▼
[6] Final answer is stored back into local cache for future re-use
    │
    ▼
Return response to User (~95-180ms)
```

**The key idea:** The LLM itself decides *which tool to call and what arguments to use*, based on natural language. It never sees ambiguous "similar chunks". It gets **exact, live data**.

---

### RLMgw — The "Autonomous Context Explorer"

RLMgw is a **transparent proxy server** (OpenAI-compatible API). Its flow is:

```
IDE / Chat Client sends Chat Completion request
    │
    ▼
[1] RLMgw intercepts the request (FastAPI server on port 8010)
    │
    ▼
[2] Check or create Session (SQLite database) 
    │
    ▼
[3] Spin up an RLM (recursive AI agent) to EXPLORE the codebase:
    ─ The RLM is given tools: list_files(), grep(pattern), read_file(path), get_tree()
    ─ The RLM runs in a loop (up to 3 iterations):
        → Searches for relevant keywords in the repo
        → Reads files it considers relevant
        → Returns a JSON list: { "relevant_files": ["auth.py", "jwt.py"], ... }
    │
    ▼
[4] RLMgw reads those selected files and packages them into a "Context Pack" 
    (a formatted block of raw source code, truncated to fit)
    │
    ▼
[5] RLMgw PREPENDS the Context Pack into the system message and FORWARDS the 
    enriched request to the upstream LLM (vLLM, OpenAI, or LiteLLM proxy)
    │
    ▼
[6] Upstream LLM responds. RLMgw passes the response back transparently.
    │
    ▼
Return response to IDE
```

**The key idea:** The **tool execution itself IS the context selection**. The agent doesn't talk to a database; it reads your local disk to intelligently decide which code files to include.

---

## 3. Deep Technical Comparison

### 3.1 Context Retrieval Mechanism

| Aspect | FACT | RLMgw |
|---|---|---|
| **How context is found** | LLM picks a registered tool → exact call is executed | Autonomous RLM agent explores files using grep/read | 
| **Determinism** | **Deterministic**: same query → same tool → same exact data | **Non-deterministic**: agent's exploration may vary per run |
| **Data freshness** | **Live**: every tool call hits the live DB or API | **Point-in-time**: reads current file contents on disk |
| **Speed of retrieval** | ~45-100ms (if cache miss, direct SQL query) | Slower (multiple LLM calls in the RLM loop, 3 iterations)  |

### 3.2 Caching Strategy

| Aspect | FACT | RLMgw |
|---|---|---|
| **Cache exists?** | ✅ Yes, the **central feature** | Minimal — sessions persist the repo fingerprint only |
| **Cache technology** | In-memory + optional disk. Thread-safe LRU + frequency-based eviction | SQLite (session stored for TTL of 24h) |
| **Cache key** | SHA-256 hash of the user query string | SHA-256 hash of request data or custom `X-Session-Id` header |
| **Cache TTL** | Intelligent/ configurable per content type (seconds to hours) | 24 hours per session |
| **Cache invalidation** | Prefix-based. Smart eviction with scoring (recency + frequency + age) | Time-based + LRU eviction when `max_sessions` is hit |
| **Cache hit latency** | <25ms (sub-50ms target) | Not a primary feature |

### 3.3 LLM / AI Provider Support

| Aspect | FACT | RLMgw |
|---|---|---|
| **Supported providers** | **Anthropic only** (hardcoded `anthropic.Anthropic()` SDK calls) | OpenAI, Anthropic, Portkey, OpenRouter, LiteLLM, vLLM |
| **API key required** | `ANTHROPIC_API_KEY` environment variable | Passed through to upstream; "dummy" for local vLLM |
| **Streaming support** | Yes (native Anthropic streaming) | ❌ Explicitly disabled in gateway |
| **Model in codebase** | `claude-sonnet-4` (configurable via `CLAUDE_MODEL` env var) | `minimax-m2-1` (default, fully configurable via env vars) |

### 3.4 Security Model

| Aspect | FACT | RLMgw |
|---|---|---|
| **Data access** | Read-only SQL enforced at tool level. 4-layer validation | Path-safety enforced. No writes. Symlink/traversal prevention |
| **Input validation** | SQL injection detection, query length limits, content safety | Basic: Claude Code message format normalization |
| **Rate limiting** | ✅ Built-in tool rate limiter (60 calls/min, configurable) | ❌ None implemented |
| **Auth / RBAC** | ✅ `AuthorizationManager`, session + user-level checks | ❌ None (designed for local LAN use) |
| **Audit logging** | ✅ Full structured logging for every tool call (`structlog`) | Basic Python `logging` module |

### 3.5 Data Types Supported

| Aspect | FACT | RLMgw |
|---|---|---|
| **Source of truth** | SQL databases (SQLite, financial data), Live APIs | Any local file (`.py`, `.md`, `.json`, `.yaml`, `.txt`) |
| **Output type** | Formatted answers derived from **exact live data** | Code-aware answers derived from **raw file contents** |
| **Domain** | Business intelligence, financial analytics, structured queries | Software development, code understanding, coding agents |

---

## 4. What Can Be Achieved with Each?

### FACT — Best For:

- ✅ **Business Intelligence**: "Which products have the lowest inventory?" → hits live DB
- ✅ **Financial Analysis**: "Show Q1 revenue growth by sector" → runs exact SQL query
- ✅ **Operations Monitoring**: "What are current system metrics?" → calls `System.GetMetrics`
- ✅ **High-throughput scenarios** where the same types of questions are asked repeatedly (cache hit rate: 87%)
- ✅ **Enterprise deployments** requiring audit trails, RBAC, and injection protection

### RLMgw — Best For:

- ✅ **Coding Assistants**: "How does authentication work in this repo?" → reads auth files
- ✅ **IDE Integration**: Drop-in replacement for OpenAI endpoint in Claude Code / Cursor
- ✅ **Codebase Q&A**: "Where is the database schema defined?" → grep finds it, reads it
- ✅ **Local/Private Repos**: No code ever leaves your machine (except for what gets packed into the context)
- ✅ **Multi-model flexibility**: Works with any OpenAI-compatible backend including vLLM

---

## 5. Infrastructure Requirements

| Requirement | FACT | RLMgw |
|---|---|---|
| **Python version** | 3.8+ | 3.12+ |
| **External API** | Anthropic API (required, paid) | Any OpenAI-compatible backend |
| **Database** | SQLite (bundled, for financial demo data) | SQLite (bundled, for session storage) |
| **Local server** | Runs as CLI / library / REST API | Runs as a FastAPI HTTP server on port 8010 |
| **Cloud optional** | Arcade.dev (optional, for complex cloud tools) | Modal / Prime sandboxes (optional, for isolated REPL) |
| **Vector DB** | ❌ None needed (by design) | ❌ None needed (by design) |
| **Local GPU / model** | ❌ None needed (uses Anthropic cloud) | ⚠️ Upstream model required (can be OpenAI API, LiteLLM, or vLLM) |

---

## 6. Flowchart: How They Conceptually Differ

```
                    User's Question
                         │
           ┌─────────────┴─────────────┐
           │                           │
        [FACT]                      [RLMgw]
     "structured data"          "source code"
           │                           │
    Cache check first           Intercept request
    (by query hash)                    │
           │                 Spin up RLM agent
   Cache HIT? → Return             that explores
           │                      local repo files
   Cache MISS?                         │
           │               Builds Context Pack
   Claude picks tools                  │
   from registered list     Enriches system prompt
           │                           │
   Execute tool (SQL,          Forward to upstream LLM
   API, metrics...)                    │
           │                  Get final response
   Exact data returned                 │
           │                  Pass through to IDE
   Claude answers                      │
           │
   Cache the answer
           │
   Return to user
```

---

## 7. Verdict: Which to Use When?

| Scenario | Recommended Tool |
|---|---|
| You have a database and want AI to query it intelligently | **FACT** |
| You have a codebase and want your IDE to understand it | **RLMgw** |
| You already use Anthropic API and don't want an extra server | **FACT** |
| You want to plug into ANY LLM provider (including local models) | **RLMgw** |
| You need a repeatable, auditable, enterprise-grade system | **FACT** |
| You need a quick, transparent proxy with no infrastructure changes | **RLMgw** |
| Your data changes live and must always be fresh | **FACT** |
| Your data is static files (code) in a repository | **RLMgw** |

### Could you combine them?
**Yes!** FACT could be used for the business/data layer while RLMgw powers the coding assistant layer. They solve orthogonal problems and could coexist in the same engineering stack.
