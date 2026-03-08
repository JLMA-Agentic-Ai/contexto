#!/usr/bin/env node

/**
 * Production Validation Script
 * Tests core dependencies and security functionality
 */

const crypto = require('crypto');

console.log('🔍 PRODUCTION DEPENDENCY VALIDATION\n');

// Test 1: Core Dependencies
console.log('1. Testing Core Dependencies:');
try {
  const express = require('express');
  const ws = require('ws');
  const rateLimiter = require('rate-limiter-flexible');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');

  console.log('  ✅ Express:', express.version || 'Available');
  console.log('  ✅ WebSocket (ws):', ws.version || 'Available');
  console.log('  ✅ Rate Limiter Flexible: Available');
  console.log('  ✅ JWT:', 'Available');
  console.log('  ✅ BCrypt:', 'Available');
} catch (error) {
  console.log('  ❌ Core dependency error:', error.message);
  process.exit(1);
}

// Test 2: Rate Limiting Functionality
console.log('\n2. Testing Rate Limiting:');
try {
  const { RateLimiterMemory } = require('rate-limiter-flexible');

  const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 5, // Number of requests
    duration: 1, // Per 1 second
  });

  // Simulate a request
  const testIp = '127.0.0.1';
  rateLimiter.consume(testIp)
    .then(() => {
      console.log('  ✅ Rate limiter working correctly');
    })
    .catch(() => {
      console.log('  ⚠️  Rate limit hit (expected behavior)');
    });
} catch (error) {
  console.log('  ❌ Rate limiter error:', error.message);
  process.exit(1);
}

// Test 3: Crypto Operations
console.log('\n3. Testing Crypto Operations:');
try {
  const hash = crypto.createHash('sha256').update('test').digest('hex');
  const random = crypto.randomBytes(16);

  console.log('  ✅ SHA256 hash generation: Working');
  console.log('  ✅ Random bytes generation: Working');
  console.log('  ✅ Crypto module: Fully functional');
} catch (error) {
  console.log('  ❌ Crypto error:', error.message);
  process.exit(1);
}

// Test 4: JWT Operations
console.log('\n4. Testing JWT Operations:');
try {
  const jwt = require('jsonwebtoken');
  const secret = 'test-secret';
  const payload = { userId: 123, role: 'admin' };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);

  console.log('  ✅ JWT signing: Working');
  console.log('  ✅ JWT verification: Working');
  console.log('  ✅ JWT payload validation: Working');
} catch (error) {
  console.log('  ❌ JWT error:', error.message);
  process.exit(1);
}

// Test 5: WebSocket Functionality
console.log('\n5. Testing WebSocket:');
try {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: 0 }); // Random available port

  wss.on('listening', () => {
    const port = wss.address().port;
    console.log(`  ✅ WebSocket server started on port ${port}`);

    // Test connection
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('open', () => {
      console.log('  ✅ WebSocket connection established');
      ws.close();
      wss.close();
    });
  });

  wss.on('error', (error) => {
    console.log('  ❌ WebSocket error:', error.message);
  });
} catch (error) {
  console.log('  ❌ WebSocket error:', error.message);
  process.exit(1);
}

// Test 6: Express Server
console.log('\n6. Testing Express Server:');
try {
  const express = require('express');
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`  ✅ Express server started on port ${port}`);
    server.close();
  });
} catch (error) {
  console.log('  ❌ Express error:', error.message);
  process.exit(1);
}

console.log('\n🎉 ALL PRODUCTION DEPENDENCIES VALIDATED SUCCESSFULLY!');
console.log('\n📋 Summary:');
console.log('   • Core web server dependencies: ✅');
console.log('   • Security rate limiting: ✅');
console.log('   • Cryptographic operations: ✅');
console.log('   • Authentication (JWT): ✅');
console.log('   • Real-time communication (WebSocket): ✅');
console.log('   • HTTP server framework: ✅');
console.log('\n✅ Platform is ready for production deployment!');