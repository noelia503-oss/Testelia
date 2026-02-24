import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = './tests_muestra/Promo 35 PDF.pdf';

async function testParse() {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = "";

    for (let i = 1; i <= Math.min(2, pdf.numPages); i++) { // solo 2 paginas para debug
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let pageText = "";
        let lastItem = null;

        for (const item of textContent.items) {
            if (lastItem) {
                const diffY = Math.abs(item.transform[5] - lastItem.transform[5]);
                if (diffY > 5) {
                    pageText += "\n";
                } else {
                    const expectedNextX = lastItem.transform[4] + lastItem.width;
                    const distance = item.transform[4] - expectedNextX;
                    const fontSize = Math.abs(item.transform[0]) || 10;

                    if (distance > (fontSize * 0.2) && !pageText.endsWith(" ")) {
                        pageText += " ";
                    }
                }
            }
            pageText += item.str;
            lastItem = item;
        }
        fullText += pageText + "\n";
    }

    fullText = fullText.replace(/(\d+)\s+([.\-])/g, "$1$2");
    fullText = fullText.replace(/([A-D])\s+\)/gi, "$1)");
    fullText = fullText.replace(/v[ií]\s*c\s*[:J]\s*mas/gi, "víctimas");
    fullText = fullText.replace(/v[ií]c\s*[:J]\s*mas/gi, "víctimas");
    fullText = fullText.replace(/\b([a-z]+)\s*J\s*vidad\b/gi, "$1tividad");
    fullText = fullText.replace(/\bJ\s*po\b/gi, "tipo");
    fullText = fullText.replace(/f[ií]\s*cas\b/gi, "físicas");
    fullText = fullText.replace(/ob\s*je\s*J\s*vo\b/gi, "objetivo");
    fullText = fullText.replace(/ +/g, " ");

    fs.writeFileSync('./debug_output.txt', fullText);
    console.log("PDF parsed and saved to debug_output.txt");

    // Test the parsing
    const blocks = fullText.split(/(?=✅?\s*SOLUCIONES)/i);
    let allQs = [];
    blocks.forEach((block, index) => {
        if (!block.trim()) return;
        // Sólo spliteamos si la pregunta está al principio de una línea (así ignoramos "1978." en mitad de texto)
        const questionBlocks = block.split(/(?=\n\s*\b\d+\s*[\.\-\)]\s+)/);

        questionBlocks.forEach(qBlock => {
            // qMatch ahora requiere que esté anclado, pero como hicimos split puede ser la primera entidad
            const qMatch = qBlock.match(/^\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
            if (qMatch) {
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optsCount = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    optsCount++;
                }
                allQs.push({ id: qMatch[1], optsCount });
            } else {
                if (qBlock.trim().match(/^\d+/)) {
                    console.log("QMATCH FAILED FOR BLOCK:", qBlock.substring(0, 100));
                }
            }
        });
    });
    console.log("Extracted Questions:", allQs);
}

testParse().catch(console.error);
