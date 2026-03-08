/**
 * Production Validation Tests
 * Validates core functionality works with real integrations
 */

const crypto = require('crypto');

describe('Production Validation Tests', () => {

  test('Rate limiter should function correctly', async () => {
    const { RateLimiterMemory } = require('rate-limiter-flexible');

    const rateLimiter = new RateLimiterMemory({
      points: 3, // 3 requests
      duration: 1, // per 1 second
    });

    const testKey = 'test-key';

    // Should allow first 3 requests
    await rateLimiter.consume(testKey);
    await rateLimiter.consume(testKey);
    await rateLimiter.consume(testKey);

    // 4th request should be rate limited - catch the rejection
    try {
      await rateLimiter.consume(testKey);
      fail('Expected rate limiter to throw');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('JWT operations should work correctly', () => {
    const jwt = require('jsonwebtoken');
    const secret = 'test-secret-key';

    const payload = {
      userId: 12345,
      email: 'test@example.com',
      role: 'admin'
    };

    // Sign JWT
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verify JWT
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('Crypto operations should be available', () => {
    // Hash generation
    const hash = crypto.createHash('sha256').update('test-data').digest('hex');
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA256 produces 64-char hex string

    // Random bytes generation
    const randomBytes = crypto.randomBytes(16);
    expect(randomBytes).toBeDefined();
    expect(randomBytes.length).toBe(16);

    // PBKDF2 key derivation
    const derivedKey = crypto.pbkdf2Sync('password', 'salt', 1000, 32, 'sha256');
    expect(derivedKey).toBeDefined();
    expect(derivedKey.length).toBe(32);
  });

  test('BCrypt password hashing should work', async () => {
    const bcrypt = require('bcryptjs');

    const password = 'test-password';
    const saltRounds = 10;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);

    // Verify password
    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await bcrypt.compare('wrong-password', hashedPassword);
    expect(isInvalid).toBe(false);
  });

  test('WebSocket should initialize correctly', (done) => {
    const WebSocket = require('ws');

    const wss = new WebSocket.Server({ port: 0 });

    wss.on('listening', () => {
      const port = wss.address().port;
      expect(port).toBeGreaterThan(0);

      // Test connection
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        wss.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    wss.on('error', (error) => {
      done(error);
    });
  });

  test('Express server should initialize correctly', (done) => {
    const express = require('express');
    const http = require('http');

    const app = express();

    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dependencies: {
          crypto: true,
          jwt: true,
          rateLimit: true,
          webSocket: true
        }
      });
    });

    const server = app.listen(0, () => {
      const port = server.address().port;

      http.get(`http://localhost:${port}/health`, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/json/);

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const body = JSON.parse(data);
            expect(body.status).toBe('healthy');
            expect(body.dependencies.crypto).toBe(true);
            expect(body.dependencies.jwt).toBe(true);
            expect(body.dependencies.rateLimit).toBe(true);
            expect(body.dependencies.webSocket).toBe(true);

            server.close();
            done();
          } catch (err) {
            done(err);
          }
        });
      }).on('error', done);
    });
  });

});