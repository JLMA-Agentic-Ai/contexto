# Visión Maestra Platform Setup Guide

## Overview

This guide walks you through setting up the complete Visión Maestra platform with all 6 integrated components.

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **Node.js**: Version 18+
- **Memory**: Minimum 8GB RAM, Recommended 16GB
- **Storage**: 20GB free space
- **Network**: Stable internet connection for initial setup

### Required Tools
```bash
# Node.js and npm (or yarn/pnpm)
node --version  # Should be 18+
npm --version

# Git
git --version

# Optional but recommended
docker --version
```

## Installation Steps

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url> vision-maestra
cd vision-maestra

# Install dependencies
npm install

# Verify setup
npm run health-check
```

### 2. Initialize RufloV3 CLI

```bash
# Add Claude Flow CLI
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest

# Start daemon
npx @claude-flow/cli@latest daemon start

# Initialize platform
npx @claude-flow/cli@latest init --wizard

# Verify RufloV3 setup
npx @claude-flow/cli@latest doctor --fix
```

### 3. Configure GitNexus

```bash
# Navigate to project directory
cd /path/to/your/project

# Initialize GitNexus
npx gitnexus init

# Analyze repository
npx gitnexus analyze

# Verify GitNexus setup
npx gitnexus status
```

### 4. Setup ADW Skills

```bash
# Skills are already available in .claude/skills/
# Verify skills directory
ls -la .claude/skills/adw/

# Test skill execution
npx @claude-flow/cli@latest skill:execute specification
```

### 5. Configure RLM Navigator

The RLM Navigator is available in `base_projects/rlm-navigator/`. It will be automatically integrated through the bridge system.

### 6. Platform Configuration

```bash
# Copy example configuration
cp config/platform/platform-config.example.ts config/platform/platform-config.ts

# Edit configuration as needed
nano config/platform/platform-config.ts
```

### 7. Start the Platform

```bash
# Start all components
npm run start

# Alternative: Start in development mode
npm run dev

# Check platform status
npm run status
```

## Configuration Guide

### Platform Configuration

Edit `config/platform/platform-config.ts`:

```typescript
{
  platform: {
    environment: 'development', // 'development' | 'staging' | 'production'
    debugMode: true,
    logLevel: 'info'
  },
  components: {
    dossier: {
      enabled: true,
      port: 3000
    },
    rufloV3: {
      enabled: true,
      maxAgents: 15
    },
    // ... other components
  }
}
```

### Component-Specific Configuration

#### Dossier (Frontend)
```json
{
  "port": 3000,
  "features": {
    "projectManagement": true,
    "realTimeUpdates": true,
    "fileWatcher": true
  },
  "ui": {
    "theme": "dark",
    "language": "en"
  }
}
```

#### RufloV3 (CLI Orchestrator)
```json
{
  "maxAgents": 15,
  "topology": "hierarchical",
  "strategy": "specialized",
  "memory": {
    "enabled": true,
    "driver": "hybrid",
    "hnsw": true,
    "neural": true
  }
}
```

#### GitNexus (Code Analysis)
```json
{
  "repositoryPath": ".",
  "analysis": {
    "includeTests": true,
    "maxDepth": 5,
    "filePatterns": ["**/*.ts", "**/*.js"]
  },
  "caching": {
    "enabled": true,
    "ttl": 3600000
  }
}
```

## Verification Steps

### 1. Health Checks

```bash
# Overall platform health
curl http://localhost:8080/api/health

# Component-specific health
curl http://localhost:8080/api/health/components

# WebSocket connection test
wscat -c ws://localhost:8081/ws
```

### 2. Component Integration Test

```bash
# Test Dossier → RufloV3 integration
curl -X POST http://localhost:3000/api/test/ruflo \
  -H "Content-Type: application/json" \
  -d '{"command": "agent list"}'

# Test GitNexus → RLM integration
curl -X POST http://localhost:8080/api/test/graph-navigation \
  -H "Content-Type: application/json" \
  -d '{"symbol": "function testFunction"}'
```

### 3. Workflow Execution Test

```bash
# Execute a simple workflow
curl -X POST http://localhost:8080/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "test-workflow",
    "parameters": {
      "projectName": "test-project"
    }
  }'
```

## Development Workflow

### 1. Create a New Project

```bash
# Using the platform API
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-new-project",
    "framework": "next.js",
    "template": "typescript"
  }'
```

### 2. Execute Development Workflow

Access the Dossier frontend at `http://localhost:3000` and:

1. **Create Project**: Use the project creation wizard
2. **Setup Development**: The platform will automatically:
   - Initialize RufloV3 swarm
   - Analyze code structure with GitNexus
   - Setup ADW methodology workflows
   - Configure AST navigation with RLM
3. **Start Coding**: Use Claude Code integration for development

### 3. Monitor Progress

- **Dashboard**: Real-time updates at `http://localhost:3000/dashboard`
- **Logs**: Platform logs via `npm run logs`
- **Metrics**: System metrics at `http://localhost:8080/api/metrics`

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check which ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# Update configuration to use different ports
nano config/platform/platform-config.ts
```

#### Component Communication Failures
```bash
# Check component status
npm run status

# Restart specific bridge
npm run restart:bridge dossier-ruflo

# Check logs for specific component
npm run logs:component ruflo
```

#### Memory Issues
```bash
# Check memory usage
npm run metrics:memory

# Reduce agent count in RufloV3
nano config/components/ruflo.json
# Set maxAgents to a lower value (e.g., 8)
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment
export DEBUG=vision-maestra:*

# Start platform in debug mode
npm run dev:debug
```

### Health Monitoring

```bash
# Continuous health monitoring
watch -n 5 'curl -s http://localhost:8080/api/health'

# Component-specific monitoring
npm run monitor:components

# Performance monitoring
npm run monitor:performance
```

## Production Deployment

### 1. Environment Configuration

```bash
# Set production environment
export NODE_ENV=production

# Use production configuration
cp config/platform/production-config.ts config/platform/platform-config.ts
```

### 2. Process Management

```bash
# Using PM2
npm install -g pm2

# Start platform with PM2
pm2 start npm --name "vision-maestra" -- run start:prod

# Monitor with PM2
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

### 3. Reverse Proxy Setup

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Security Considerations

### 1. API Security

```bash
# Enable authentication in config
nano config/platform/platform-config.ts

# Set security options
{
  "security": {
    "authentication": {
      "enabled": true,
      "provider": "oauth"
    },
    "authorization": {
      "enabled": true,
      "rbac": true
    }
  }
}
```

### 2. Network Security

- Use HTTPS in production
- Configure firewall rules
- Restrict component communication to internal networks
- Regular security audits

### 3. Data Protection

- Enable encryption at rest
- Use secure communication channels
- Regular backups
- Access logging and monitoring

## Maintenance

### Daily Tasks

```bash
# Health check
npm run health-check

# Log cleanup
npm run logs:cleanup

# Metrics collection
npm run metrics:collect
```

### Weekly Tasks

```bash
# System update
npm update

# Security scan
npm audit

# Performance analysis
npm run analyze:performance
```

### Monthly Tasks

```bash
# Configuration review
npm run config:validate

# Backup verification
npm run backup:verify

# Capacity planning
npm run analyze:capacity
```

## Support and Resources

- **Documentation**: `docs/`
- **Examples**: `examples/`
- **Issue Tracking**: GitHub Issues
- **Community**: Discord/Slack channels
- **Professional Support**: Available for enterprise customers

## Next Steps

After successful setup:

1. **Explore Examples**: Check `examples/` directory for sample projects
2. **Read Documentation**: Dive deeper into component-specific guides
3. **Join Community**: Connect with other developers
4. **Contribute**: Help improve the platform

---

**Setup Complete! 🎉**

Your Visión Maestra platform is ready for autonomous development workflows.