# Visión Maestra: Autonomous Development Platform

## Overview

Visión Maestra is a comprehensive autonomous development platform that integrates 6 core components into a unified development environment:

1. **Dossier** (Frontend + Project Manager) - Next.js application for project management and user interface
2. **RufloV3** (CLI Orchestrator) - 15-agent mesh for multi-agent coordination and execution
3. **ADW Skills** (Methodology) - Systematic development workflow system
4. **GitNexus** (Code Graph Analysis) - Repository structure and dependency analysis
5. **RLM Navigator** (AST Navigation) - Code-level navigation and analysis
6. **Claude Code** (Execution Engine) - Current execution environment and tool integration

## Architecture

The platform uses a **Bridge-Based Integration Architecture** with:

- **Component Bridges**: Dedicated integration layers between components
- **Platform Orchestrator**: Central coordination and workflow management
- **Streaming Protocol**: Real-time communication via WebSocket, SSE, and gRPC
- **Workflow Engine**: Complex multi-component workflow orchestration
- **Configuration Management**: Centralized configuration for all components

## Quick Start

### Prerequisites
- Node.js 18+
- Git
- 8GB+ RAM (16GB recommended)

### Installation

```bash
# Clone repository
git clone <repository-url> vision-maestra
cd vision-maestra

# Install dependencies
npm install

# Initialize platform
npm run setup

# Start in development mode
npm run dev
```

### Access Points
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8080
- **WebSocket**: ws://localhost:8081

## Project Structure

```
vision-maestra/
├── src/
│   ├── platform/
│   │   ├── core/                 # Platform orchestrator and main entry
│   │   ├── dossier/             # Dossier component integration
│   │   ├── ruflo/               # RufloV3 CLI orchestration
│   │   ├── adw-skills/          # ADW methodology workflows
│   │   ├── gitnexus/            # Code graph analysis
│   │   ├── rlm-navigator/       # AST navigation
│   │   └── claude-code/         # Execution engine integration
│   ├── bridges/
│   │   ├── base/                # Base bridge interface
│   │   ├── dossier-ruflo/       # Frontend ↔ CLI Orchestrator
│   │   ├── ruflo-adw/           # CLI ↔ Methodology
│   │   ├── adw-gitnexus/        # Methodology ↔ Code Analysis
│   │   ├── gitnexus-rlm/        # Code Graph ↔ AST Navigation
│   │   ├── rlm-claude/          # AST ↔ Execution Engine
│   │   └── claude-dossier/      # Execution ↔ Frontend
│   ├── orchestration/
│   │   └── workflow-engine.ts   # Workflow orchestration logic
│   └── streaming/
│       └── protocols/           # Real-time communication protocols
├── config/
│   ├── platform/                # Platform configuration
│   ├── components/              # Component-specific configs
│   └── workflows/               # Workflow templates
├── docs/
│   ├── architecture/            # Architecture documentation
│   ├── adrs/                    # Architecture Decision Records
│   └── workflows/               # Setup and workflow guides
└── base_projects/
    ├── GitNexus/               # Code graph analysis tool
    └── rlm-navigator/          # AST navigation tool
```

## Key Features

### 1. Unified Development Interface
- **Project Management**: Create and manage development projects
- **Real-time Updates**: Live progress tracking and collaboration
- **Workflow Orchestration**: Automated multi-step development processes
- **Component Integration**: Seamless interaction between all tools

### 2. Advanced Code Analysis
- **Graph Analysis**: Comprehensive codebase relationship mapping
- **AST Navigation**: Precise code navigation and refactoring
- **Impact Analysis**: Change impact assessment across codebase
- **Dependency Tracking**: Automatic dependency analysis and management

### 3. Autonomous Workflows
- **ADW Methodology**: Systematic development approach (Specification → Pseudocode → Architecture → Refinement → Coding)
- **Multi-Agent Coordination**: 15-agent mesh for parallel task execution
- **Quality Assurance**: Automated testing and code review
- **Continuous Integration**: Automated build and deployment pipelines

### 4. Real-time Collaboration
- **Live Updates**: Real-time progress and status updates
- **Multi-user Support**: Collaborative development environment
- **Event-driven Architecture**: Reactive system with immediate feedback
- **Streaming Communication**: WebSocket, SSE, and gRPC protocols

## Available Scripts

```bash
# Development
npm run dev                 # Start in development mode
npm run dev:debug          # Start with debug logging
npm run build              # Build for production
npm run start              # Start production server

# Testing
npm run test               # Run test suite
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Health & Monitoring
npm run health-check       # Check platform health
npm run status            # Get platform status
npm run metrics           # View system metrics
npm run monitor:components # Monitor component health

# Maintenance
npm run logs              # View platform logs
npm run logs:cleanup      # Clean old log files
npm run setup             # Initialize platform setup
npm run reset             # Clean and rebuild
```

## Support

- **Documentation**: [docs/](./docs/)
- **Setup Guide**: [docs/workflows/platform-setup-guide.md](./docs/workflows/platform-setup-guide.md)
- **Architecture**: [docs/architecture/platform-architecture.md](./docs/architecture/platform-architecture.md)
- **ADRs**: [docs/adrs/](./docs/adrs/)

---

**Vision**: To create the ultimate autonomous development platform that empowers developers to build better software faster through intelligent automation and seamless tool integration.
