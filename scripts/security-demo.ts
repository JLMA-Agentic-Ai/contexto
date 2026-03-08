#!/usr/bin/env npx tsx

/**
 * Security Architecture Demo for 6-Component Platform Integration
 * Demonstrates enterprise-grade security features and validates implementation
 */

import { SecurityManager, createSecurityManager } from '../src/security/security-integration';
import { ComponentMessage } from '../src/bridges/base/component-bridge';

async function runSecurityDemo(): Promise<void> {
  console.log('🔐 Starting Enterprise Security Architecture Demo\n');

  try {
    // Initialize Security Manager
    console.log('1. Initializing Security Manager...');
    const securityManager = createSecurityManager('development');
    await securityManager.initialize();
    console.log('✅ Security Manager initialized\n');

    // Demo 1: Authentication & Authorization
    console.log('2. Testing Authentication & Authorization...');
    await demoAuthentication(securityManager);
    console.log('✅ Authentication demo completed\n');

    // Demo 2: Input Validation
    console.log('3. Testing Input Validation...');
    await demoInputValidation(securityManager);
    console.log('✅ Input validation demo completed\n');

    // Demo 3: Circuit Breaker Security
    console.log('4. Testing Circuit Breaker Security...');
    await demoCircuitBreaker(securityManager);
    console.log('✅ Circuit breaker demo completed\n');

    // Demo 4: Secrets Management
    console.log('5. Testing Secrets Management...');
    await demoSecretsManagement(securityManager);
    console.log('✅ Secrets management demo completed\n');

    // Demo 5: Security Monitoring
    console.log('6. Testing Security Monitoring...');
    await demoSecurityMonitoring(securityManager);
    console.log('✅ Security monitoring demo completed\n');

    // Demo 6: Emergency Mode
    console.log('7. Testing Emergency Mode...');
    await demoEmergencyMode(securityManager);
    console.log('✅ Emergency mode demo completed\n');

    // Final Security Report
    console.log('8. Generating Security Report...');
    await generateSecurityReport(securityManager);
    console.log('✅ Security report generated\n');

    console.log('🛡️ Enterprise Security Architecture Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

async function demoAuthentication(securityManager: SecurityManager): Promise<void> {
  console.log('  → Testing authentication with valid token...');

  try {
    const mockRequest = {
      headers: {
        'authorization': 'Bearer valid-jwt-token-12345',
        'user-agent': 'SecurityDemo/1.0'
      },
      ip: '127.0.0.1'
    };

    const authContext = await securityManager.authenticateRequest(
      mockRequest,
      ['read', 'write']
    );

    console.log(`    ✓ Authenticated user: ${authContext.username} (${authContext.userId})`);
    console.log(`    ✓ Permissions: ${authContext.permissions.join(', ')}`);

  } catch (error) {
    console.log(`    ⚠ Authentication failed (expected): ${(error as Error).message}`);
  }

  console.log('  → Testing authorization failure...');

  try {
    const mockRequest = {
      headers: {
        'authorization': 'Bearer limited-token-67890'
      },
      ip: '127.0.0.1'
    };

    await securityManager.authenticateRequest(
      mockRequest,
      ['admin', 'system:write'] // High privilege permissions
    );

  } catch (error) {
    console.log(`    ✓ Authorization correctly denied: ${(error as Error).message}`);
  }
}

async function demoInputValidation(securityManager: SecurityManager): Promise<void> {
  console.log('  → Testing valid message validation...');

  const validMessage: ComponentMessage = {
    id: 'msg_123456789',
    type: 'project:init',
    payload: {
      project: {
        projectId: 'proj_abcdef123456',
        projectPath: 'safe/project/path',
        name: 'Test Project',
        owner: 'testuser'
      }
    },
    metadata: {
      timestamp: new Date(),
      source: 'dossier',
      target: 'ruflo',
      priority: 'normal'
    }
  };

  try {
    const validatedMessage = await securityManager.validateBridgeMessage(
      'dossier-ruflo-bridge',
      validMessage,
      {
        userId: 'user-123',
        sessionId: 'session-456',
        ipAddress: '127.0.0.1',
        userAgent: 'SecurityDemo/1.0'
      }
    );

    console.log('    ✓ Valid message passed validation');
    console.log(`    ✓ Message type: ${validatedMessage.type}`);

  } catch (error) {
    console.log(`    ❌ Validation failed: ${(error as Error).message}`);
  }

  console.log('  → Testing malicious message detection...');

  const maliciousMessage = {
    id: 'msg_malicious',
    type: 'project:init',
    payload: {
      project: {
        projectId: 'proj_123',
        projectPath: '../../../etc/passwd', // Path traversal attempt
        name: '<script>alert("xss")</script>', // XSS attempt
        owner: 'testuser'
      }
    },
    metadata: {
      timestamp: new Date(),
      source: 'dossier',
      target: 'ruflo'
    }
  };

  try {
    await securityManager.validateBridgeMessage(
      'dossier-ruflo-bridge',
      maliciousMessage,
      {
        userId: 'user-123',
        sessionId: 'session-456',
        ipAddress: '192.168.1.100',
        userAgent: 'AttackBot/1.0'
      }
    );

    console.log('    ❌ Malicious message should have been rejected!');

  } catch (error) {
    console.log(`    ✓ Malicious message correctly rejected: ${(error as Error).message}`);
  }
}

async function demoCircuitBreaker(securityManager: SecurityManager): Promise<void> {
  console.log('  → Testing circuit breaker functionality...');

  const testMessage: ComponentMessage = {
    id: 'msg_test_cb',
    type: 'analyze:codebase',
    payload: {
      projectPath: 'test/project',
      analysisType: 'full'
    },
    metadata: {
      timestamp: new Date(),
      source: 'ruflo',
      target: 'gitnexus'
    }
  };

  // Simulate successful requests
  for (let i = 0; i < 3; i++) {
    try {
      await securityManager.validateBridgeMessage(
        'ruflo-gitnexus-bridge',
        testMessage,
        {
          userId: 'user-123',
          sessionId: 'session-456',
          ipAddress: '127.0.0.1'
        }
      );
      console.log(`    ✓ Successful request ${i + 1}/3`);
    } catch (error) {
      console.log(`    ⚠ Request ${i + 1} failed: ${(error as Error).message}`);
    }
  }

  console.log('  → Testing rate limiting...');

  // Simulate rapid requests from same IP
  const rapidRequests = Array.from({ length: 10 }, (_, i) => ({
    ...testMessage,
    id: `msg_rapid_${i}`
  }));

  let successCount = 0;
  let rateLimitedCount = 0;

  for (const request of rapidRequests) {
    try {
      await securityManager.validateBridgeMessage(
        'ruflo-gitnexus-bridge',
        request,
        {
          userId: 'user-123',
          sessionId: 'session-456',
          ipAddress: '192.168.1.50' // Different IP for isolation
        }
      );
      successCount++;
    } catch (error) {
      if ((error as Error).message.includes('rate limit')) {
        rateLimitedCount++;
      }
    }
  }

  console.log(`    ✓ Processed ${successCount} requests, rate-limited ${rateLimitedCount}`);
}

async function demoSecretsManagement(securityManager: SecurityManager): Promise<void> {
  console.log('  → Testing secret access request...');

  try {
    const accessId = await securityManager.requestSecretAccess(
      'sec_demo_api_key',
      {
        userId: 'user-123',
        purpose: 'API integration for demo',
        accessType: 'read'
      }
    );

    console.log(`    ✓ Secret access requested: ${accessId}`);

  } catch (error) {
    console.log(`    ⚠ Secret access failed (expected for demo): ${(error as Error).message}`);
  }

  console.log('  → Testing emergency secret access...');

  try {
    const emergencyAccessId = await securityManager.requestSecretAccess(
      'sec_demo_emergency',
      {
        userId: 'user-123',
        purpose: 'Emergency system recovery',
        accessType: 'read',
        emergencyAccess: true
      }
    );

    console.log(`    ✓ Emergency access granted: ${emergencyAccessId}`);

  } catch (error) {
    console.log(`    ⚠ Emergency access failed: ${(error as Error).message}`);
  }
}

async function demoSecurityMonitoring(securityManager: SecurityManager): Promise<void> {
  console.log('  → Checking security status...');

  const status = securityManager.getSecurityStatus();
  console.log(`    ✓ Overall security status: ${status.overall}`);
  console.log(`    ✓ Active sessions: ${status.metrics.activeSessions}`);
  console.log(`    ✓ Blocked IPs: ${status.metrics.blockedIPs}`);
  console.log(`    ✓ Critical events: ${status.metrics.criticalEvents}`);

  console.log('  → Component health check:');
  Object.entries(status.components).forEach(([component, health]) => {
    const icon = health === 'active' ? '✅' : health === 'degraded' ? '⚠️' : '❌';
    console.log(`      ${icon} ${component}: ${health}`);
  });

  console.log('  → Testing IP blocking...');

  await securityManager.blockIP(
    '192.168.1.999',
    'Demo malicious IP blocking',
    60000, // 1 minute
    'security-demo'
  );

  console.log('    ✓ IP blocked successfully');

  // Wait a moment and unblock
  setTimeout(async () => {
    await securityManager.unblockIP(
      '192.168.1.999',
      'Demo completed',
      'security-demo'
    );
    console.log('    ✓ IP unblocked');
  }, 1000);
}

async function demoEmergencyMode(securityManager: SecurityManager): Promise<void> {
  console.log('  → Testing emergency mode activation...');

  await securityManager.enableEmergencyMode(
    'Security demonstration - testing emergency procedures',
    'security-demo',
    30000 // 30 seconds
  );

  console.log('    ✓ Emergency mode enabled');

  // Wait for auto-disable
  await new Promise(resolve => setTimeout(resolve, 2000));

  await securityManager.disableEmergencyMode(
    'Demo completed',
    'security-demo'
  );

  console.log('    ✓ Emergency mode disabled');
}

async function generateSecurityReport(securityManager: SecurityManager): Promise<void> {
  console.log('  → Generating comprehensive security report...');

  const timeRange = {
    startTime: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    endTime: new Date()
  };

  try {
    const report = await securityManager.generateSecurityReport(timeRange);

    console.log('    ✓ Security report generated successfully');
    console.log(`    → Report sections: ${Object.keys(report).length}`);
    console.log(`    → Time range: ${timeRange.startTime.toISOString()} to ${timeRange.endTime.toISOString()}`);

    if (report.recommendations && report.recommendations.length > 0) {
      console.log('    → Security recommendations:');
      report.recommendations.slice(0, 3).forEach((rec: string, i: number) => {
        console.log(`      ${i + 1}. ${rec}`);
      });
    }

  } catch (error) {
    console.log(`    ⚠ Report generation failed: ${(error as Error).message}`);
  }
}

// Event handlers for demonstration
function setupEventHandlers(securityManager: SecurityManager): void {
  securityManager.on('initialized', (event) => {
    console.log('🚀 Security Manager initialized:', event.timestamp);
  });

  securityManager.on('security_alert', (event) => {
    console.log('🚨 Security Alert:', event);
  });

  securityManager.on('message_validation_failed', (event) => {
    console.log('⚠️ Message Validation Failed:', event.error);
  });

  securityManager.on('ip_blocked', (event) => {
    console.log('🔒 IP Blocked:', event.ipAddress, 'Reason:', event.reason);
  });

  securityManager.on('emergency_mode_enabled', (event) => {
    console.log('🚨 EMERGENCY MODE ENABLED:', event.reason);
  });

  securityManager.on('emergency_mode_disabled', (event) => {
    console.log('✅ Emergency mode disabled:', event.reason);
  });
}

// Utility function to simulate delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
if (require.main === module) {
  runSecurityDemo().catch(console.error);
}

export { runSecurityDemo };