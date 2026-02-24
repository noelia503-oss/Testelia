import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extrae texto de archivos PDF, Pages (Apple) o TXT.
 */
export const extractTextFromFile = async (file) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
        return await file.text();
    }

    try {
        let arrayBuffer = await file.arrayBuffer();

        if (fileName.endsWith('.pages')) {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);
            const pdfFile = zipContent.file('QuickLook/Preview.pdf') || zipContent.file('preview.pdf');
            if (!pdfFile) {
                throw new Error("El archivo Pages no tiene vista previa. Expórtalo a PDF.");
            }
            arrayBuffer = await pdfFile.async('arraybuffer');
        }

        const pdfDocument = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join('\n'); // Mantener \n para estructura vertical
            fullText += pageText + '\n\n';
        }
        return fullText;
    } catch (error) {
        console.error('Error en extracción:', error);
        throw new Error(error.message || 'Error al leer el archivo.');
    }
};

/**
 * Algoritmo de reconocimiento de patrones para preguntas y respuestas.
 */
export const parseQuestionsFromText = (text) => {
    console.log("Iniciando análisis profundo...");

    // 1. EXTRAER SOLUCIONES AUTOMÁTICAS
    const solutionsMap = {};
    // Buscamos patrones como "1-A", "1. A", "1 A", "1:A"
    const generalSolRegex = /(?:^|\b)(R?\d+)\s*[\-\.:\s]\s*([A-Da-d])\b/g;
    let solMatch;
    while ((solMatch = generalSolRegex.exec(text)) !== null) {
        const qId = solMatch[1].toUpperCase();
        const ans = solMatch[2].toUpperCase();
        // Solo guardamos si no tenemos ya una solución (los últimos del documento suelen ser la clave)
        solutionsMap[qId] = ans;
    }

    // 2. EXTRAER PREGUNTAS
    const questions = [];
    // Buscamos números al inicio de bloque seguidos de texto y luego opciones a) b) c) d)
    // Usamos una regex que busque el número de pregunta
    const questionSplitRegex = /(?:\n|^)\s*(\d+)\s*[\.\-]\s+/g;
    let match;
    const splitIndices = [];
    while ((match = questionSplitRegex.exec(text)) !== null) {
        splitIndices.push({
            index: match.index,
            id: match[1],
            fullMatch: match[0]
        });
    }

    let lastId = 0;
    let isReserva = false;

    for (let i = 0; i < splitIndices.length; i++) {
        const start = splitIndices[i].index;
        const end = splitIndices[i + 1] ? splitIndices[i + 1].index : text.length;
        const block = text.substring(start, end);

        let currentIdNum = parseInt(splitIndices[i].id, 10);
        if (currentIdNum < lastId) isReserva = true;
        lastId = currentIdNum;

        const displayId = isReserva ? `R${currentIdNum}` : String(currentIdNum);

        // Limpiar el texto de la pregunta (lo que hay antes de la primera opción A)
        const qTextMatch = block.match(/(?:\d+)\s*[\.\-]\s+(.*?)(?=\s*[A-Da-d]\s*[\.\)])/is);
        if (!qTextMatch) continue;

        const qText = qTextMatch[1].trim().replace(/\s{2,}/g, ' ');

        // Extraer opciones
        const options = [];
        const optRegex = /\s*([A-Da-d])\s*[\.\)]\s*(.*?)(?=\s*[A-Da-d]\s*[\.\)]|$)/gis;
        let optMatch;
        const optionsPart = block.substring(qTextMatch[0].length);

        while ((optMatch = optRegex.exec(optionsPart)) !== null) {
            options.push({
                label: optMatch[1].toUpperCase(),
                text: optMatch[2].trim().replace(/\s{2,}/g, ' ')
            });
        }

        if (options.length >= 2) {
            questions.push({
                id: displayId,
                text: qText,
                options: options,
                correctAnswer: solutionsMap[displayId.toUpperCase()] || null
            });
        }
    }

    console.log(`Análisis finalizado: ${questions.length} preguntas encontradas.`);
    return {
        questions,
        count: questions.length
    };
};
