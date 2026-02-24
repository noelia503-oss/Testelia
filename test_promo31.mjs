import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';
const text = fs.readFileSync('/Users/noeliatrujillocarrera/Desktop/APPTEST/TestPDF/Promo 31 plano.txt', 'utf8');
const qs = parseQuestions(text);
console.log(JSON.stringify(qs.slice(0, 2), null, 2));
