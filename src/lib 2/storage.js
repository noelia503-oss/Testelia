import localforage from 'localforage';

// Configuración inicial de la base de datos local
localforage.config({
    name: 'OpositaTest',
    storeName: 'exam_history'
});

export const StorageService = {
    /**
     * Guarda el resultado de un examen finalizado
     */
    async saveExamResult(examData) {
        try {
            const history = await this.getHistory() || [];
            const newEntry = {
                id: new Date().getTime().toString(),
                date: new Date().toISOString(),
                ...examData
            };

            history.push(newEntry);

            // Mantener solo los últimos 50 exámenes para no saturar
            if (history.length > 50) history.shift();

            await localforage.setItem('history', history);
            return history;
        } catch (err) {
            console.error('Error guardando examen:', err);
            return null;
        }
    },

    /**
     * Obtiene todo el historial de exámenes
     */
    async getHistory() {
        try {
            return await localforage.getItem('history');
        } catch (err) {
            console.error('Error obteniendo historial:', err);
            return [];
        }
    },

    /**
     * Borra todo el historial
     */
    async clearHistory() {
        try {
            await localforage.removeItem('history');
            return true;
        } catch (err) {
            return false;
        }
    }
};
