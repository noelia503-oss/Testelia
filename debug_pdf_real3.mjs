import fs from 'fs';
import { parseQuestions } from './src/features/parser/pdfParser.js';

const mockText = `1. Respecto al consejo consultivo de la autoridad vasca de protección de datos, es cierto que: 
+a) En el consejo habrá una persona representante de las personas consumidoras y usuarias, designada por Kontsumobide. 
b) Se procurará que la composición del consejo consultivo tenga representación equilibrada entre mujeres y hombres. 
c) En todo caso, los acuerdos adoptados por el consejo consultivo tendrán carácter vinculante. 
d) En el consejo habrá una persona en representación de los tres territorios vascos.

2. La propuesta del Gobierno Vasco al Parlamento Vasco de la persona idónea para presidir la Autoridad deberá ser aprobada por: 
a) Mayoría simple del pleno del Parlamento Vasco. 
b) Mayoría absoluta del pleno del Parlamento Vasco. 
c) Mayoría simple de la comisión competente del Parlamento Vasco. 
+d) Mayoría absoluta de la comisión competente del Parlamento Vasco.
`;

const res = parseQuestions(mockText);
console.log(JSON.stringify(res, null, 2));
