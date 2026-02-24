// Test con el fix correcto aplicado
import fs from 'fs';

const files = [
    'Tema 49 plano.txt',
    'Tema 46 plano.txt',
    'tema 17 plano.txt',
    'tema 36 plano.txt'
];

for (const f of files) {
    let text = fs.readFileSync('/Users/noeliatrujillocarrera/Desktop/APPTEST/TestPDF/Temario/' + f, 'utf8');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\xA0/g, ' ');

    // FIX APLICADO: solo inyectar si NO hay saltos de línea ya en el texto
    if (!text.includes('\n')) {
        text = text.replace(/(\S)\s+(?=\b\d{1,3}\s*[.\-\)]\s+[A-Z¿¡])/g, '$1\n');
    }

    let block = text;
    block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*[^\n]*\r?\n?/gmi, '');
    block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*\d*\s*-?\s*/gmi, '');
    block = block.trim();

    let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[.\-\)]\s+)/);
    const hasRealNumbers = questionBlocks.length > 2 &&
        questionBlocks.slice(1).some(qb => /^\s*\d+\s*[.\-\)]\s+/.test(qb));

    if (!hasRealNumbers) {
        const norm = block.replace(/\n{2,}/g, '\n\n');
        questionBlocks = norm.split(/\n\n/).filter(qb => qb.trim());
    }

    let count = 0;
    const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\).]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\).](?:\s|$)|\n\s*\n|$)/gi;

    for (const qBlock of questionBlocks) {
        if (!qBlock.trim()) continue;
        const noNum = qBlock.match(/^\s*([\s\S]+?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\).](?:\s|$))/i);
        if (noNum && noNum[1].trim()) {
            const remaining = qBlock.substring(noNum[0].length);
            const opts = [...remaining.matchAll(new RegExp(optRegex.source, 'gi'))];
            if (opts.length >= 2) count++;
        }
    }

    console.log(`${f}: ${count} preguntas | ${questionBlocks.length} bloques | hasRealNum=${hasRealNumbers}`);
}
