import fs from 'fs';

const mockText = `De acuerdo con el Convenio Europeo de Derechos Humanos, toda persona acusada tiene, como mínimo, los siguientes derechos: a) A ser informada, en el más breve plazo, en una lengua que comprenda y detalladamente, de la naturaleza y de la causa de la acusación formulada contra ella. b) A disponer del tiempo y de las facilidades necesarias para la preparación de su defensa. c) A defenderse por sí misma o ser asistida por un defensor o defensora de su elección y, si no tiene medios para pagarle, poder recibir asistencia gratuita por un abogado o abogada de oficio cuando los intereses de la justicia lo exijan. +d) Todas son verdaderas.

Las medidas que planteen un tratamiento diferente para las mujeres y los hombres: a) Se considerarán constitutivas de discriminación directa por razón de sexo, en todo caso. b) Se considerarán constitutivas de discriminación indirecta por razón de sexo, en todo caso. c) Se considerarán constitutivas de discriminación directa o indirecta por razón de sexo, según los casos. +d) No se considerarán constitutivas de discriminación por razón de sexo si tienen una justificación objetiva y razonable.`;

const parseQuestions = (text) => {
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) blocks = [text];
    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block) => {
        if (!block.trim()) return;
        let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);
        if (questionBlocks.length <= 2) {
            questionBlocks = block.split(/\n\s*\n/);
        }

        questionBlocks.forEach(qBlock => {
            if (!qBlock.trim()) return;
            let qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
            if (!qMatch) {
                const noNumMatch = qBlock.match(/^\s*([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
                if (noNumMatch) qMatch = [noNumMatch[0], globalCounter++, noNumMatch[1]];
            }

            if (qMatch) {
                const qText = qMatch[2].trim();
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|\n\s*\n|$)/gi;
                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                const options = [];
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    options.push(optMatch[3].trim());
                }
                finalQuestions.push({ id: qMatch[1], text: qText.substring(0, 50), optsCount: options.length, firstOpt: options[0]?.substring(0, 30) });
            }
        });
    });
    return finalQuestions;
};

const qs = parseQuestions(mockText);
console.log(`Total Extraidas: ${qs.length}`);
console.log(JSON.stringify(qs, null, 2));
