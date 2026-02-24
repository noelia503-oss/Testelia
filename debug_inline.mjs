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

3. Como resultado de los planes de auditoría, las directrices dictadas por la presidencia: 
a) En ningún caso serán vinculantes. 
+b) Serán en todo caso, de obligado cumplimiento. 
c) Serán de obligado cumplimiento siempre que los planes estén referidos a un determinado tipo de actividad. 
d) Serán de obligado cumplimiento siempre que vayan dirigidas a un responsable concreto.

4. La presidencia de la autoridad vasca de protección de datos tendrá la consideración de alto cargo, asimilado al de: 
a) Consejero o consejera. 
+b) Viceconsejero o viceconsejera. 
c) Director o directora. 
d) Vicepresidente o vicepresidenta.

5. Según el art. 3, ¿cómo se relaciona la Autoridad Vasca de Protección de Datos con el Gobierno Vasco? 
a) A través del departamento competente en materia de justicia. 
b) A través de departamento competente en materia de administraciones públicas. 
c) A través del servicio jurídico central del Gobierno Vasco. 
+d) A través del departamento que determine el lehendakari o la lehendakari en el decreto de áreas.`;

const res = parseQuestions(mockText);
console.log(JSON.stringify(res, null, 2));
