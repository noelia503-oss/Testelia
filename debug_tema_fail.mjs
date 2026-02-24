// Test completo que simula parseQuestions() exactamente como lo hace el browser
import fs from 'fs';

const filePath = process.argv[2] || '/Users/noeliatrujillocarrera/Desktop/APPTEST/TestPDF/Temario/Tema 49 plano.txt';
let text = fs.readFileSync(filePath, 'utf8');

// ---- EXACTAMENTE lo que hace App.jsx antes de llamar a parseQuestions ---
text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
text = text.replace(/\xA0/g, ' ');

// ---- EXACTAMENTE parseQuestions() de pdfParser.js ----

// Línea 72: Inyección de \n antes de posibles preguntas numeradas
const beforeInject = text.slice(0, 300);
text = text.replace(/(\S)\s+(?=\b\d{1,3}\s*[.\-\)]\s+[A-Z¿¡])/g, "$1\n");
const afterInject = text.slice(0, 300);

if (beforeInject !== afterInject) {
    console.log('⚠️  Inyección de \\n ACTIVÓ en el texto de pregunta:');
    // Encontrar diferencias
    for (let i = 0; i < Math.min(beforeInject.length, afterInject.length); i++) {
        if (beforeInject[i] !== afterInject[i]) {
            console.log('  Posición', i, ':', JSON.stringify(beforeInject.substring(i - 20, i + 30)));
            break;
        }
    }
} else {
    console.log('✅ Inyección de \\n NO activó (correcto para archivos sin numeración)');
}

// Split por SOLUCIONES
let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
console.log('Bloques por SOLUCIONES:', blocks.length);
blocks = [text];

let globalCounter = 1;
let totalParsed = 0;

blocks.forEach((block) => {
    if (!block.trim()) return;

    // Limpieza de cabeceras
    block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*[^\n]*\r?\n?/gmi, '').trim();

    // solutionsMap con aviso de falsos positivos
    const solutionsMap = {};
    const solRegex = /(\d+)\s*[\-\.]\s*([a-dA-D])/g;
    let solMatch;
    const falsePositives = [];
    while ((solMatch = solRegex.exec(block)) !== null) {
        solutionsMap[solMatch[1]] = solMatch[2].toLowerCase();
        falsePositives.push(`"${solMatch[0]}" → Q${solMatch[1]}=${solMatch[2]}`);
    }
    if (falsePositives.length > 0) {
        console.log(`\n⚠️  solRegex capturó ${falsePositives.length} patrones: ${falsePositives.slice(0, 5).join(', ')}`);
    }

    // Split de preguntas
    let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[.\-\)]\s+)/);
    const hasRealNumbers = questionBlocks.length > 2 &&
        questionBlocks.slice(1).some(qb => /^\s*\d+\s*[.\-\)]\s+/.test(qb));

    console.log(`\n📊 Split numerado: ${questionBlocks.length} bloques | Numeración real: ${hasRealNumbers}`);

    if (!hasRealNumbers) {
        const normalizedBlock = block.replace(/\n{2,}/g, '\n\n');
        questionBlocks = normalizedBlock.split(/\n\n/).filter(qb => qb.trim());
        console.log(`📊 Split por párrafos: ${questionBlocks.length} bloques`);
    }

    // Procesar
    const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\).]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\).](?:\s|$)|\n\s*\n|$)/gi;

    questionBlocks.forEach((qBlock, idx) => {
        if (!qBlock.trim()) return;

        let qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[.\-\)]\s*)+([  \s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\).](?:\s|$))/i);

        if (!qMatch) {
            const noNumMatch = qBlock.match(/^\s*([\s\S]+?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\).](?:\s|$))/i);
            if (noNumMatch && noNumMatch[1].trim()) {
                qMatch = [noNumMatch[0], null, noNumMatch[1]];
            }
        }

        if (qMatch) {
            const remainingBlock = qBlock.substring(qMatch[0].length);
            const opts = [...remainingBlock.matchAll(new RegExp(optRegex.source, 'gi'))];
            totalParsed++;
            if (idx < 5) {
                console.log(`  [Q${totalParsed}] "${qMatch[2].trim().substring(0, 60)}..." → ${opts.length} opciones [${opts.map(m => m[2]).join(',')}]`);
            }
        } else if (idx < 5) {
            console.log(`  [Q?] SKIPPED - sin match: "${qBlock.substring(0, 80)}"`);
        }
    });

    console.log(`\n✅ TOTAL PREGUNTAS PARSEADAS: ${totalParsed}`);
});
