/**
 * DossierBridge Integration Tests
 * PRODUCTION CRITICAL: Tests UI coordination and task management
 */

import { DossierBridge, DossierConfig, DossierTask } from '../../src/bridges/DossierBridge';
import { createMockBridgeConfig, createMockTask } from '../setup';

describe('DossierBridge - Production Integration Tests', () => {
  let dossierBridge: DossierBridge;
  let mockConfig: DossierConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
      dossierApi: {
        baseUrl: 'http://localhost:3000/api',
        apiKey: global.mockApiKey,
        version: 'v1'
      },
      ui: {
        webSocketUrl: 'ws://localhost:3000/ws',
        theme: 'dark',
        refreshInterval: 5000
      },
      orchestration: {
        maxConcurrentTasks: 10,
        taskTimeout: 30000,
        priorityLevels: ['low', 'medium', 'high', 'critical']
      }
    } as DossierConfig;

    dossierBridge = new DossierBridge(mockConfig);
  });

  afterEach(async () => {
    await dossierBridge.disconnect();
  });

  describe('Core Functionality', () => {
    test('should initialize and connect successfully', async () => {
      const connectResult = await dossierBridge.connect();
      expect(connectResult.success).toBe(true);
      expect(await dossierBridge.isConnected()).toBe(true);
    });

    test('should handle connection failure gracefully', async () => {
      const invalidConfig = {
        ...mockConfig,
        dossierApi: { ...mockConfig.dossierApi, baseUrl: 'http://invalid-url' }
      };
      const failingBridge = new DossierBridge(invalidConfig);

      const connectResult = await failingBridge.connect();
      expect(connectResult.success).toBe(false);
      expect(connectResult.error).toBeDefined();
    });

    test('should perform health check correctly', async () => {
      await dossierBridge.connect();
      const healthStatus = await dossierBridge.getHealth();

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.lastChecked).toBeInstanceOf(Date);
      expect(healthStatus.dependencies).toHaveProperty('api');
      expect(healthStatus.dependencies).toHaveProperty('websocket');
    });
  });

  describe('Task Management - PRODUCTION CRITICAL', () => {
    beforeEach(async () => {
      await dossierBridge.connect();
    });

    test('should create investigation task successfully', async () => {
      const taskData = {
        type: 'investigation' as const,
        title: 'Critical Production Investigation',
        description: 'Investigating production performance degradation',
        priority: 'critical' as const,
        status: 'pending' as const,
        metadata: {
          environment: 'production',
          severity: 'high',
          affectedSystems: ['api', 'database']
        }
      };

      const result = await dossierBridge.createTask(taskData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data?.title).toBe('Critical Production Investigation');
      expect(result.data?.type).toBe('investigation');
      expect(result.data?.priority).toBe('critical');
    });

    test('should handle task creation with invalid data', async () => {
      const invalidTaskData = {
        type: 'invalid-type' as any,
        title: '', // Empty title should fail
        description: 'Test description',
        priority: 'medium' as const,
        status: 'pending' as const,
        metadata: {}
      };

      const result = await dossierBridge.createTask(invalidTaskData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('should update task status correctly', async () => {
      const taskData = createMockTask({
        type: 'analysis',
        title: 'Performance Analysis',
        status: 'pending'
      });

      const createResult = await dossierBridge.createTask(taskData);
      expect(createResult.success).toBe(true);

      const updateResult = await dossierBridge.updateTask(createResult.data!.id, {
        status: 'running',
        metadata: {
          ...createResult.data!.metadata,
          startedAt: new Date(),
          progress: 25
        }
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.status).toBe('running');
    });

    test('should handle task timeout scenarios', async () => {
      const longRunningTask = createMockTask({
        type: 'workflow',
        title: 'Long Running Process'
      });

      const createResult = await dossierBridge.createTask(longRunningTask);
      const taskId = createResult.data!.id;

      // Simulate timeout by setting short timeout
      const timeoutResult = await dossierBridge.updateTask(taskId, {
        status: 'failed',
        metadata: {
          error: 'Task timeout after 30000ms',
          failedAt: new Date()
        }
      });

      expect(timeoutResult.success).toBe(true);
      expect(timeoutResult.data?.status).toBe('failed');
    });
  });

  describe('UI State Management', () => {
    beforeEach(async () => {
      await dossierBridge.connect();
    });

    test('should update UI component state', async () => {
      const componentId = 'investigation-panel';
      const newState = {
        status: 'active',
        progress: 75,
        currentStep: 'analysis',
        data: {
          investigationId: 'inv-123',
          findings: 5
        }
      };

      const updateResult = await dossierBridge.updateUIState(componentId, newState);
      expect(updateResult.success).toBe(true);

      const getResult = await dossierBridge.getUIState(componentId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.state.progress).toBe(75);
      expect(getResult.data?.state.currentStep).toBe('analysis');
    });

    test('should handle real-time notifications', async () => {
      const notificationData = {
        type: 'task_completed',
        title: 'Investigation Complete',
        message: 'Production investigation has been completed',
        severity: 'success',
        data: {
          taskId: 'task-123',
          investigationId: 'inv-456'
        }
      };

      const result = await dossierBridge.sendNotification(notificationData);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance & Security Tests', () => {
    beforeEach(async () => {
      await dossierBridge.connect();
    });

    test('should handle concurrent task creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        dossierBridge.createTask(createMockTask({
          title: `Concurrent Task ${i + 1}`,
          type: 'analysis'
        }))
      );

      const results = await Promise.all(promises);

      // All tasks should be created successfully
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.title).toBe(`Concurrent Task ${index + 1}`);
      });
    });

    test('should enforce API rate limiting', async () => {
      // Simulate rapid API calls
      const rapidCalls = Array.from({ length: 20 }, () =>
        dossierBridge.getHealth()
      );

      const results = await Promise.allSettled(rapidCalls);

      // Some calls should succeed, some might be rate limited
      const successfulCalls = results.filter(r => r.status === 'fulfilled').length;
      const failedCalls = results.filter(r => r.status === 'rejected').length;

      expect(successfulCalls + failedCalls).toBe(20);
    });

    test('should validate authentication tokens', async () => {
      const invalidConfig = {
        ...mockConfig,
        dossierApi: { ...mockConfig.dossierApi, apiKey: 'invalid-key' }
      };

      const unauthenticatedBridge = new DossierBridge(invalidConfig);
      const connectResult = await unauthenticatedBridge.connect();

      expect(connectResult.success).toBe(false);
      expect(connectResult.error).toContain('authentication');
    });

    test('should handle WebSocket connection failures', async () => {
      const wsFailConfig = {
        ...mockConfig,
        ui: { ...mockConfig.ui, webSocketUrl: 'ws://invalid-ws-url' }
      };

      const wsBridge = new DossierBridge(wsFailConfig);

      // Should still connect via REST API even if WebSocket fails
      const connectResult = await wsBridge.connect();
      expect(connectResult.success).toBe(true);

      // But WebSocket features should fail gracefully
      const notificationResult = await wsBridge.sendNotification({
        type: 'test',
        title: 'Test',
        message: 'Test message'
      });
      expect(notificationResult.success).toBe(false);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    test('should activate circuit breaker after threshold failures', async () => {
      const failingConfig = {
        ...mockConfig,
        circuitBreakerThreshold: 3,
        dossierApi: { ...mockConfig.dossierApi, baseUrl: 'http://failing-service' }
      };

      const circuitBridge = new DossierBridge(failingConfig);

      // Cause multiple failures to trip circuit breaker
      for (let i = 0; i < 5; i++) {
        await circuitBridge.connect();
      }

      const health = await circuitBridge.getHealth();
      expect(health.circuitBreaker?.state).toBe('open');
    });
  });

  describe('Data Persistence & Recovery', () => {
    test('should persist task data during bridge restart', async () => {
      await dossierBridge.connect();

      const task = await dossierBridge.createTask(createMockTask({
        title: 'Persistent Task',
        type: 'investigation'
      }));

      expect(task.success).toBe(true);
      const taskId = task.data!.id;

      // Simulate bridge restart
      await dossierBridge.disconnect();
      const newBridge = new DossierBridge(mockConfig);
      await newBridge.connect();

      // Task should still exist
      const retrievedTask = await newBridge.getTask(taskId);
      expect(retrievedTask.success).toBe(true);
      expect(retrievedTask.data?.title).toBe('Persistent Task');

      await newBridge.disconnect();
    });
  });
});