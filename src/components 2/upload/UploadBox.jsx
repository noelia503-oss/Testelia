import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractTextFromFile, parseQuestionsFromText } from '../../features/parser/pdfParser';
import './UploadBox.css';

export const UploadBox = ({ onParsed }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = async (file) => {
        if (!file) return;

        const validTypes = ['application/pdf', 'text/plain'];
        const isPages = file.name.toLowerCase().endsWith('.pages');

        if (!validTypes.includes(file.type) && !isPages) {
            setStatus('error');
            setErrorMsg('Por favor, selecciona un archivo válido (.pdf, .pages, .txt).');
            return;
        }

        setStatus('processing');
        try {
            const rawText = await extractTextFromFile(file);
            const parsedData = parseQuestionsFromText(rawText);
            console.log('Extracted Text Preview:', rawText.substring(0, 500) + '...');
            setStatus('success');
            setTimeout(() => {
                onParsed(parsedData, rawText);
                setStatus('idle');
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Error al procesar el documento.');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    return (
        <div
            className={`upload-box glass-panel ${isDragging ? 'dragging' : ''} status-${status}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept=".pdf,.pages,.txt"
                onChange={handleFileInput}
                id="file-upload"
                className="hidden-input"
            />
            <label htmlFor="file-upload" className="upload-label">
                {status === 'idle' && (
                    <>
                        <UploadCloud size={48} className="upload-icon" />
                        <h3 style={{ marginTop: '1rem' }}>Arrastra tu Test aquí (PDF, Pages o TXT)</h3>
                        <p className="text-muted">o haz clic para explorar tus archivos</p>
                    </>
                )}
                {status === 'processing' && (
                    <div className="processing-state">
                        <div className="spinner"></div>
                        <h3>Analizando Documento...</h3>
                        <p className="text-muted">Extrayendo preguntas y respuestas mágicamente</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="success-state animate-fade-in">
                        <CheckCircle2 size={48} color="var(--color-success)" />
                        <h3>¡Análisis Completado!</h3>
                        <p className="text-muted">Preparando el motor de examen</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="error-state animate-fade-in">
                        <AlertCircle size={48} color="var(--color-danger)" />
                        <h3>Error en la lectura</h3>
                        <p className="text-muted">{errorMsg}</p>
                        <span className="btn-retry mt-4">Intentar de nuevo</span>
                    </div>
                )}
            </label>
        </div>
    );
};
