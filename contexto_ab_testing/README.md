# 🧪 Contexto A/B Testing System

Sistema completo de A/B testing para comparar **GitNexus + RLM Navigator** vs **investigación tradicional** usando dual-swarm orchestration con RuFlow.

## 🎯 Características

- **Dual Swarm Deployment**: Ejecuta 2 swarms en paralelo automáticamente
- **Configuración Interactiva**: Permite seleccionar repositorio y pregunta de investigación
- **Dashboard en Tiempo Real**: Visualización de métricas durante la ejecución
- **Medición Automatizada**: Tiempo, precisión, cobertura y reportes comparativos
- **Integración ADW**: Usando el pipeline ADW completo con validación Seine

## 🚀 Inicio Rápido

### 1. Instalación
```bash
cd /workspaces/jlmaworkspace/new_projects/new_ideas/contexto/contexto_ab_testing
npm install
```

### 2. Ejecutar A/B Test Interactivo
```bash
npm run start:interactive
```

### 3. Ver Dashboard en Tiempo Real
```bash
npm run dashboard
```
Luego abrir: http://localhost:8080

### 4. Ejecutar Test Automático
```bash
npm run start
```

## 📊 Flujo de Trabajo

### Grupo A (Control): Investigación Tradicional
- **Herramientas**: Read, Grep, Bash, exploración manual
- **Agente**: TraditionalAnalystAgent
- **Enfoque**: Búsqueda manual + razonamiento general

### Grupo B (Experimental): GitNexus + RLM Navigator
- **Herramientas**: Sistema de 4 agentes especializados
- **Agentes**:
  - GraphArchitectAgent (GitNexus)
  - NavigatorAgent (RLM Navigator)
  - REPLAnalystAgent (RLM REPL)
  - SynthesizerAgent (Integración)
- **Enfoque**: Análisis automatizado + síntesis especializada

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run start:interactive` | A/B test con configuración interactiva |
| `npm run start` | A/B test automático con configuración por defecto |
| `npm run dashboard` | Solo dashboard para monitoreo |
| `npm run stop` | Detener todos los servicios |
| `npm run report` | Mostrar último reporte generado |
| `npm run clean` | Limpiar archivos temporales |

## 📈 Métricas Medidas

### Métricas de Rendimiento
- **Tiempo Total**: Desde pregunta inicial hasta respuesta completa
- **Tiempo de Primera Respuesta**: Primera respuesta útil
- **Precisión**: % de respuestas correctas verificables
- **Cobertura**: Profundidad del análisis realizado

### Métricas de Calidad
- **Completitud**: ¿Se encontraron todos los aspectos relevantes?
- **Confianza**: Escala 1-10 de confianza en resultados
- **Utilidad**: ¿Los resultados son accionables?

## 🎛️ Configuración

### Configuración Interactiva
El CLI interactivo permite configurar:
- **Repositorio a analizar**: Contexto, GitNexus, o ruta personalizada
- **Pregunta de investigación**: Plantillas predefinidas o personalizada
- **Parámetros del test**: Tiempo límite, objetivos de precisión/cobertura

### Configuración Manual
Editar `config/test-config.json`:
```json
{
  "repository": {
    "name": "contexto",
    "path": "/ruta/al/repositorio"
  },
  "investigationQuestion": "¿Tu pregunta aquí?",
  "timeLimit": 300,
  "accuracyTarget": 0.85,
  "coverageTarget": 0.90
}
```

## 📊 Estructura del Dashboard

### Métricas en Tiempo Real
- **Tests Activos**: Número de tests ejecutándose
- **Tests Completados**: Total de tests finalizados
- **Mejora Promedio en Tiempo**: % de mejora vs tradicional
- **Mejora Promedio en Precisión**: % de mejora vs tradicional

### Comparación de Swarms
- **Control Swarm**: Progreso del enfoque tradicional
- **Experimental Swarm**: Progreso del enfoque GitNexus+RLM
- **Gráficos en Tiempo Real**: Comparación visual de métricas

## 🔍 Casos de Uso Pre-configurados

### 1. Análisis de Impacto de Refactoring
```
Pregunta: "¿Qué impacto tendría cambiar la función authenticate() para soportar multi-factor authentication?"
Tiempo Esperado: 15-20 min (tradicional) vs 3-5 min (GitNexus+RLM)
```

### 2. Auditoría de Deuda Técnica
```
Pregunta: "¿Qué patrones de deuda técnica existen en este repositorio?"
Tiempo Esperado: 25-30 min (tradicional) vs 5-8 min (GitNexus+RLM)
```

### 3. Comprensión de Flujo de Autenticación
```
Pregunta: "¿Cómo funciona el flujo completo de autenticación en la aplicación?"
Tiempo Esperado: 30-40 min (tradicional) vs 8-12 min (GitNexus+RLM)
```

## 🛠️ Arquitectura Técnica

### Componentes Principales
- **ABTestOrchestrator**: Orquestador principal del dual-swarm
- **InteractiveCLI**: Interfaz de configuración interactiva
- **Dashboard**: Dashboard web en tiempo real con WebSockets
- **MetricsCollector**: Recolección automatizada de métricas

### Dependencias del Sistema
- **RuFlow**: Orquestación global de swarms
- **GitNexus**: Motor de análisis de grafos (MCP server en puerto stdio)
- **RLM Navigator**: Motor de navegación (daemon en puerto 8003)
- **Node.js**: Runtime para el sistema de A/B testing
- **WebSockets**: Comunicación en tiempo real con dashboard

## 📄 Reportes Generados

### Estructura del Reporte
```json
{
  "testId": "ab-test-1772908674958",
  "timestamp": "2026-03-07T...",
  "configuration": { ... },
  "results": {
    "control": { "timeElapsed": 18750, "accuracy": 0.72, "coverage": 0.68 },
    "experimental": { "timeElapsed": 4200, "accuracy": 0.94, "coverage": 0.91 }
  },
  "comparison": {
    "timeImprovement": "77.6%",
    "accuracyImprovement": "30.6%",
    "recommendedApproach": "GitNexus+RLM"
  }
}
```

### Ubicación de Reportes
- **Reportes JSON**: `results/ab-test-report-{testId}.json`
- **Logs de Ejecución**: `tmp/execution-{testId}.log`
- **Configuraciones**: `config/user-config.json`

## 🚨 Troubleshooting

### Problemas Comunes

**Error: ruflo no encontrado**
```bash
# Verificar que ruflo esté instalado globalmente
which ruflo
```

**Error: GitNexus no encontrado**
```bash
# Verificar que GitNexus esté indexado
cd ../base_projects/GitNexus/gitnexus
npx gitnexus status
```

**Error: RLM Navigator daemon**
```bash
# Verificar que el entorno virtual esté activado
source ../rlm-venv/bin/activate
```

**Error: Dashboard no carga**
```bash
# Verificar que el puerto 8080 esté libre
netstat -tulpn | grep :8080
```

### Logs de Debug
```bash
# Ver logs en tiempo real
tail -f tmp/execution-*.log

# Ver estado de servicios
ps aux | grep -E "(gitnexus|rlm|dashboard)"
```

## 🔧 Desarrollo

### Ejecutar Tests
```bash
npm test
```

### Desarrollo con Recarga Automática
```bash
npx nodemon src/interactive-cli.js
```

### Limpiar y Reiniciar
```bash
npm run clean
npm run start:interactive
```

---

**🎯 Objetivo**: Demostrar la superioridad del sistema GitNexus + RLM Navigator vs investigación tradicional a través de métricas objetivas y reportes comparativos automatizados.
