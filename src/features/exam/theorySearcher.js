// theorySearcher.js — Búsqueda de párrafo relevante por TF simple

// Stopwords en español: palabras sin valor semántico que ignoramos
const STOPWORDS = new Set([
    'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde', 'durante',
    'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'es', 'esa', 'ese', 'eso', 'esta',
    'este', 'esto', 'fue', 'ha', 'han', 'hacia', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo',
    'los', 'me', 'mi', 'mis', 'muy', 'no', 'nos', 'o', 'para', 'pero', 'por', 'que', 'quien',
    'quienes', 'se', 'si', 'sin', 'son', 'su', 'sus', 'te', 'ti', 'todo', 'tras', 'tu', 'tus',
    'un', 'una', 'unas', 'uno', 'unos', 'y', 'ya', 'yo', 'más', 'cual', 'cuales', 'como', 'hace',
    'ser', 'estar', 'tiene', 'tienen', 'tendrá', 'será', 'sean', 'haya', 'dicha', 'dicho',
    'cuando', 'donde', 'siempre', 'nunca', 'también', 'aunque', 'sino', 'pues', 'así', 'ello',
]);

/**
 * Extrae palabras clave de un texto: palabras > 4 letras no en stopwords.
 */
function extractKeywords(text) {
    return text
        .toLowerCase()
        .replace(/[^a-záéíóúüñ\s]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !STOPWORDS.has(w));
}

/**
 * Divide el texto de teoría en párrafos significativos (mínimo 40 chars).
 */
function splitIntoParagraphs(theoryText) {
    return theoryText
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length >= 40);
}

/**
 * Busca el párrafo más relevante para una pregunta dada.
 * Retorna: { text: string con contexto, keywords: string[], score: number }
 */
export function findRelevantParagraph(theoryText, questionText) {
    if (!theoryText || !questionText) return null;

    const paragraphs = splitIntoParagraphs(theoryText);
    if (paragraphs.length === 0) return null;

    const keywords = extractKeywords(questionText);
    if (keywords.length === 0) return { text: paragraphs[0], keywords: [], score: 0 };

    // Puntuar cada párrafo por cuántas keywords contiene
    const scores = paragraphs.map(para => {
        const paraLower = para.toLowerCase();
        let score = 0;
        const matchedKeywords = [];
        for (const kw of keywords) {
            if (paraLower.includes(kw)) {
                score++;
                if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
            }
        }
        return { score, matchedKeywords };
    });

    // Índice del párrafo con mayor puntuación
    const bestIdx = scores.reduce(
        (maxIdx, s, i) => (s.score > scores[maxIdx].score ? i : maxIdx),
        0
    );

    // Incluir párrafo anterior y siguiente como contexto
    const contextStart = Math.max(0, bestIdx - 1);
    const contextEnd = Math.min(paragraphs.length - 1, bestIdx + 1);
    const contextText = paragraphs.slice(contextStart, contextEnd + 1).join('\n\n');

    return {
        text: contextText,
        keywords: scores[bestIdx].matchedKeywords,
        score: scores[bestIdx].score,
        total: paragraphs.length,
    };
}
