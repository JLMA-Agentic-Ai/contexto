# RLMgw (Recursive Language Model Gateway) - Comprehensive Documentation

## 1. General Overview

**RLMgw** (Recursive Language Model Gateway) is an intelligent API gateway designed to act as a middleman between developers (or IDEs) and Large Language Models (LLMs). Its primary goal is to **automatically fetch context from your codebase** before sending a query to the final AI model. 

Instead of requiring developers to manually copy-paste relevant code files into their chat prompts, RLMgw intercepts the user's question, uses an autonomous AI agent to "programmatically" explore the local repository, selects the most relevant files, packages them together into a "Context Pack", and provides this enriched context to the LLM to generate an accurate answer.

### What can be achieved with it?
- **Automated Context Gathering:** You can ask questions like "How does the authentication system work?" and the gateway will automatically read the relevant auth files and provide them to the model.
- **Support for Huge Codebases:** Because it explores the repository on-demand rather than trying to fit the entire repository into the context window, it can support massive projects efficiently.
- **IDE Integration:** Since it acts as an OpenAI-compatible API server, you can plug it directly into IDE extensions (like Claude Code, Cursor, or standard OpenAI clients). The IDE talks to RLMgw thinking it's OpenAI, and RLMgw handles the heavy lifting of context retrieval.

---

## 2. How it Works (High-Level Flow)

1. **Intercepting the Request:** The user or IDE sends a standard Chat Completion request.
2. **Session Management:** RLMgw checks if there is an ongoing session to reuse existing cached knowledge about the repository.
3. **Context Selection (The "RLM" step):**
   - RLMgw spins up a "Recursive Language Model" (RLM)—a special, programmatic agent.
   - This RLM agent is given a set of sandbox tools to search the codebase. It can list files, search (grep) for keywords, read specific files, and look at the directory structure.
   - The RLM agent analyzes the user's query, uses these tools to investigate the local repository, and outputs a JSON list of the files that are strictly relevant to answering the question.
4. **Building the Context Pack:** RLMgw reads the contents of the chosen files (truncating them if they exceed size limits) and creates a `ContextPack`.
5. **Upstream Forwarding:** RLMgw injects the `ContextPack` (which includes the raw code from the relevant files) into the original system prompt.
6. **Final Generation:** RLMgw forwards this enriched prompt to the upstream model (e.g., vLLM or OpenAI) to generate the final, context-aware answer for the user.

---

## 3. File-by-File Breakdown (English Translation)

### The Core RLM Engine (`/rlm`)
This is the foundational framework. It provides the mechanism for an LLM to exist in a "REPL" (Read-Eval-Print Loop) environment where it can write and execute Python code to answer questions recursively.

- **`rlm.py`**: The brain of the core engine. It manages the lifecycle of the Recursive Language Model. When an AI is asked to complete a task, this script spawns a sandbox environment, gives the AI a prompt, and allows the AI to loop (recursively) multiple times—writing code, executing it, reading the outcome, and deciding the next step.
- **`lm_handler.py`**: A traffic controller for the LLMs. Because the primary RLM process and its sandboxed sub-environments all need to make LLM calls concurrently, this script manages a multi-threaded server that handles these internal API requests safely and routes them to the correct model endpoints.
- **`types.py`**: A dictionary of shared data structures. It defines what an "Iteration" looks like, tracks token usage (costs), and defines the structures for storing the results of executed code.

### The RLMgw Gateway Application (`/rlmgw`)
This folder builds *on top* of the core RLM engine specifically for codebase context ingestion.

- **`server.py`**: The main entry point and the physical gateway. It is a FastAPI server that listens on port 8010. It defines the `/v1/chat/completions` endpoint. When a request comes in, it coordinates the session manager, context pack builder, and upstream client to fulfill the request.
- **`sessions.py`**: The memory module. It uses a local SQLite database (`sessions.db`) to track users. It ensures that if you send multiple messages, the system remembers your previous interactions, cached repository structures, and search results to save time.
- **`config.py`**: The settings manager. It loads settings from environment variables or command-line arguments (like what port to run on, where the repository is located, and where the upstream model is hosted).
- **`upstream.py`**: The final sender. It acts as an HTTP client that communicates with the actual underlying LLM (like vLLM, OpenAI, or Minimax). It takes the enriched context prompt and gets the final conversational response.
- **`repo_context.py`**: The secure file reader. It provides safe, read-only methods to access the actual files on your hard drive. It makes sure the AI cannot accidentally break things, read sensitive folders (like `.git` or `.venv`), or get trapped reading infinitely large files. It also calculates a "fingerprint" of the repo so the system knows if files have changed.
- **`repo_env.py`**: The toolkit bridge. It wraps the safe reader from `repo_context.py` into a set of Python functions (`list_files`, `grep`, `read_file`, `get_tree`) and makes them available globally inside the RLM sandbox environment.
- **`context_pack_rlm.py`**: The intelligent detective. This script creates the RLM instance and gives it the toolkit from `repo_env.py`. It explicitly tells the AI: *"Your task is to analyze a user's query and select the MOST RELEVANT files from the codebase... Keep context COMPACT but HIGH-SIGNAL."* It parses the AI's selection and returns the list of files to inject into the prompt.
- **`context_pack.py`**: The fallback packager. If the intelligent RLM fails for any reason, this script provides a "dumb" fallback mechanism that just searches the repository for generic keywords found in the user's prompt (like picking random files that contain the word "auth").
- **`models.py`**: The data blueprints. It uses Pydantic to strictly define what the incoming Chat Requests and outgoing Responses should look like, ensuring everything matches the strict OpenAI API standard.

---

## 4. How to Use It

1. **Install Dependencies:**
   Ensure you have Python and `uv` installed, then run:
   ```bash
   uv pip install -e .
   ```

2. **Run the Gateway Server:**
   You need to start the RLMgw server and point it to the repository you want it to explore.
   ```bash
   python -m rlmgw.server --port 8010 --repo-root /path/to/your/codebase
   ```
   *You can also configure it heavily using environment variables (e.g., setting `RLMGW_UPSTREAM_MODEL` or `RLMGW_UPSTREAM_BASE_URL`).*

3. **Query the Gateway:**
   Configure your IDE, script, or `curl` command to send requests to `http://localhost:8010/v1` instead of the official OpenAI endpoint. Ensure your downstream consumer treats it like an OpenAI-compatible API.
   
   *Example using python:*
   ```python
   import openai
   
   client = openai.OpenAI(
       base_url="http://localhost:8010/v1",
       api_key="dummy-key" 
   )
   
   response = client.chat.completions.create(
       model="default",
       messages=[{"role": "user", "content": "Explain how the routing works in this app."}]
   )
   print(response.choices[0].message.content)
   ```
   Behind the scenes, the gateway will explore the code in `/path/to/your/codebase`, discover the routing files, read them, and append them to your prompt before answering you!
