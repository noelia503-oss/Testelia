import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

const text = fs.readFileSync('TestPDF/Promociones/promo 30 plano.txt', 'utf8');
const qs = parseQuestions(text);
console.log("Total preguntas extridas:", qs.length);
if(qs.length > 0) {
  console.log("--- Q1 TEXT ---");
  console.log(qs[0].text);
  console.log("--- Q1 OPTIONS ---");
  console.log(qs[0].options);
}
