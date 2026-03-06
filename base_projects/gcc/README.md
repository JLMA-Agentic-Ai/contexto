arXiv:2508.00031 is “Git Context Controller: Manage the Context of LLM-based Agents like Git” by Junde Wu (University of Oxford), submitted 30 Jul 2025.

What the paper proposes
It introduces Git-Context-Controller (GCC): a context/memory management framework for LLM agents that treats “context” like a version-controlled workspace, using Git-like operations (COMMIT, BRANCH, MERGE, CONTEXT).
GCC externalizes agent state into a persistent on-disk structure under a .GCC/ directory (e.g., main.md, and per-branch commit.md, log.md, metadata.yaml) so agents can checkpoint progress, explore alternatives, and resume/handoff across sessions.
​

Key commands/abstractions
COMMIT: checkpoint a coherent milestone into structured summaries (and optionally update the global roadmap).
​

BRANCH: isolate an alternative approach/hypothesis without contaminating the main trajectory.
​

MERGE: synthesize results from a branch back into the main plan with preserved traceability.
​

CONTEXT: retrieve memory at multiple granularities (roadmap, recent commits, specific commit details, log tail, metadata segments).
​

Reported results
On SWE-Bench-Lite, the paper reports 48.00% resolved for “Ours” (GCC + Claude 3.5 Sonnet) and claims this is best among 26 compared systems in their table.
​
It also reports a self-replication case study where a GCC-augmented CLI agent reproducing a CLI scores 40.7% task resolution vs 11.7% without GCC.
​

Links
arXiv abstract: 
https://arxiv.org/abs/2508.00031

HTML version: 
https://arxiv.org/html/2508.00031v1
​

Code (as linked in the paper): https://github.com/theworldofagents/GCC
​

If you tell me what you care about (e.g., “how to implement GCC-like memory in my agent stack” or “what the SWE-Bench eval setup implies”), I can extract the most relevant design details.