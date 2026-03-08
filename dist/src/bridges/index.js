"use strict";
/**
 * Bridge Integration System Entry Point
 * Exports all bridges, types, and utilities for integration use
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridgeRegistry = exports.bridgeFactory = exports.DefaultBridgeRegistry = exports.DefaultBridgeFactory = exports.BridgeUtils = exports.ClaudeCodeBridge = exports.RLMNavigatorBridge = exports.GitNexusBridge = exports.ADWSkillsBridge = exports.RufloBridge = exports.DossierBridge = exports.BaseBridge = void 0;
exports.setupBridges = setupBridges;
// Import all bridge implementations first
const BaseBridge_1 = require("./base/BaseBridge");
Object.defineProperty(exports, "BaseBridge", { enumerable: true, get: function () { return BaseBridge_1.BaseBridge; } });
const DossierBridge_1 = require("./DossierBridge");
Object.defineProperty(exports, "DossierBridge", { enumerable: true, get: function () { return DossierBridge_1.DossierBridge; } });
const RufloBridge_1 = require("./RufloBridge");
Object.defineProperty(exports, "RufloBridge", { enumerable: true, get: function () { return RufloBridge_1.RufloBridge; } });
const ADWSkillsBridge_1 = require("./ADWSkillsBridge");
Object.defineProperty(exports, "ADWSkillsBridge", { enumerable: true, get: function () { return ADWSkillsBridge_1.ADWSkillsBridge; } });
const GitNexusBridge_1 = require("./GitNexusBridge");
Object.defineProperty(exports, "GitNexusBridge", { enumerable: true, get: function () { return GitNexusBridge_1.GitNexusBridge; } });
const RLMNavigatorBridge_1 = require("./RLMNavigatorBridge");
Object.defineProperty(exports, "RLMNavigatorBridge", { enumerable: true, get: function () { return RLMNavigatorBridge_1.RLMNavigatorBridge; } });
const ClaudeCodeBridge_1 = require("./ClaudeCodeBridge");
Object.defineProperty(exports, "ClaudeCodeBridge", { enumerable: true, get: function () { return ClaudeCodeBridge_1.ClaudeCodeBridge; } });
// Type definitions
__exportStar(require("./types/common"), exports);
// Event system
__exportStar(require("./events/EventTypes"), exports);
// Error handling
__exportStar(require("./errors/ErrorHandling"), exports);
// Utility functions and helpers
class BridgeUtils {
    /**
     * Create a bridge configuration from environment variables
     */
    static createConfigFromEnv(bridgeType) {
        // Implementation would read from process.env and create appropriate config
        return {};
    }
    /**
     * Validate bridge configuration
     */
    static validateConfig(config, schema) {
        // Implementation would validate config against JSON schema
        return true;
    }
    /**
     * Merge configurations with defaults
     */
    static mergeConfigs(config, defaults) {
        return { ...defaults, ...config };
    }
    /**
     * Create a standardized bridge ID
     */
    static createBridgeId(bridgeType, instanceName) {
        const timestamp = Date.now();
        const suffix = instanceName || Math.random().toString(36).substr(2, 9);
        return `${bridgeType}_${suffix}_${timestamp}`;
    }
    /**
     * Parse event correlation patterns
     */
    static parseEventPattern(pattern) {
        // Implementation would parse event pattern strings
        return {};
    }
    /**
     * Generate event fingerprint for deduplication
     */
    static generateEventFingerprint(event) {
        // Implementation would generate unique fingerprint
        return '';
    }
}
exports.BridgeUtils = BridgeUtils;
class DefaultBridgeFactory {
    createDossierBridge(config) {
        return new DossierBridge_1.DossierBridge(config);
    }
    createRufloBridge(config) {
        return new RufloBridge_1.RufloBridge(config);
    }
    createADWSkillsBridge(config) {
        return new ADWSkillsBridge_1.ADWSkillsBridge(config);
    }
    createGitNexusBridge(config) {
        return new GitNexusBridge_1.GitNexusBridge(config);
    }
    createRLMNavigatorBridge(config) {
        return new RLMNavigatorBridge_1.RLMNavigatorBridge(config);
    }
    createClaudeCodeBridge(config) {
        return new ClaudeCodeBridge_1.ClaudeCodeBridge(config);
    }
}
exports.DefaultBridgeFactory = DefaultBridgeFactory;
class DefaultBridgeRegistry {
    bridges = new Map();
    register(id, bridge) {
        this.bridges.set(id, bridge);
    }
    unregister(id) {
        this.bridges.delete(id);
    }
    get(id) {
        return this.bridges.get(id);
    }
    list() {
        return Array.from(this.bridges.keys());
    }
    getAll() {
        return new Map(this.bridges);
    }
}
exports.DefaultBridgeRegistry = DefaultBridgeRegistry;
// Default exports for common use cases
exports.bridgeFactory = new DefaultBridgeFactory();
exports.bridgeRegistry = new DefaultBridgeRegistry();
/**
 * Quick setup function for common bridge configurations
 */
async function setupBridges(config) {
    const bridges = new Map();
    if (config.dossier) {
        const bridge = exports.bridgeFactory.createDossierBridge(config.dossier);
        await bridge.connect();
        bridges.set('dossier', bridge);
    }
    if (config.ruflo) {
        const bridge = exports.bridgeFactory.createRufloBridge(config.ruflo);
        await bridge.connect();
        bridges.set('ruflo', bridge);
    }
    if (config.adwSkills) {
        const bridge = exports.bridgeFactory.createADWSkillsBridge(config.adwSkills);
        await bridge.connect();
        bridges.set('adwSkills', bridge);
    }
    if (config.gitNexus) {
        const bridge = exports.bridgeFactory.createGitNexusBridge(config.gitNexus);
        await bridge.connect();
        bridges.set('gitNexus', bridge);
    }
    if (config.rlmNavigator) {
        const bridge = exports.bridgeFactory.createRLMNavigatorBridge(config.rlmNavigator);
        await bridge.connect();
        bridges.set('rlmNavigator', bridge);
    }
    if (config.claudeCode) {
        const bridge = exports.bridgeFactory.createClaudeCodeBridge(config.claudeCode);
        await bridge.connect();
        bridges.set('claudeCode', bridge);
    }
    return bridges;
}
//# sourceMappingURL=index.js.map