import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

let content = fs.readFileSync('TestPDF/Promociones/promo 30 plano.txt', 'utf8');
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); 
content = content.replace(/\xA0/g, ' ');

const res = parseQuestions(content);

console.log("TOTAL PREGUNTAS:", res.length);
if(res.length > 0) {
    console.log("================= Q1 =================");
    console.log("TEXTO:\n", res[0].text);
    console.log("OPCIONES COUNT:", res[0].options.length);
    res[0].options.forEach(o => console.log(`  ${o.label}) ${o.text}`));

    if (res.length > 1) {
        console.log("================= Q2 =================");
        console.log("TEXTO:\n", res[1].text);
        console.log("OPCIONES COUNT:", res[1].options.length);
        res[1].options.forEach(o => console.log(`  ${o.label}) ${o.text}`));
    }
}
