const text = "1. De acuerdo con la constitucion a) Ser libre b) Estar atado c) Ninguna d) Todas 2. Otro numero a) a b) b c) c d) d";

const questionBlocks = text.split(/(?=\b\d+\s*[\.\-]\s+)/);
console.log(`Encontrados ${questionBlocks.length} bloques`);

questionBlocks.forEach(block => {
    const qMatch = block.match(/^\s*(\d+)\s*[\.\-]\s+(.*?)(?=\s*[a-d]\)\s+)/i);
    if (qMatch) {
        console.log("ID:", qMatch[1], "Texto:", qMatch[2]);
        const optionsPart = block.substring(qMatch[0].length);
        const optRegex = /([a-d])\)\s+(.*?)(?=\s*[a-d]\)\s+|$)/gi;
        let optMatch;
        while ((optMatch = optRegex.exec(optionsPart)) !== null) {
            console.log("  Opción", optMatch[1], ":", optMatch[2]);
        }
    }
});
