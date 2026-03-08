"use strict";
/**
 * Common Bridge Types and Interfaces
 * Shared types across all integration bridges
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerState = void 0;
// Circuit breaker states and configuration
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "closed";
    CircuitBreakerState["OPEN"] = "open";
    CircuitBreakerState["HALF_OPEN"] = "half_open";
})(CircuitBreakerState || (exports.CircuitBreakerState = CircuitBreakerState = {}));
//# sourceMappingURL=common.js.map