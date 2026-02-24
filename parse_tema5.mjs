import fs from 'fs';

const text = fs.readFileSync('TestPDF/Tema 5.txt', 'utf8');

const parseQuestionsTest = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        blocks = [text];
    }
    const finalQuestions = [];
    
    blocks.forEach((block) => {
        if (!block.trim()) return;
        
        // El texto original de NotebookLM tiene \n\n entre preguntas, pero NO tiene números secuenciales (o sí que los tiene en otro text? Miremos la primera pregunta: "Respecto al consejo consultivo..." -> No hay número)
        // Por lo tanto, el split por \n\n DEBE estar actuando.
        let questionBlocks = block.split(/\n\s*\n/);
        
        questionBlocks.forEach(qBlock => {
            if (!qBlock.trim().startsWith("TEST") && qBlock.trim() !== "") {
                 const noNumMatch = qBlock.match(/^\s*([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
                 if (noNumMatch) {
                     const qText = noNumMatch[1].trim();
                     const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|$)/gi;
                     const remainingBlock = qBlock.substring(noNumMatch[0].length);
                     
                     let optMatch;
                     let options = [];
                     while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                         options.push(optMatch[3].trim());
                     }
                     finalQuestions.push({ text: qText.substring(0, 50), optionsCount: options.length, lastOp: options[options.length-1] });
                 }
            }
        });
    });
    return finalQuestions;
};

const res = parseQuestionsTest(text);
console.log(`Extraidas: ${res.length}`);
console.log(JSON.stringify(res.slice(0, 3), null, 2));
