import fs from 'fs';

const text = `
TEST NUMERO 1 - TEMA 5
1. Pregunta uno
a) opcion
b) opcion
2. Pregunta dos
a) otra
b) mas

✅ SOLUCIONES AL TEST 1
1-a, 2-b

TEST NUMERO 2 - TEMA 5 CONTINUACION
1. Nueva pregunta uno
a) algo
b) nada
2. Otra mas
a) x
b) y

✅ SOLUCIONES AL TEST 2
1-b, 2-a
`;

// Vamos a dividir el documento iterando a través de las ocurrencias de las soluciones
export const parseMultiTestQuestions = (text) => {
    // 1. Fragmentar todo el texto por bloques delimitados por "SOLUCIONES AL TEST" o similares
    // La idea es cortar el string cada vez que vemos "SOLUCIONES"

    // Primero, encontramos todas las ocurrencias de la tabla de soluciones
    const boundaryRegex = /(?:✅\s*)?SOLUCIONES\s*AL\s*TEST[^\n]*\n?([\s\S]*?(?=(?:TEST|1\.)|$))/gi;

    // Una alternativa es separar el texto usando la palabra SOLUCIONES como pivote y trabajar hacia atras.
    const blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    console.log("Bloques detectados:", blocks.length);

    let finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block, index) => {
        if (!block.trim()) return;
        console.log("\n--- PROCESANDO BLOQUE " + (index + 1) + " ---");

        // Extraer soluciones de ESTE bloque
        const solutionsMap = {};
        const solRegex = /(\d+)\s*[\-\.]\s*([a-dA-D])/g;
        let solMatch;
        while ((solMatch = solRegex.exec(block)) !== null) {
            solutionsMap[solMatch[1]] = solMatch[2].toLowerCase();
        }
        console.log("  Soluciones locales:", solutionsMap);

        // Extraer las preguntas
        const questionBlocks = block.split(/(?=\b\d+\s*[\.\-]\s+)/);

        questionBlocks.forEach(qBlock => {
            const qMatch = qBlock.match(/^\s*(\d+)\s*[\.\-]\s+(.*?)(?=\s*[a-d]\)\s+)/i);
            if (qMatch) {
                const originalId = qMatch[1];
                let qText = qMatch[2].trim();

                const options = [];
                const optRegex = /([a-d])\)\s+(.*?)(?=\s*[a-d]\)\s+|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push({
                        label: optMatch[1].toLowerCase(),
                        text: optMatch[2].trim()
                    });
                }

                if (options.length > 0) {
                    finalQuestions.push({
                        id: globalCounter.toString(), // ID global secuencial
                        originalId: originalId, // ID del test
                        text: qText,
                        options,
                        correctAnswer: solutionsMap[originalId] || null
                    });
                    globalCounter++;
                }
            }
        });
    });

    return finalQuestions;
};

const res = parseMultiTestQuestions(text);
console.log("\nPreguntas finales consolidadas:", JSON.stringify(res.map(q => ({ id: q.id, text: q.text, currect: q.correctAnswer })), null, 2));
