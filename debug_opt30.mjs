import fs from 'fs';
const text = fs.readFileSync('TestPDF/Promociones/promo 30 plano.txt', 'utf8');
import { parseQuestions } from './src/features/parser/pdfParser.js';
const res = parseQuestions(text);
if(res.length > 0) {
    console.log("P1 Q:", res[0].text);
    console.log("P1 OPTIONS COUNT:", res[0].options.length);
    res[0].options.forEach(o => console.log(o.label, "=>", o.text.substring(0, 30)));
    
    console.log("\nP2 Q:", res[1].text);
    console.log("P2 OPTIONS COUNT:", res[1].options.length);
    if(res[1].options.length > 0) {
       res[1].options.forEach(o => console.log(o.label, "=>", o.text.substring(0, 30)));
    }
}
