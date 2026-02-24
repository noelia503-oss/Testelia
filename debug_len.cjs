const fs = require('fs');
const fullText = fs.readFileSync('debug_output.txt', 'utf8');

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        blocks = [text];
    }
    const finalQuestions = [];
    let globalCounter = 1;
    blocks.forEach((block) => {
        if (!block.trim()) return;
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
                    options.push({ id: optIndex.toString(), text: optMatch[3].trim() });
                    optIndex++;
                }
                finalQuestions.push({ id: globalCounter.toString(), text: qText, textLength: qText.length, options: options.length });
                globalCounter++;
            }
        });
    });
    return finalQuestions;
};

const qs = parseQuestions(fullText);
qs.forEach(q => {
    console.log(`Q${q.id} text length: ${q.textLength}, options: ${q.options}`);
});
console.log("Q1 text preview:");
if (qs.length > 0) { console.log(qs[0].text.substring(0, 250) + "..."); }
