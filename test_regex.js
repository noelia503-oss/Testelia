const text = `TEST 1\nRespecto al consejo consultivo de la autoridad vasca de protección de datos, es cierto que: +a) En el consejo habrá una persona representante de las personas consumidoras y usuarias, designada por Kontsumobide. b) Se procurará que la composición del consejo consultivo tenga representación equilibrada entre mujeres y hombres. c) En todo caso, los acuerdos adoptados por el consejo consultivo tendrán carácter vinculante. d) En el consejo habrá una persona en representación de los tres territorios vascos.\n\nLa propuesta del Gobierno Vasco al Parlamento Vasco...`;

let block = text.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE)\s*[^\n]*\r?\n?/gmi, '').trim();

console.log("BLOCK AFTER CLEANUP:\n", block);
