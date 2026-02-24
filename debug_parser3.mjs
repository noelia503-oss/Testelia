import fs from 'fs';
const mockText = fs.readFileSync('TestPDF/Promociones/promo 29 plano.txt', 'utf8');
import { parseQuestions } from './src/features/parser/pdfParser.js';
const processed = parseQuestions(mockText);
if(processed.length>0) {
	console.log(`P1 ID: ${processed[0].id}`);
	console.log(`P1 TEXTO: ${processed[0].text}`);
	console.log(`P1 OPCIONES: ${processed[0].options.length}`);
} else {
	console.log("No questions matched.");
}
