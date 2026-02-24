const block = `
1. Que establece el articulo 14 de la Constitucion?
a) Igualdad ante la ley
*b) Libertad de expresion
c) Derecho a huelga
d) Nada de lo anterior

2. En que año acabo la WW2?
+a) 1945
b) 1939
c) 1914
✅d) 1918
`;

const finalQuestions = [];

const questionBlocks = block.split(/(?=\n?\s*\b\d+\s*(?:[\.\-\)]\s*)+)/);
questionBlocks.forEach(qBlock => {
    if (!qBlock.trim()) return;

    const qMatch = qBlock.match(/^\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\b[a-dA-D]\s*[\)\.](?:\s|$))/i);

    if (qMatch) {
        let qText = qMatch[2].trim();
        const options = [];
        let correctAnswer = null;

        const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;

        const remainingBlock = qBlock.substring(qMatch[0].length);
        let optMatch;
        while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
            const marker = optMatch[1];
            const label = optMatch[2].toLowerCase();
            const text = optMatch[3].trim();

            options.push({ label, text });

            if (marker) {
                correctAnswer = label;
            }
        }

        if (options.length > 0) {
            finalQuestions.push({
                text: qText || "Texto vacio",
                options,
                correctAnswer
            });
        }
    }
});

console.log(JSON.stringify(finalQuestions, null, 2));

