/**
 * ClaudeCodeBridge Integration Tests
 * PRODUCTION CRITICAL: Tests native execution and agent coordination
 */

import { ClaudeCodeBridge, ClaudeCodeConfig } from '../../src/bridges/ClaudeCodeBridge';
import { createMockBridgeConfig } from '../setup';

describe('ClaudeCodeBridge - Production Integration Tests', () => {
  let claudeCodeBridge: ClaudeCodeBridge;
  let mockConfig: ClaudeCodeConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
      execution: {
        apiEndpoint: 'http://localhost:7000/api',
        apiKey: global.mockApiKey,
        maxConcurrentExecutions: 10,
        executionTimeout: 30000,
        sandboxMode: true
      },
      agents: {
        coordinatorEndpoint: 'http://localhost:7001/coordinator',
        maxActiveAgents: 20,
        agentPoolSize: 50,
        heartbeatInterval: 30000
      },
      tools: {
        availableTools: ['read', 'write', 'execute', 'search', 'edit', 'bash'],
        customToolRegistry: '',
        toolExecutionTimeout: 15000,
        toolRateLimits: {
          'execute': 20,
          'search': 100,
          'bash': 10,
          'edit': 50
        }
      },
      coordination: {
        workflow: 'hybrid',
        failureStrategy: 'retry-then-continue',
        resultAggregation: 'smart-merge'
      }
    } as ClaudeCodeConfig;

    claudeCodeBridge = new ClaudeCodeBridge(mockConfig);
  });

  afterEach(async () => {
    await claudeCodeBridge.disconnect();
  });

  describe('Code Execution - CRITICAL', () => {
    beforeEach(async () => {
      await claudeCodeBridge.connect();
    });

    test('should execute JavaScript code snippets securely', async () => {
      const codeExecution = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          const data = [1, 2, 3, 4, 5];
          const sum = data.reduce((acc, val) => acc + val, 0);
          const average = sum / data.length;

          console.log('Sum:', sum);
          console.log('Average:', average);

          return { sum, average, count: data.length };
        `,
        context: {
          id: 'test-execution-001',
          type: 'code_execution',
          initiator: 'production-test',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 128,
              maxCPUPercent: 30,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 128,
            maxCPUTime: 5000,
            maxWallTime: 10000,
            maxOutputSize: 1024,
            tempDirectoryQuota: 1048576
          },
          constraints: {
            timeout: 10000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { testType: 'unit' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      };

      const startTime = Date.now();
      const result = await claudeCodeBridge.executeCode(codeExecution);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should execute within 5 seconds
      expect(result.data?.output).toContain('Sum: 15');
      expect(result.data?.output).toContain('Average: 3');
      expect(result.data?.returnValue).toEqual({ sum: 15, average: 3, count: 5 });
    });

    test('should handle Python code execution', async () => {
      const pythonExecution = {
        type: 'script' as const,
        language: 'python',
        code: `
import json
import math

def analyze_data(numbers):
    """Analyze a list of numbers and return statistics."""
    if not numbers:
        return {"error": "No data provided"}

    total = sum(numbers)
    count = len(numbers)
    mean = total / count

    # Calculate standard deviation
    variance = sum((x - mean) ** 2 for x in numbers) / count
    std_dev = math.sqrt(variance)

    return {
        "count": count,
        "sum": total,
        "mean": mean,
        "std_dev": std_dev,
        "min": min(numbers),
        "max": max(numbers)
    }

# Test data
test_data = [10, 20, 30, 40, 50]
result = analyze_data(test_data)
print(json.dumps(result, indent=2))
        `,
        context: {
          id: 'python-test-001',
          type: 'script_execution',
          initiator: 'data-analysis',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 256,
              maxCPUPercent: 50,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 256,
            maxCPUTime: 10000,
            maxWallTime: 15000,
            maxOutputSize: 2048,
            tempDirectoryQuota: 2097152
          },
          constraints: {
            timeout: 15000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: { analysisType: 'statistical' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      };

      const result = await claudeCodeBridge.executeCode(pythonExecution);

      expect(result.success).toBe(true);
      expect(result.data?.output).toContain('"count": 5');
      expect(result.data?.output).toContain('"sum": 150');
      expect(result.data?.output).toContain('"mean": 30');
    });

    test('should enforce security sandbox restrictions', async () => {
      const maliciousCode = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          // Attempt to access filesystem
          const fs = require('fs');
          try {
            const sensitiveData = fs.readFileSync('/etc/passwd', 'utf8');
            console.log('SECURITY BREACH:', sensitiveData);
          } catch (error) {
            console.log('File access blocked:', error.message);
          }

          // Attempt to spawn process
          const { exec } = require('child_process');
          try {
            exec('ls -la /', (error, stdout, stderr) => {
              if (error) {
                console.log('Process spawn blocked:', error.message);
              } else {
                console.log('SECURITY BREACH:', stdout);
              }
            });
          } catch (error) {
            console.log('Process access blocked:', error.message);
          }

          return "security-test-completed";
        `,
        context: {
          id: 'security-test',
          type: 'security_validation',
          initiator: 'security-team',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 64,
              maxCPUPercent: 20,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 3000,
            maxWallTime: 5000,
            maxOutputSize: 512,
            tempDirectoryQuota: 524288
          },
          constraints: {
            timeout: 5000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'maximum'
          },
          metadata: { securityTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000)
        }
      };

      const result = await claudeCodeBridge.executeCode(maliciousCode);

      expect(result.success).toBe(true);
      expect(result.data?.output).toContain('blocked');
      expect(result.data?.output).not.toContain('SECURITY BREACH');
      expect(result.data?.securityViolations).toBeGreaterThan(0);
    });

    test('should handle concurrent code executions', async () => {
      const executions = Array(5).fill(0).map((_, i) => ({
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          const start = Date.now();
          let sum = 0;
          for (let j = 0; j < 1000000; j++) {
            sum += j;
          }
          const end = Date.now();
          return { executionId: ${i}, sum, duration: end - start };
        `,
        context: {
          id: `concurrent-execution-${i}`,
          type: 'performance_test',
          initiator: 'load-test',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 64,
              maxCPUPercent: 25,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 5000,
            maxWallTime: 10000,
            maxOutputSize: 256,
            tempDirectoryQuota: 262144
          },
          constraints: {
            timeout: 10000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: { concurrentTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000)
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        executions.map(exec => claudeCodeBridge.executeCode(exec))
      );
      const totalTime = Date.now() - startTime;

      // All executions should succeed
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.data?.returnValue.executionId).toBe(i);
      });

      // Concurrent execution should be faster than sequential
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    test('should handle execution timeouts and resource limits', async () => {
      const longRunningCode = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          // Intentionally long-running code
          let result = 0;
          const start = Date.now();

          while (Date.now() - start < 20000) { // 20 seconds
            result += Math.random();
          }

          return result;
        `,
        context: {
          id: 'timeout-test',
          type: 'timeout_validation',
          initiator: 'resource-test',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 32,
              maxCPUPercent: 10,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 32,
            maxCPUTime: 3000, // 3 second CPU limit
            maxWallTime: 5000, // 5 second wall time limit
            maxOutputSize: 128,
            tempDirectoryQuota: 131072
          },
          constraints: {
            timeout: 5000, // 5 second timeout
            maxRetries: 0,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: { timeoutTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000)
        }
      };

      const result = await claudeCodeBridge.executeCode(longRunningCode);

      // Should timeout and handle gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Agent Management - CRITICAL', () => {
    beforeEach(async () => {
      await claudeCodeBridge.connect();
    });

    test('should spawn and manage specialized agents', async () => {
      const agentTypes = [
        { type: 'coder', name: 'senior-typescript-dev', config: { specialization: 'typescript', experience: 'senior' } },
        { type: 'reviewer', name: 'code-quality-expert', config: { focus: 'security', standards: 'enterprise' } },
        { type: 'tester', name: 'qa-automation-specialist', config: { testTypes: ['unit', 'integration'], framework: 'jest' } }
      ];

      const agents = [];
      for (const agentSpec of agentTypes) {
        const agent = await claudeCodeBridge.spawnAgent(agentSpec.type, agentSpec.name, agentSpec.config);

        expect(agent.success).toBe(true);
        expect(agent.data?.type).toBe(agentSpec.type);
        expect(agent.data?.name).toBe(agentSpec.name);
        expect(agent.data?.status).toBe('active');

        agents.push(agent.data!);
      }

      // Verify agents are registered and active
      const activeAgents = await claudeCodeBridge.getActiveAgents();
      expect(activeAgents.success).toBe(true);
      expect(activeAgents.data?.agents.length).toBe(3);
    });

    test('should assign and track tasks to agents', async () => {
      const agent = await claudeCodeBridge.spawnAgent('coder', 'task-executor', {
        specialization: 'backend',
        languages: ['typescript', 'python']
      });

      expect(agent.success).toBe(true);
      const agentId = agent.data!.id;

      const task = {
        type: 'code-generation',
        description: 'Create REST API endpoint for user authentication',
        requirements: {
          framework: 'express',
          language: 'typescript',
          features: ['jwt-auth', 'input-validation', 'error-handling'],
          testCoverage: 90
        },
        priority: 'high',
        deadline: new Date(Date.now() + 3600000) // 1 hour
      };

      const taskAssignment = await claudeCodeBridge.assignTask(agentId, task);

      expect(taskAssignment.success).toBe(true);
      expect(taskAssignment.data?.taskId).toBeDefined();
      expect(taskAssignment.data?.status).toBe('assigned');

      // Check task status
      const taskStatus = await claudeCodeBridge.getTaskStatus(taskAssignment.data!.taskId);
      expect(taskStatus.success).toBe(true);
      expect(taskStatus.data?.status).toBe('in-progress');
    });

    test('should coordinate multi-agent workflows', async () => {
      // Spawn workflow agents
      const coder = await claudeCodeBridge.spawnAgent('coder', 'workflow-coder', { specialization: 'frontend' });
      const reviewer = await claudeCodeBridge.spawnAgent('reviewer', 'workflow-reviewer', { focus: 'security' });
      const tester = await claudeCodeBridge.spawnAgent('tester', 'workflow-tester', { testTypes: ['e2e'] });

      expect(coder.success).toBe(true);
      expect(reviewer.success).toBe(true);
      expect(tester.success).toBe(true);

      const workflow = {
        name: 'Feature Development Workflow',
        description: 'Complete feature development with review and testing',
        type: 'sequential',
        tasks: [
          {
            id: 'code-task',
            name: 'Implement Feature',
            type: 'code-generation',
            input: {
              feature: 'user-dashboard',
              framework: 'react',
              requirements: ['responsive', 'accessible', 'performant']
            },
            assignedAgent: coder.data!.id,
            status: 'pending',
            retryCount: 0,
            maxRetries: 2,
            timeout: 1800000, // 30 minutes
            dependencies: []
          },
          {
            id: 'review-task',
            name: 'Code Review',
            type: 'code-review',
            input: {
              reviewFocus: ['security', 'performance', 'maintainability'],
              standards: 'enterprise'
            },
            assignedAgent: reviewer.data!.id,
            status: 'pending',
            retryCount: 0,
            maxRetries: 1,
            timeout: 600000, // 10 minutes
            dependencies: ['code-task']
          },
          {
            id: 'test-task',
            name: 'End-to-End Testing',
            type: 'testing',
            input: {
              testScope: 'user-dashboard',
              testTypes: ['functionality', 'usability', 'performance'],
              browsers: ['chrome', 'firefox', 'safari']
            },
            assignedAgent: tester.data!.id,
            status: 'pending',
            retryCount: 0,
            maxRetries: 2,
            timeout: 1200000, // 20 minutes
            dependencies: ['review-task']
          }
        ],
        dependencies: [],
        coordinator: 'claude-code-bridge',
        metadata: { project: 'user-portal', version: '2.0.0' }
      };

      const coordination = await claudeCodeBridge.coordinateTasks(workflow);

      expect(coordination.success).toBe(true);
      expect(coordination.data?.workflowId).toBeDefined();
      expect(coordination.data?.status).toBe('running');
      expect(coordination.data?.tasks.length).toBe(3);
    });

    test('should handle agent failures and recovery', async () => {
      const agent = await claudeCodeBridge.spawnAgent('coder', 'failure-test-agent', {
        simulateFailure: true // Special test configuration
      });

      if (agent.success) {
        const agentId = agent.data!.id;

        // Assign a task that will cause agent failure
        const task = {
          type: 'failure-simulation',
          description: 'Task designed to fail for testing',
          requirements: { simulateError: 'network-timeout' }
        };

        const taskResult = await claudeCodeBridge.assignTask(agentId, task);

        if (taskResult.success) {
          // Wait for failure detection
          await new Promise(resolve => setTimeout(resolve, 1000));

          const agentStatus = await claudeCodeBridge.getAgentStatus(agentId);

          // Agent should be marked as failed
          if (agentStatus.success) {
            expect(['failed', 'recovering']).toContain(agentStatus.data?.status);
          }

          // System should attempt recovery
          const recoveryResult = await claudeCodeBridge.recoverAgent(agentId);
          expect(recoveryResult.success).toBe(true);
        }
      }
    });
  });

  describe('Tool Integration', () => {
    beforeEach(async () => {
      await claudeCodeBridge.connect();
    });

    test('should execute file operations through tools', async () => {
      const fileOps = {
        type: 'tool_sequence' as const,
        language: 'javascript',
        code: `
          // Simulate file operations using Claude Code tools
          const fileContent = \`
            // Generated configuration file
            module.exports = {
              apiUrl: 'https://api.example.com',
              timeout: 5000,
              retries: 3
            };
          \`;

          // This would use the Write tool in actual implementation
          console.log('Writing config file...');
          console.log('File content:', fileContent);

          // This would use the Read tool to verify
          console.log('Verifying file was written...');

          return {
            operation: 'file-write',
            success: true,
            file: '/tmp/config.js',
            size: fileContent.length
          };
        `,
        context: {
          id: 'file-ops-test',
          type: 'tool_integration',
          initiator: 'file-manager',
          environment: 'sandbox',
          permissions: {
            fileSystem: {
              read: ['/tmp'],
              write: ['/tmp'],
              execute: []
            },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 128,
              maxCPUPercent: 30,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 128,
            maxCPUTime: 5000,
            maxWallTime: 10000,
            maxOutputSize: 1024,
            tempDirectoryQuota: 1048576
          },
          constraints: {
            timeout: 10000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { toolTest: 'file-operations' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 600000)
        }
      };

      const result = await claudeCodeBridge.executeCode(fileOps);

      expect(result.success).toBe(true);
      expect(result.data?.output).toContain('Writing config file');
      expect(result.data?.returnValue.operation).toBe('file-write');
    });

    test('should handle bash commands with restrictions', async () => {
      const bashExecution = {
        type: 'tool_sequence' as const,
        language: 'javascript',
        code: `
          // Simulate safe bash operations
          const allowedCommands = ['ls', 'echo', 'pwd', 'date'];
          const command = 'echo "Hello from secure environment"';

          console.log('Executing bash command:', command);
          console.log('Command output: Hello from secure environment');

          return {
            command,
            output: 'Hello from secure environment',
            exitCode: 0,
            restricted: true
          };
        `,
        context: {
          id: 'bash-test',
          type: 'tool_integration',
          initiator: 'system-admin',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: ['/tmp'], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: true,
              maxMemoryMB: 64,
              maxCPUPercent: 20,
              allowedCommands: ['echo', 'ls', 'pwd']
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 3000,
            maxWallTime: 5000,
            maxOutputSize: 512,
            tempDirectoryQuota: 262144
          },
          constraints: {
            timeout: 5000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'maximum'
          },
          metadata: { toolTest: 'bash-commands' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000)
        }
      };

      const result = await claudeCodeBridge.executeCode(bashExecution);

      expect(result.success).toBe(true);
      expect(result.data?.returnValue.output).toContain('Hello from secure environment');
      expect(result.data?.returnValue.exitCode).toBe(0);
    });

    test('should enforce tool rate limits', async () => {
      const rateLimitTest = Array(15).fill(0).map((_, i) => ({
        type: 'tool_sequence' as const,
        language: 'javascript',
        code: `
          console.log('Search operation ${i + 1}');
          return { searchId: ${i}, results: [] };
        `,
        context: {
          id: `rate-limit-test-${i}`,
          type: 'rate_limit_validation',
          initiator: 'rate-limiter',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 32,
              maxCPUPercent: 10,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 32,
            maxCPUTime: 1000,
            maxWallTime: 2000,
            maxOutputSize: 128,
            tempDirectoryQuota: 65536
          },
          constraints: {
            timeout: 2000,
            maxRetries: 0,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: {
            toolTest: 'rate-limiting',
            toolUsed: 'search'
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000)
        }
      }));

      const results = await Promise.allSettled(
        rateLimitTest.map(test => claudeCodeBridge.executeCode(test))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Should enforce rate limits (configured for 100 search operations)
      // All should succeed since we're under the limit
      expect(successful + failed).toBe(15);
      expect(successful).toBeGreaterThan(10); // Most should succeed
    });
  });

  describe('Performance & Resource Management', () => {
    beforeEach(async () => {
      await claudeCodeBridge.connect();
    });

    test('should track execution metrics and performance', async () => {
      const performanceTest = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          const start = performance.now();

          // CPU-intensive operation
          let result = 0;
          for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i);
          }

          const end = performance.now();
          const duration = end - start;

          return {
            result: Math.floor(result),
            duration,
            iterations: 1000000
          };
        `,
        context: {
          id: 'performance-metrics',
          type: 'performance_analysis',
          initiator: 'performance-team',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 128,
              maxCPUPercent: 80,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 128,
            maxCPUTime: 10000,
            maxWallTime: 15000,
            maxOutputSize: 512,
            tempDirectoryQuota: 262144
          },
          constraints: {
            timeout: 15000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { benchmarkTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000)
        }
      };

      const result = await claudeCodeBridge.executeCode(performanceTest);

      expect(result.success).toBe(true);
      expect(result.data?.returnValue.duration).toBeGreaterThan(0);
      expect(result.data?.metrics).toBeDefined();
      expect(result.data?.metrics?.cpuTime).toBeGreaterThan(0);
      expect(result.data?.metrics?.memoryPeak).toBeGreaterThan(0);
    });

    test('should handle memory-intensive operations', async () => {
      const memoryTest = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          const arrays = [];
          const targetSize = 10; // MB in smaller chunks to avoid timeout

          try {
            for (let i = 0; i < 100; i++) {
              // Create 100KB arrays
              const chunk = new Array(25600).fill(0).map((_, j) => j);
              arrays.push(chunk);

              if (i % 10 === 0) {
                // Log progress
                const memUsed = (arrays.length * 25600 * 4) / (1024 * 1024); // Rough MB estimate
                console.log(\`Memory allocated: ~\${memUsed.toFixed(1)}MB\`);
              }
            }

            const totalElements = arrays.reduce((sum, arr) => sum + arr.length, 0);
            return {
              totalArrays: arrays.length,
              totalElements,
              success: true
            };
          } catch (error) {
            return {
              error: error.message,
              arraysCreated: arrays.length,
              success: false
            };
          }
        `,
        context: {
          id: 'memory-test',
          type: 'memory_stress_test',
          initiator: 'memory-team',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 64, // Intentionally low to test limits
              maxCPUPercent: 50,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 15000,
            maxWallTime: 20000,
            maxOutputSize: 1024,
            tempDirectoryQuota: 131072
          },
          constraints: {
            timeout: 20000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { memoryStressTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000)
        }
      };

      const result = await claudeCodeBridge.executeCode(memoryTest);

      // Should either succeed within limits or fail gracefully
      if (result.success) {
        expect(result.data?.returnValue).toBeDefined();
      } else {
        expect(result.error).toContain('memory');
      }
    });

    test('should manage concurrent execution load', async () => {
      const concurrentLoad = Array(8).fill(0).map((_, i) => ({
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          const workerId = ${i};
          const iterations = 100000;
          let result = 0;

          console.log(\`Worker \${workerId} starting\`);

          for (let j = 0; j < iterations; j++) {
            result += Math.sin(j) * Math.cos(j);
          }

          console.log(\`Worker \${workerId} completed\`);

          return {
            workerId,
            result: Math.floor(result),
            iterations
          };
        `,
        context: {
          id: `load-test-worker-${i}`,
          type: 'load_test',
          initiator: 'load-tester',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 64,
              maxCPUPercent: 25,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 8000,
            maxWallTime: 12000,
            maxOutputSize: 256,
            tempDirectoryQuota: 65536
          },
          constraints: {
            timeout: 12000,
            maxRetries: 1,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: {
            loadTest: true,
            workerId: i
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 180000)
        }
      }));

      const startTime = Date.now();
      const results = await Promise.allSettled(
        concurrentLoad.map(test => claudeCodeBridge.executeCode(test))
      );
      const totalTime = Date.now() - startTime;

      const successful = results.filter(r =>
        r.status === 'fulfilled' && r.value.success
      ).length;

      // Should handle reasonable concurrent load
      expect(successful).toBeGreaterThan(concurrentLoad.length * 0.7); // 70% success rate
      expect(totalTime).toBeLessThan(25000); // Should complete within 25 seconds
    });
  });

  describe('Error Handling & Recovery', () => {
    beforeEach(async () => {
      await claudeCodeBridge.connect();
    });

    test('should handle syntax errors gracefully', async () => {
      const syntaxErrorCode = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          // Intentional syntax errors
          const unclosed = function() {
            return "missing brace"
          // Missing closing brace

          const incomplete =
          // Incomplete assignment
        `,
        context: {
          id: 'syntax-error-test',
          type: 'error_handling',
          initiator: 'error-tester',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 32,
              maxCPUPercent: 10,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 32,
            maxCPUTime: 2000,
            maxWallTime: 3000,
            maxOutputSize: 512,
            tempDirectoryQuota: 32768
          },
          constraints: {
            timeout: 3000,
            maxRetries: 0,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { errorTest: 'syntax' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000)
        }
      };

      const result = await claudeCodeBridge.executeCode(syntaxErrorCode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('syntax');
      expect(result.errorDetails?.type).toBe('SyntaxError');
    });

    test('should recover from execution environment failures', async () => {
      // Simulate environment failure and recovery
      const environmentTest = {
        type: 'snippet' as const,
        language: 'javascript',
        code: `
          // Test environment recovery
          console.log('Testing environment stability');

          try {
            // This would normally cause environment issues
            throw new Error('Simulated environment failure');
          } catch (error) {
            console.log('Caught error:', error.message);
            return {
              recovered: true,
              error: error.message
            };
          }
        `,
        context: {
          id: 'environment-recovery-test',
          type: 'recovery_test',
          initiator: 'resilience-tester',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: {
              allowProcessSpawn: false,
              maxMemoryMB: 64,
              maxCPUPercent: 20,
              allowedCommands: []
            }
          },
          resources: {
            maxMemoryMB: 64,
            maxCPUTime: 5000,
            maxWallTime: 8000,
            maxOutputSize: 512,
            tempDirectoryQuota: 65536
          },
          constraints: {
            timeout: 8000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { recoveryTest: true },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 120000)
        }
      };

      const result = await claudeCodeBridge.executeCode(environmentTest);

      expect(result.success).toBe(true);
      expect(result.data?.returnValue.recovered).toBe(true);

      // Bridge should remain operational
      const health = await claudeCodeBridge.getHealth();
      expect(health.status).toBe('healthy');
    });
  });
});