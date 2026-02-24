import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = './tests_muestra/Promo 35 PDF.pdf';

async function testParse() {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = fs.readFileSync('debug_output.txt', 'utf8');

    const blocks = fullText.split(/(?=✅?\s*SOLUCIONES)/i);
    let allQs = [];
    blocks.forEach((block, index) => {
        if (!block.trim()) return;
        
        const questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);

        questionBlocks.forEach(qBlock => {
            const qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
            if (qMatch) {
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optsCount = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    optsCount++;
                }
                allQs.push({ id: qMatch[1], text: qMatch[2].trim().substring(0, 50), optsCount });
            }
        });
    });
    console.log(JSON.stringify(allQs, null, 2));
}

testParse().catch(console.error);
