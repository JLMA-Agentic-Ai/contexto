#!/bin/bash

# A/B Testing Automation Script
# Executes complete dual-swarm A/B testing with dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTEXTO_DIR="/workspaces/jlmaworkspace/new_projects/new_ideas/contexto"

echo "🧪 ADW A/B Testing System - Automation Script"
echo "=============================================="

# Function to check dependencies
check_dependencies() {
    echo "🔍 Verificando dependencias..."

    # Check if ruflo is available
    if ! command -v ruflo &> /dev/null; then
        echo "❌ Error: ruflo no encontrado. Asegúrate de que esté instalado globalmente."
        exit 1
    fi

    # Check if GitNexus is available
    GITNEXUS_DIR="$CONTEXTO_DIR/base_projects/GitNexus/gitnexus"
    if [ ! -d "$GITNEXUS_DIR" ]; then
        echo "❌ Error: GitNexus no encontrado en $GITNEXUS_DIR"
        exit 1
    fi

    # Check if RLM Navigator is available
    RLM_DIR="$CONTEXTO_DIR/base_projects/rlm-navigator"
    if [ ! -d "$RLM_DIR" ]; then
        echo "❌ Error: RLM Navigator no encontrado en $RLM_DIR"
        exit 1
    fi

    # Check if Python venv exists
    VENV_DIR="$CONTEXTO_DIR/rlm-venv"
    if [ ! -d "$VENV_DIR" ]; then
        echo "❌ Error: Python virtual environment no encontrado en $VENV_DIR"
        exit 1
    fi

    echo "✅ Todas las dependencias verificadas"
}

# Function to start services
start_services() {
    echo "🚀 Iniciando servicios..."

    # Start GitNexus MCP server
    echo "🧠 Iniciando GitNexus MCP server..."
    cd "$GITNEXUS_DIR"
    npx gitnexus mcp &
    GITNEXUS_PID=$!
    echo "✅ GitNexus MCP server iniciado (PID: $GITNEXUS_PID)"

    # Start RLM Navigator daemon
    echo "🗂️ Iniciando RLM Navigator daemon..."
    source "$VENV_DIR/bin/activate"
    cd "$RLM_DIR"
    python daemon/rlm_daemon.py --port 8003 --repo-path "$CONTEXTO_DIR" &
    RLM_PID=$!
    echo "✅ RLM Navigator daemon iniciado (PID: $RLM_PID)"

    # Start dashboard
    echo "📊 Iniciando dashboard..."
    cd "$PROJECT_DIR"
    node src/dashboard.js &
    DASHBOARD_PID=$!
    echo "✅ Dashboard iniciado (PID: $DASHBOARD_PID)"
    echo "🌐 Dashboard disponible en: http://localhost:8080"

    # Store PIDs for cleanup
    echo "$GITNEXUS_PID" > "$PROJECT_DIR/tmp/gitnexus.pid"
    echo "$RLM_PID" > "$PROJECT_DIR/tmp/rlm.pid"
    echo "$DASHBOARD_PID" > "$PROJECT_DIR/tmp/dashboard.pid"
}

# Function to stop services
stop_services() {
    echo "🛑 Deteniendo servicios..."

    if [ -f "$PROJECT_DIR/tmp/gitnexus.pid" ]; then
        kill $(cat "$PROJECT_DIR/tmp/gitnexus.pid") 2>/dev/null || true
        rm -f "$PROJECT_DIR/tmp/gitnexus.pid"
        echo "✅ GitNexus MCP server detenido"
    fi

    if [ -f "$PROJECT_DIR/tmp/rlm.pid" ]; then
        kill $(cat "$PROJECT_DIR/tmp/rlm.pid") 2>/dev/null || true
        rm -f "$PROJECT_DIR/tmp/rlm.pid"
        echo "✅ RLM Navigator daemon detenido"
    fi

    if [ -f "$PROJECT_DIR/tmp/dashboard.pid" ]; then
        kill $(cat "$PROJECT_DIR/tmp/dashboard.pid") 2>/dev/null || true
        rm -f "$PROJECT_DIR/tmp/dashboard.pid"
        echo "✅ Dashboard detenido"
    fi
}

# Function to run A/B test
run_ab_test() {
    echo "🧪 Ejecutando A/B Test..."
    cd "$PROJECT_DIR"

    if [ "$1" = "--interactive" ]; then
        echo "🎯 Modo interactivo activado"
        node src/interactive-cli.js
    else
        echo "🤖 Modo automático activado"
        # Run with default configuration
        node -e "
        const ABTestOrchestrator = require('./src/ab-test-orchestrator.js');
        const orchestrator = new ABTestOrchestrator();
        orchestrator.startABTest().then(report => {
            console.log('✅ A/B Test completado');
            console.log('📊 Resultados:', JSON.stringify(report.comparison, null, 2));
            process.exit(0);
        }).catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
        "
    fi
}

# Function to generate report
generate_report() {
    echo "📄 Generando reporte consolidado..."

    RESULTS_DIR="$PROJECT_DIR/results"
    LATEST_REPORT=$(ls -t "$RESULTS_DIR"/ab-test-report-*.json 2>/dev/null | head -n 1)

    if [ -z "$LATEST_REPORT" ]; then
        echo "❌ No se encontraron reportes"
        return 1
    fi

    echo "📊 Último reporte: $(basename "$LATEST_REPORT")"

    # Extract key metrics
    node -e "
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync('$LATEST_REPORT', 'utf8'));

    console.log('');
    console.log('📈 RESUMEN EJECUTIVO');
    console.log('==================');
    console.log('Test ID:', report.testId);
    console.log('Timestamp:', new Date(report.timestamp).toLocaleString());
    console.log('');
    console.log('🔄 RESULTADOS:');
    console.log('Control (Tradicional):');
    console.log('  ⏱️  Tiempo:', report.results.control.timeElapsed + 'ms');
    console.log('  🎯 Precisión:', (report.results.control.accuracy * 100).toFixed(1) + '%');
    console.log('  📊 Cobertura:', (report.results.control.coverage * 100).toFixed(1) + '%');
    console.log('');
    console.log('Experimental (GitNexus+RLM):');
    console.log('  ⏱️  Tiempo:', report.results.experimental.timeElapsed + 'ms');
    console.log('  🎯 Precisión:', (report.results.experimental.accuracy * 100).toFixed(1) + '%');
    console.log('  📊 Cobertura:', (report.results.experimental.coverage * 100).toFixed(1) + '%');
    console.log('');
    console.log('🏆 MEJORAS:');
    console.log('  ⚡ Tiempo:', report.comparison.timeImprovement);
    console.log('  🎯 Precisión:', report.comparison.accuracyImprovement);
    console.log('  🥇 Recomendación:', report.comparison.recommendedApproach);
    "
}

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Limpiando..."
    stop_services
    exit 0
}

# Set up cleanup on exit
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Create tmp directory
    mkdir -p "$PROJECT_DIR/tmp"
    mkdir -p "$PROJECT_DIR/results"

    # Parse arguments
    MODE="auto"
    if [ "$1" = "--interactive" ] || [ "$1" = "-i" ]; then
        MODE="interactive"
    fi

    case "${1:-start}" in
        "start"|"run")
            check_dependencies
            start_services
            sleep 3  # Wait for services to start
            run_ab_test $([ "$MODE" = "interactive" ] && echo "--interactive")
            generate_report
            ;;
        "stop")
            stop_services
            ;;
        "dashboard")
            check_dependencies
            start_services
            echo "📊 Dashboard corriendo. Presiona Ctrl+C para detener."
            wait
            ;;
        "report")
            generate_report
            ;;
        "clean")
            echo "🧹 Limpiando archivos temporales..."
            rm -rf "$PROJECT_DIR/tmp"
            rm -rf "$PROJECT_DIR/results"
            echo "✅ Limpieza completada"
            ;;
        *)
            echo "Uso: $0 {start|stop|dashboard|report|clean} [--interactive]"
            echo ""
            echo "Comandos:"
            echo "  start         - Ejecutar A/B test completo"
            echo "  stop          - Detener todos los servicios"
            echo "  dashboard     - Solo iniciar dashboard"
            echo "  report        - Mostrar último reporte"
            echo "  clean         - Limpiar archivos temporales"
            echo ""
            echo "Opciones:"
            echo "  --interactive - Modo interactivo para configuración"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
