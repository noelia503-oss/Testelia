import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const parsePDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            let pageText = "";
            let lastItem = null;

            for (const item of textContent.items) {
                if (lastItem) {
                    const diffY = Math.abs(item.transform[5] - lastItem.transform[5]);
                    // Detectamos salto de línea vertical
                    if (diffY > 5) {
                        pageText += "\n";
                    } else {
                        // Detectamos espacios horizontales evaluando la distancia (si es mayor al 20% del ancho de fuente)
                        const expectedNextX = lastItem.transform[4] + lastItem.width;
                        const distance = item.transform[4] - expectedNextX;
                        const fontSize = Math.abs(item.transform[0]) || 10;

                        if (distance > (fontSize * 0.2) && !pageText.endsWith(" ")) {
                            pageText += " ";
                        }
                    }
                }
                pageText += item.str;
                lastItem = item;
            }
            fullText += pageText + "\n";
        }

        // --- LIMPIADORES VISUALES POST-EXTRACCIÓN ---
        // 1. Limpieza de artefactos clásicos de espaciado
        fullText = fullText.replace(/(\d+)\s+([.\-])/g, "$1$2");  // 1 . -> 1.
        fullText = fullText.replace(/([A-D])\s+\)/gi, "$1)");    // A ) -> A)

        // 2. Corrección de ligaduras dañadas o rotas características en fuentes de exámenes oficiales
        fullText = fullText.replace(/v[ií]\s*c\s*[:J]\s*mas/gi, "víctimas");
        fullText = fullText.replace(/v[ií]c\s*[:J]\s*mas/gi, "víctimas");
        fullText = fullText.replace(/administrati\s*[:J]\s*va/gi, "administrativa");
        fullText = fullText.replace(/\b([a-z]+)\s*[:J]\s*vidad\b/gi, "$1tividad"); // ac J vidad -> actividad
        fullText = fullText.replace(/\b[:J]\s*po\b/gi, "tipo"); // J po -> tipo
        fullText = fullText.replace(/f[ií]\s*cas\b/gi, "físicas"); // fi cas -> físicas
        fullText = fullText.replace(/ob\s*je\s*[:J]\s*vo\b/gi, "objetivo");

        // Normalización de espacios
        fullText = fullText.replace(/ +/g, " ");

        return fullText;
    } catch (e) {
        console.error("Error al leer el PDF:", e);
        throw new Error("No se pudo leer el archivo PDF.");
    }
};

/**
 * Extracción ligera de texto para PDFs de TEORÍA.
 * A diferencia de parsePDF, no aplica limpiadores de preguntas y
 * preserva la estructura de párrafos con dobles saltos de línea.
 * Mucho más rápida para PDFs grandes de temario.
 */
export const parsePDFLight = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            let pageText = "";
            let lastY = null;

            for (const item of textContent.items) {
                if (!item.str.trim()) continue;
                const currentY = item.transform[5];
                if (lastY !== null && Math.abs(currentY - lastY) > 8) {
                    // Nuevo bloque de texto (salto de línea real)
                    pageText += "\n";
                } else if (pageText.length > 0 && !pageText.endsWith(" ")) {
                    pageText += " ";
                }
                pageText += item.str;
                lastY = currentY;
            }

            if (pageText.trim()) {
                fullText += pageText.trim() + "\n\n"; // Doble salto entre páginas
            }
        }

        return fullText.trim();
    } catch (e) {
        console.error("Error al leer el PDF de teoría:", e);
        throw new Error("No se pudo leer el PDF de teoría.");
    }
};

export const parseQuestions = (text) => {
    console.log("Iniciando extracción multi-test de alto rendimiento...");

    // INYECCIÓN DE SEGURIDAD: Forzar \n antes de preguntas numeradas SOLO si el texto no tiene saltos de línea.
    // En PDFs exportados como línea única gigante, esto nos permite splitear correctamente.
    // En archivos TXT (que ya tienen \n) NO aplicamos esto: causaría falsos cortes en texto legal
    // tipo "artículo 9. De la ley" → "artículo\n9. De la ley" que rompería el parser.
    if (!text.includes('\n')) {
        text = text.replace(/(\S)\s+(?=\b\d{1,3}\s*[\.\-\)]\s+[A-Z¿¡])/g, "$1\n");
    }

    // Si el documento TIENE un apartado de soluciones al final explícito, lo procesamos como multi-bloque.
    // Si NO lo tiene (formato con respuestas marcadas in-line como +a), asumimos todo el texto como un único bloque.
    let blocks = text.split(/(?=✅?\s*SOLUCIONES)/i);
    if (blocks.length === 1 && !/SOLUCIONES/i.test(text)) {
        console.log("No detectado bloque de soluciones. Activando modo de extracción In-Line directo.");
        blocks = [text]; // El documento entero es un solo bloque de test
    } else {
        console.log(`Detectados ${blocks.length} posibles bloques de test/soluciones.`);
    }

    const finalQuestions = [];
    let globalCounter = 1;

    blocks.forEach((block, index) => {
        if (!block.trim()) return;

        // 0. Pre-limpieza agresiva e inteligente para erradicar cabeceras tipo "TEST 1" o "PROMOCION 30"
        // Capta múltiples configuraciones comunes tras exportar sin formato en MacOS.
        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*[^\n]*\r?\n?/gmi, '').trim();
        // Limpieza secundaria para casos residuales pegados
        block = block.replace(/^(?:TEST|TEMA|SIMULACRO|BLOQUE|EXAMEN|PROMOCION|PROMO|MODELO|EJERCICIO|CUESTIONARIO)\s*\d*\s*-?\s*/gmi, '').trim();

        // 1. Extraer soluciones de ESTE bloque específico (si hubiese tabla al final)
        const solutionsMap = {};
        const solRegex = /(\d+)\s*[\-\.]\s*([a-dA-D])/g;
        let solMatch;
        while ((solMatch = solRegex.exec(block)) !== null) {
            solutionsMap[solMatch[1]] = solMatch[2].toLowerCase();
        }

        // 2. Extraer las preguntas de este bloque
        // Forzamos que la pregunta empiece después de un salto de línea (\n) O al principio absoluto del documento (^).
        // Captura secuencias "1. ", "2.-" ...
        let questionBlocks = block.split(/(?=(?:^|\n)\s*\b\d+\s*[\.\-\)]\s+)/);

        // Si no detectó numeración REAL (los bloques deben empezar con dígitos de pregunta),
        // caemos al split heurístico por párrafos (líneas en blanco).
        // Comprobamos el 2.º bloque porque el 1.º puede ser vacío.
        const hasRealNumbers = questionBlocks.length > 2 &&
            questionBlocks.slice(1).some(qb => /^\s*\d+\s*[.\-\)]\s+/.test(qb));

        if (!hasRealNumbers) {
            console.log("No se detectó numeración secuencial real. Aplicando partición por párrafos.");
            const normalizedBlock = block.replace(/\n{2,}/g, '\n\n');
            questionBlocks = normalizedBlock.split(/\n\n/).filter(qb => qb.trim());
        }

        questionBlocks.forEach(qBlock => {
            // Match para atrapar el ID y todo el texto del Enunciado de la pregunta (numerada).
            let qMatch = qBlock.match(/(?:^|\n)\s*(\d+)\s*(?:[\.\-\)]\s*)+([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);

            // Salvavidas para preguntas sin numerar (párrafo limpio seguido de opciones a-d)
            if (!qMatch) {
                // +? para garantizar que el enunciado nunca sea una cadena vacía.
                // \b[a-dA-D] captura CUALQUIER opción (a, b, c o d), no solo la A.
                const noNumMatch = qBlock.match(/^\s*([\s\S]+?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$))/i);
                if (noNumMatch && noNumMatch[1].trim()) {
                    qMatch = [noNumMatch[0], null, noNumMatch[1]];
                }
            }

            if (qMatch) {
                // Si el Regex primario falló y usamos el secundario (noNumMatch), qMatch[1] será null, por lo que usamos el contador global SIN incrementarlo aquí (se incrementa abajo al hacer push).
                const originalId = qMatch[1] ? qMatch[1].trim() : globalCounter.toString();
                let qText = qMatch[2].trim();

                const options = [];
                let inlineCorrectAnswerIndex = null;

                // Extraemos las opciones, buscando un marcador opcional (+, *, ✅) al principio como "+a)" o "+ a)"
                // Restaurado el \b para evitar que palabras terminadas en "a." como "actividad." rompan el parseo interpretándose como opciones.
                // NUEVO: Agregado \n\n al Lookahead. Si se detecta un doble salto de línea (párrafo vacío), la opción SE CORTA en seco. Esto evita que la D) se trague la siguiente pregunta en textos exportados sin números.
                const optRegex = /(?:([\*\+✅])\s*)?\b([a-dA-D])\s*[\)\.]([\s\S]*?)(?=(?:[\*\+✅]\s*)?\n?\s*\b[a-dA-D]\s*[\)\.](?:\s|$)|\n\s*\n|$)/gi;

                const remainingBlock = qBlock.substring(qMatch[0].length);
                let optMatch;
                let optIndex = 0;
                while ((optMatch = optRegex.exec(remainingBlock)) !== null) {
                    const marker = optMatch[1];
                    const label = optMatch[2].toLowerCase();
                    const text = optMatch[3].trim();

                    options.push({
                        id: optIndex.toString(), // ID ÚNICA en base al orden (0, 1, 2)
                        label: label,
                        text: text
                    });

                    // Si esta opción tiene el marcador, guardamos su ÍNDICE NUMÉRICO
                    if (marker) {
                        inlineCorrectAnswerIndex = optIndex.toString();
                    }
                    optIndex++;
                }

                if (options.length > 0) {
                    // Convertimos la letra (ej 'b') a su índice correspondiente ('1') para fallback
                    let fallbackIndex = null;
                    if (solutionsMap[originalId]) {
                        const letter = solutionsMap[originalId].toLowerCase();
                        if (letter === 'a') fallbackIndex = '0';
                        if (letter === 'b') fallbackIndex = '1';
                        if (letter === 'c') fallbackIndex = '2';
                        if (letter === 'd') fallbackIndex = '3';
                    }

                    finalQuestions.push({
                        id: globalCounter.toString(), // ID global secuencial fusionado
                        originalId: originalId, // Guardamos el ID original por depuración
                        text: qText || "Elige la opción correcta:",
                        options,
                        // Damos prioridad al marcador en línea sobre la tabla del final usando Índices
                        correctAnswer: inlineCorrectAnswerIndex || fallbackIndex || null
                    });
                    globalCounter++;
                }
            }
        });
    });

    console.log(`Macro-examen generado con éxito. ${finalQuestions.length} preguntas unidas secuencialmente.`);
    return finalQuestions;
};
