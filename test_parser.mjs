import fs from 'fs';

const text = `
1. De acuerdo con el artículo 43 de la Ley Orgánica 10/2022, ¿a qué tendrán derecho las víctimas de violencias sexuales? (Art. 43.3):
a) A ser atendidas por personal expresamente formado en materia de género y violencias sexuales.
b) A pleno respeto a su dignidad.
c) A la protección de sus datos personales.
d) Todas son correctas.

2. Señale la opción INCORRECTA. Las medidas de protección integral y de prevención estarán encaminadas a la consecución de:
a) Garantizar la autonomía económica de las víctimas con el fin de facilitar su empoderamiento y recuperación integral.
b) Establecer un sistema integral de tutela constitucional en el que la Administración General del Estado, a través de la Delegación del Gobierno contra la violencia de género, en colaboración con el servicio estatal de violencia sobre la mujer....
c) Mejorar la investigación...
d) Garantizar los derechos...

✅ SOLUCIONES AL TEST

1-d, 2-b
`;

export const parseQuestions = (text) => {
    const questions = [];

    // 1. Extraer el bloque de soluciones
    const solutionsMap = {};
    const solRegex = /(\d+)\s*[\-\.]\s*([a-dA-D])/g;
    let solMatch;
    while ((solMatch = solRegex.exec(text)) !== null) {
        solutionsMap[solMatch[1]] = solMatch[2].toLowerCase();
    }

    // 2. Normalizar el texto
    const questionBlocks = text.split(/(?=(?:^|\n)\s*\d+\.\s+)/);

    questionBlocks.forEach(block => {
        const qMatch = block.match(/^\s*(\d+)\.\s+(.*?)(?=(?:\n\s*[a-d]\)|\s*[a-d]\)))/is);

        if (qMatch) {
            const id = qMatch[1];
            questions.push({ id });
        }
    });

    return questions;
};

console.log(parseQuestions(text));
