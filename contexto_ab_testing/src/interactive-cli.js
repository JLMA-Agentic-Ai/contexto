#!/usr/bin/env node

/**
 * Interactive CLI for A/B Testing Configuration
 * Allows user to select repository and investigation question
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class InteractiveCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.config = {};
    }

    async question(query) {
        return new Promise(resolve => this.rl.question(query, resolve));
    }

    async start() {
        console.log('🎯 ADW A/B Testing System - Configuración Interactiva');
        console.log('=====================================================');
        console.log('');

        try {
            // Step 1: Repository Selection
            await this.selectRepository();

            // Step 2: Investigation Question
            await this.selectInvestigationQuestion();

            // Step 3: Test Configuration
            await this.configureTestParameters();

            // Step 4: Confirmation
            await this.confirmConfiguration();

            // Step 5: Start A/B Test
            await this.startABTest();

        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async selectRepository() {
        console.log('📁 Selección de Repositorio');
        console.log('---------------------------');

        const repoOptions = [
            {
                name: 'Contexto (actual)',
                path: '/workspaces/jlmaworkspace/new_projects/new_ideas/contexto',
                description: 'Proyecto actual con GitNexus + RLM Navigator'
            },
            {
                name: 'GitNexus',
                path: '/workspaces/jlmaworkspace/new_projects/new_ideas/contexto/base_projects/GitNexus',
                description: 'Motor de análisis de grafos de conocimiento'
            },
            {
                name: 'Custom path',
                path: '',
                description: 'Especificar ruta personalizada'
            }
        ];

        console.log('Repositorios disponibles:');
        repoOptions.forEach((repo, index) => {
            console.log(`${index + 1}. ${repo.name} - ${repo.description}`);
            console.log(`   📍 ${repo.path || 'Ruta personalizada'}`);
            console.log('');
        });

        const choice = await this.question('Selecciona repositorio (1-3): ');
        const selectedIndex = parseInt(choice) - 1;

        if (selectedIndex < 0 || selectedIndex >= repoOptions.length) {
            throw new Error('Selección inválida');
        }

        if (selectedIndex === 2) {
            // Custom path
            const customPath = await this.question('Introduce la ruta del repositorio: ');
            this.config.repository = {
                name: path.basename(customPath),
                path: customPath,
                custom: true
            };
        } else {
            this.config.repository = repoOptions[selectedIndex];
        }

        console.log(`✅ Repositorio seleccionado: ${this.config.repository.name}`);
        console.log(`📍 Ruta: ${this.config.repository.path}`);
        console.log('');
    }

    async selectInvestigationQuestion() {
        console.log('❓ Pregunta de Investigación');
        console.log('----------------------------');

        const questionTemplates = [
            {
                title: 'Análisis de Impacto de Refactoring',
                template: '¿Qué impacto tendría cambiar la función {FUNCTION_NAME} para {CHANGE_DESCRIPTION}?',
                example: '¿Qué impacto tendría cambiar la función authenticate() para soportar multi-factor authentication?'
            },
            {
                title: 'Auditoría de Deuda Técnica',
                template: '¿Qué patrones de deuda técnica existen en {MODULE/AREA}?',
                example: '¿Qué patrones de deuda técnica existen en el módulo de autenticación?'
            },
            {
                title: 'Comprensión de Flujo',
                template: '¿Cómo funciona el flujo completo de {PROCESS} en la aplicación?',
                example: '¿Cómo funciona el flujo completo de autenticación en la aplicación?'
            },
            {
                title: 'Análisis de Dependencias',
                template: '¿Cuáles son las dependencias críticas de {COMPONENT}?',
                example: '¿Cuáles son las dependencias críticas del sistema de usuarios?'
            },
            {
                title: 'Pregunta Personalizada',
                template: '',
                example: 'Escribe tu propia pregunta de investigación'
            }
        ];

        console.log('Plantillas de preguntas disponibles:');
        questionTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.title}`);
            console.log(`   📝 ${template.example}`);
            console.log('');
        });

        const choice = await this.question('Selecciona plantilla (1-5): ');
        const selectedIndex = parseInt(choice) - 1;

        if (selectedIndex < 0 || selectedIndex >= questionTemplates.length) {
            throw new Error('Selección inválida');
        }

        if (selectedIndex === 4) {
            // Custom question
            this.config.investigationQuestion = await this.question('Introduce tu pregunta de investigación: ');
        } else {
            const template = questionTemplates[selectedIndex];
            console.log(`📝 Plantilla seleccionada: ${template.title}`);

            if (template.template.includes('{')) {
                // Template needs customization
                console.log(`Plantilla: ${template.template}`);
                this.config.investigationQuestion = await this.question('Introduce la pregunta personalizada: ');
            } else {
                this.config.investigationQuestion = template.example;
            }
        }

        console.log(`✅ Pregunta de investigación: ${this.config.investigationQuestion}`);
        console.log('');
    }

    async configureTestParameters() {
        console.log('⚙️ Configuración de Parámetros de Test');
        console.log('--------------------------------------');

        const timeLimit = await this.question('Tiempo límite por investigación (segundos, default 300): ');
        this.config.timeLimit = timeLimit ? parseInt(timeLimit) : 300;

        const accuracyTarget = await this.question('Objetivo de precisión (0.0-1.0, default 0.85): ');
        this.config.accuracyTarget = accuracyTarget ? parseFloat(accuracyTarget) : 0.85;

        const coverageTarget = await this.question('Objetivo de cobertura (0.0-1.0, default 0.90): ');
        this.config.coverageTarget = coverageTarget ? parseFloat(coverageTarget) : 0.90;

        console.log('✅ Parámetros configurados:');
        console.log(`   ⏱️  Tiempo límite: ${this.config.timeLimit}s`);
        console.log(`   🎯 Precisión objetivo: ${this.config.accuracyTarget}`);
        console.log(`   📊 Cobertura objetivo: ${this.config.coverageTarget}`);
        console.log('');
    }

    async confirmConfiguration() {
        console.log('📋 Resumen de Configuración');
        console.log('---------------------------');
        console.log(`📁 Repositorio: ${this.config.repository.name}`);
        console.log(`📍 Ruta: ${this.config.repository.path}`);
        console.log(`❓ Pregunta: ${this.config.investigationQuestion}`);
        console.log(`⏱️  Tiempo límite: ${this.config.timeLimit}s`);
        console.log(`🎯 Precisión objetivo: ${this.config.accuracyTarget}`);
        console.log(`📊 Cobertura objetivo: ${this.config.coverageTarget}`);
        console.log('');

        const confirm = await this.question('¿Continuar con esta configuración? (s/n): ');
        if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
            throw new Error('Configuración cancelada por el usuario');
        }

        // Save configuration
        const configDir = '/workspaces/jlmaworkspace/new_projects/new_ideas/contexto/contexto_ab_testing/config';
        await fs.writeFile(
            path.join(configDir, 'user-config.json'),
            JSON.stringify(this.config, null, 2)
        );

        console.log('✅ Configuración guardada');
        console.log('');
    }

    async startABTest() {
        console.log('🚀 Iniciando A/B Test con Dual Swarms');
        console.log('====================================');

        // Import and start the orchestrator
        const ABTestOrchestrator = require('./ab-test-orchestrator.js');
        const orchestrator = new ABTestOrchestrator();

        // Override user config
        orchestrator.userConfig = this.config;

        try {
            const report = await orchestrator.startABTest();

            console.log('');
            console.log('📊 RESULTADOS DEL A/B TEST');
            console.log('==========================');
            console.log(`🔄 Control (Tradicional):`);
            console.log(`   ⏱️  Tiempo: ${report.results.control.timeElapsed}ms`);
            console.log(`   🎯 Precisión: ${(report.results.control.accuracy * 100).toFixed(1)}%`);
            console.log(`   📊 Cobertura: ${(report.results.control.coverage * 100).toFixed(1)}%`);
            console.log('');
            console.log(`🧠 Experimental (GitNexus+RLM):`);
            console.log(`   ⏱️  Tiempo: ${report.results.experimental.timeElapsed}ms`);
            console.log(`   🎯 Precisión: ${(report.results.experimental.accuracy * 100).toFixed(1)}%`);
            console.log(`   📊 Cobertura: ${(report.results.experimental.coverage * 100).toFixed(1)}%`);
            console.log('');
            console.log(`📈 MEJORAS:`);
            console.log(`   ⚡ Tiempo: ${report.comparison.timeImprovement}`);
            console.log(`   🎯 Precisión: ${report.comparison.accuracyImprovement}`);
            console.log(`   🏆 Recomendación: ${report.comparison.recommendedApproach}`);
            console.log('');
            console.log(`📄 Reporte completo: results/ab-test-report-${orchestrator.testId}.json`);

        } catch (error) {
            console.error('❌ Error ejecutando A/B Test:', error.message);
        }
    }
}

// Run CLI if executed directly
if (require.main === module) {
    const cli = new InteractiveCLI();
    cli.start();
}

module.exports = InteractiveCLI;
