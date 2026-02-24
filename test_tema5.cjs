const fs = require('fs');
const mockText = fs.readFileSync('TestPDF/Tema 5.txt', 'utf8');

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        blocks = [text];
    }
    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block, index) => {
        if (!block.trim()) return;
        const questionBlocks = block.split(/(?=(?:^|\n)\n*\s*\b\d+\s*[\.\-\)]\s+)/);

        questionBlocks.forEach(qBlock => {
            const qMatch = qBlock.match(/(?:^|\n)\n*\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);

            if (qMatch) {
                const originalId = qMatch[1];
                let qText = qMatch[2].trim();

                const options = [];
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;

                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optIndex = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push({ id: optIndex.toString(), text: optMatch[3].trim() });
                    optIndex++;
                }

                if (options.length > 0) {
                    finalQuestions.push({ id: globalCounter.toString(), text: qText.substring(0, 50), optsCount: options.length });
                    globalCounter++;
                }
            }
        });
    });
    return finalQuestions;
};

const res = parseQuestions(mockText);
console.log(`Total Extraidas: ${res.length}`);
console.log(JSON.stringify(res.slice(0,5), null, 2));
