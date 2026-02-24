import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

const mockText = fs.readFileSync('TestPDF/Tema 5.txt', 'utf8');
const qs = parseQuestions(mockText);
console.log(`Total Extraidas: ${qs.length}`);
console.log(JSON.stringify(qs.slice(0,3), null, 2));
