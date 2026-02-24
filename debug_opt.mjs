import fs from 'fs';
const text = fs.readFileSync('TestPDF/Promociones/promo 29 plano.txt', 'utf8');
import { parseQuestions } from './src/features/parser/pdfParser.js';
const res = parseQuestions(text);
if(res.length > 0) {
    console.log("P1 Q:", res[0].text);
    console.log("P1 OPTIONS COUNT:", res[0].options.length);
    res[0].options.forEach(o => console.log(o.label, o.text));
}
