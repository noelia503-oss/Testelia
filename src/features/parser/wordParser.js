import mammoth from 'mammoth';

export const parseWord = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (e) {
        console.error("Error al leer el Word:", e);
        throw new Error("No se pudo leer el archivo Word.");
    }
};

export const parseWordToHtml = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result.value;
    } catch (e) {
        console.error("Error al convertir Word a HTML:", e);
        throw new Error("No se pudo convertir el Word a formato visual.");
    }
};
