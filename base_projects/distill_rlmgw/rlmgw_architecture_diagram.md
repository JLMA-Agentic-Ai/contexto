# RLMgw Architecture & Flow Diagram

The following Mermaid sequence diagram visualizes the end-to-end flow of how the Recursive Language Model Gateway (RLMgw) intercepts a user's prompt, autonomous explores the repository to gather context, and forwards the enriched context to the upstream Large Language Model.

You can view this diagram natively in IDEs like VS Code (using a Mermaid preview extension) or on GitHub.

```mermaid
sequenceDiagram
    autonumber
    
    participant User as IDE / Developer Client
    participant Server as RLMgw (server.py)
    participant Session as SessionManager
    participant CPB as ContextPackBuilder
    participant RLM as Recursive Language Model
    participant Repo as Local Codebase (repo_context.py)
    participant Upstream as Upstream LLM (vLLM / OpenAI)

    User->>Server: POST /v1/chat/completions (User Query: "How does auth work?")
    
    Note over Server, Session: 1. Session Management
    Server->>Session: Get or Create Session ID
    Session-->>Server: Return Session Data (caches)

    Note over Server, CPB: 2. Context Exploration
    Server->>CPB: build_from_query(query)
    CPB->>RLM: Start autonomous RLM Context Selection
    
    rect rgb(240, 248, 255)
        Note over RLM, Repo: 3. The RLM Agentic Loop (Exploration)
        loop Up to 3 Iterations
            RLM->>Repo: Execute tool: grep("auth") or list_files()
            Repo-->>RLM: Return search matches / files
            RLM->>Repo: Execute tool: read_file("src/auth.py")
            Repo-->>RLM: Return file contents
            Note right of RLM: RLM analyzes the code<br/>to find the most relevant files.
        end
    end
    
    RLM-->>CPB: Return JSON selection (e.g., ["auth.py", "jwt.py"])
    
    Note over CPB, Repo: 4. Build Context Pack
    CPB->>Repo: Read the final selected files (with size limits)
    Repo-->>CPB: File contents
    CPB-->>Server: Return ContextPack (Code + Metadata)
    
    Server->>Session: Save ContextPack to Session history

    Note over Server, Upstream: 5. Upstream Fulfillment
    Server->>Server: Inject ContextPack into System Prompt
    Server->>Upstream: Forward enriched request to underlying model
    Upstream-->>Server: Generate Final Answer
    
    Server-->>User: Return OpenAI-compatible API Response
```

## Key Phases Explained:
1. **Request Interception:** The IDE or developer talks to RLMgw mimicking a standard OpenAI endpoint.
2. **The Agentic Loop:** Instead of blindly passing the prompt, RLMgw spins up an RLM (agent) equipped with tools to read the local disk safely.
3. **Smart Context Pack:** The agent's structured JSON output specifies exactly which files matter. These files are aggregated into a "Context Pack" string.
4. **Enriched Fulfillment:** The upstream LLM is asked the User's original prompt *plus* the Context Pack, leading to a highly accurate resolution.
