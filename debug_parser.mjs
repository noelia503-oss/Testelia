import fs from 'fs';

const text = fs.readFileSync('/Users/noeliatrujillocarrera/Desktop/APPTEST/TestPDF/Tema 5 plano.txt', 'utf8');

const parseQuestions = (rawText) => {
    // A veces el título se pega SIN saltos de línea al primer caracter si Pages lo chafa, e.g. "TEST 1Respecto ..."
    // o "TEST 1\nRespecto" o "TEST 1 Respecto". Vamos a hacer una limpieza radical:
    let block = rawText.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE)[\s\d]*\r?\n?/gmi, '').trim();
    // Limpieza secundaria para casos de "TEST 1 " pegado sin salto
    block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE)[\s\d]+/i, '').trim();

    const finalQuestions = [];
    let globalCounter = 1;

    let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);
    if (questionBlocks.length <= 2) {
        questionBlocks = block.split(/\n\s*\n/);
    }

    questionBlocks.forEach(qBlock => {
        if (!qBlock.trim()) return;
        let qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);

        if (!qMatch) {
            const noNumMatch = qBlock.match(/^\s*([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
            if (noNumMatch) {
                qMatch = [noNumMatch[0], null, noNumMatch[1]];
            }
        }

        if (qMatch) {
            const originalId = qMatch[1] ? qMatch[1].trim() : (globalCounter++).toString();
            let qText = qMatch[2].trim();
            finalQuestions.push({ id: originalId, text: qText.substring(0, 100), fullText: qText });
        }
    });
    return finalQuestions;
};

const qs = parseQuestions(text);
console.log(`Extracted: ${qs.length}`);
console.log(JSON.stringify(qs.slice(0, 2), null, 2));
