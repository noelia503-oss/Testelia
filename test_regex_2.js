const text = `TEST 1
Respecto al consejo consultivo de la autoridad vasca de protección de datos, es cierto que: +a) En el consejo...

TEST 2
De conformidad con el artículo dos de la Ley...`;

let block = text;
// Nueva regex agresiva: busca TEST/TEMA/SIMULACRO/BLOQUE seguido de números, 
// y posibles espacios/saltos de línea. Lo busca al principio de CADA bloque particionado.
// Para asegurarnos, lo ejecutamos sobre TODO el rawText primero.
block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN)\s*\d*\s*-?\s*\r?\n?/gmi, '').trim();
// Limpieza secundaria por si quedó pegado: "TEST 1Respecto" -> "Respecto"
block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN)\s*\d*\s*-?\s*/gmi, '').trim();

console.log("AFTER CLEANUP:");
console.log(block);
