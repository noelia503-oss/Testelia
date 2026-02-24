import fs from 'fs';
const text = fs.readFileSync('TestPDF/Promociones/promo 30 plano.txt', 'utf8');

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) blocks = [text];
    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block) => {
        if (!block.trim()) return;
        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*[^\n]*\r?\n?/gmi, '').trim();
        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*\d*\s*-?\s*/gmi, '').trim();

        let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);
        if (questionBlocks.length <= 2) questionBlocks = block.split(/\n\s*\n/);

        questionBlocks.forEach(qBlock => {
            if (!qBlock.trim()) return;
            let qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
            
            if (!qMatch) {
                const noNumMatch = qBlock.match(/^\s*([\s\S]+?)(?=(?:[\*\+✅]\s*)?\n?\s*[aA]\s*[\)\.](?:\s|$))/i);
                if (noNumMatch) {
                    qMatch = [noNumMatch[0], null, noNumMatch[1]];
                } else {
                    const fallbackMatch = qBlock.match(/^\s*([\s\S]+?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
                    if (fallbackMatch) {
                         qMatch = [fallbackMatch[0], null, fallbackMatch[1]];
                    } else {
                         const cleanText = qBlock.split(/(?:[\*\+✅]\s*)?\n?\s*[a-dA-D]\s*[\)\.]/i)[0] || qBlock;
                         qMatch = [cleanText, null, cleanText];
                    }
                }
            }

            if (qMatch) {
                const originalId = qMatch[1] ? qMatch[1].trim() : (globalCounter++).toString();
                let qText = qMatch[2].trim();
                const options = [];
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|\n\s*\n|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push({ label: optMatch[2].toLowerCase(), text: optMatch[3].trim() });
                }
                if (options.length > 0) {
                    finalQuestions.push({ id: originalId, text: qText, options });
                }
            }
        });
    });
    return finalQuestions;
};

const res = parseQuestions(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\xA0/g, ' '));
console.log("Q1 TEXT:", res[0].text);
console.log("Q1 OPTIONS:", res[0].options.length);
res[0].options.forEach(o => console.log(` ${o.label}) ${o.text}`));
console.log("\nQ2 TEXT:", res[1].text);
console.log("Q2 OPTIONS:", res[1].options.length);
res[1].options.forEach(o => console.log(` ${o.label}) ${o.text}`));

