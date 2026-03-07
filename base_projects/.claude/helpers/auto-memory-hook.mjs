#!/usr/bin/env node

/**
 * Auto Memory Hook for Claude Code
 * Manages session memory and learning across interactions
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../../');
const memoryDir = join(projectRoot, '.claude/memory');

class AutoMemoryHook {
  constructor() {
    this.memoryFile = join(memoryDir, 'MEMORY.md');
    this.sessionFile = join(memoryDir, 'session.json');
  }

  async initialize() {
    try {
      // Ensure memory directory exists
      await this.ensureDirectoryExists(memoryDir);

      // Initialize memory file if it doesn't exist
      if (!existsSync(this.memoryFile)) {
        await this.initializeMemoryFile();
      }

      return { status: 'success', message: 'Auto memory hook initialized' };
    } catch (error) {
      console.error('[AutoMemory] Initialization error:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  async ensureDirectoryExists(dir) {
    const { mkdirSync } = await import('fs');
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async initializeMemoryFile() {
    const initialContent = `# Auto Memory

## Project: Contexto
- Repository: GitNexus integration with RLM Navigator
- Architecture: Domain-Driven Design with event sourcing
- Current branch: new/gitnexus-rlmnavigator

## Key Patterns
- Use hierarchical swarm topology for complex tasks
- Keep agents under 8 for tight coordination
- Follow TDD London School for new code

## Recent Activities
- Extracted RLM Navigator package
- Initialized hierarchical swarm
- Working with GitNexus and RLM Navigator integration

---
*This file is automatically updated by Claude Code hooks*
`;

    writeFileSync(this.memoryFile, initialContent, 'utf8');
  }

  async updateSession(data) {
    try {
      const sessionData = {
        lastUpdate: new Date().toISOString(),
        swarmId: data.swarmId || null,
        activeAgents: data.activeAgents || [],
        currentBranch: data.currentBranch || 'main',
        ...data
      };

      writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2), 'utf8');
      return { status: 'success' };
    } catch (error) {
      console.error('[AutoMemory] Session update error:', error.message);
      return { status: 'error', error: error.message };
    }
  }
}

// Main execution
async function main() {
  const hook = new AutoMemoryHook();
  const result = await hook.initialize();

  if (result.status === 'success') {
    console.log('[AutoMemory] ✓ Hook initialized successfully');
    process.exit(0);
  } else {
    console.error('[AutoMemory] ✗ Hook initialization failed:', result.error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('[AutoMemory] Fatal error:', error);
    process.exit(1);
  });
}

export default AutoMemoryHook;
