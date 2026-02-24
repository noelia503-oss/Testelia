import fs from 'fs';

const mockText = fs.readFileSync('TestPDF/Promociones/promo 29 plano.txt', 'utf8');

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        blocks = [text];
    }
    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block, index) => {
        if (!block.trim()) return;

        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*[^\n]*\r?\n?/gmi, '').trim();
        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*\d*\s*-?\s*/gmi, '').trim();

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

                const options = [];
                let inlineCorrectAnswerIndex = null;
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|\n\s*\n|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optIndex = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push({ id: optIndex.toString(), label: optMatch[2].toLowerCase(), text: optMatch[3].trim() });
                    optIndex++;
                }

                if (options.length > 0) {
                    finalQuestions.push({
                        id: originalId,
                        text: qText,
                        options: options
                    });
                }
            }
        });
    });

    return finalQuestions;
};

const processed = parseQuestions(mockText);
if (processed.length > 0) {
    console.log(`P1 ID: ${processed[0].id}`);
    console.log(`P1 TEXTO: ${processed[0].text}`);
    console.log(`P1 OPCIONES: ${processed[0].options.length}`);
    console.log(`Opciones detalladas:`, processed[0].options);
} else {
    console.log("No questions matched.");
}
