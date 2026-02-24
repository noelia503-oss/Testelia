import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

const fullText = fs.readFileSync('debug_output.txt', 'utf8');
const qs = parseQuestions(fullText);
qs.forEach(q => {
    console.log(`Q${q.id} text length: ${q.text.length}, options: ${q.options.length}`);
});
