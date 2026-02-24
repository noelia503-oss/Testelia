import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

const text = fs.readFileSync('./src/test-sample.pdf.txt', 'utf8');
const questions = parseQuestions(text);
console.log(JSON.stringify(questions.map(q => ({id: q.id, text: q.text})), null, 2));
