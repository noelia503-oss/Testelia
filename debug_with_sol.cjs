const fs = require('fs');

const mockText = `1. Pregunta uno con soluciones.
a) opt 1
b) opt 2
c) opt 3
d) opt 4

2. Pregunta dos con soluciones.
a) opt 5
b) opt 6
c) opt 7
d) opt 8

✅ SOLUCIONES AL TEST
1-a
2-b
`;

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        blocks = [text];
    }
    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block, index) => {
        if (!block.trim()) return;

        console.log("BLOCK", index, block.substring(0, 50));
        
        const questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);

        questionBlocks.forEach(qBlock => {
            const qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);

            if (qMatch) {
                const originalId = qMatch[1];
                let qText = qMatch[2].trim();

                const options = [];
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;

                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optIndex = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push({ text: optMatch[3].trim() });
                    optIndex++;
                }

                if (options.length > 0) {
                    finalQuestions.push({ id: globalCounter.toString(), text: qText, options });
                    globalCounter++;
                }
            }
        });
    });
    return finalQuestions;
};

const res = parseQuestions(mockText);
console.log(JSON.stringify(res, null, 2));
