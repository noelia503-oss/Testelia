import React from 'react';
import { ChevronRight, ChevronLeft, Check, X, CheckCircle } from 'lucide-react';
import { TheoryDrawer } from './TheoryDrawer';

export const ExamEngine = ({
    questions,
    currentIdx,
    setCurrentIdx,
    answers,
    setAnswers,
    onFinish,
    theoryText = null,
    pdfUrl = null,
    pdfBlob = null, // Added pdfBlob prop
}) => {
    const question = questions[currentIdx];
    const total = questions.length;

    if (!question) return null;

    const handleSelect = (idx) => {
        if (answers[currentIdx]) return;
        setAnswers(prev => ({ ...prev, [currentIdx]: idx }));
    };

    const userAns = answers[currentIdx];

    const getOptionStyle = (optIdx) => {
        const isCorrectOption = optIdx === (question.correctAnswer || '').toString();
        const isSelectedOption = userAns === optIdx;

        const isLight = document.body.classList.contains('light-theme');
        const base = {
            width: '100%',
            textAlign: 'left',
            borderRadius: '12px',
            background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
            cursor: userAns ? 'default' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.94rem',
            lineHeight: '1.5',
            color: 'var(--color-text)',
            outline: 'none',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '1rem 1.25rem',
        };

        if (!userAns) return base;

        // Correcta
        if (isCorrectOption) return {
            ...base,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#4ade80',
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.1)'
        };
        // Elegida incorrectamente
        if (isSelectedOption) return {
            ...base,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
        };
        // Resto apagadas
        return { ...base, opacity: 0.4, border: '1px solid rgba(255, 255, 255, 0.05)' };
    };

    const handleNext = () => {
        if (currentIdx < total - 1) {
            setCurrentIdx(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const progress = ((currentIdx + 1) / total) * 100;

    return (
        <>
            <main style={{ maxWidth: '860px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Barra de Progreso */}
                <div style={{ width: '100%', height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${progress}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        borderRadius: '99px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {/* Tarjeta de Pregunta */}
                <div key={currentIdx} style={{
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden',
                    boxShadow: document.body.classList.contains('light-theme')
                        ? '0 10px 30px rgba(0, 0, 0, 0.05)'
                        : '0 20px 50px rgba(0, 0, 0, 0.3)',
                }}>
                    {/* Cabecera de la Pregunta */}
                    <div style={{ padding: '2rem 2.25rem' }}>
                        <h3 style={{
                            fontSize: '1.15rem',
                            lineHeight: '1.7',
                            fontWeight: '500',
                            color: 'var(--color-text)',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            letterSpacing: '-0.01em'
                        }}>
                            {question.text}
                        </h3>
                    </div>

                    {/* Opciones */}
                    <div style={{ padding: '0 2.25rem 2.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {question.options.map((opt, optIdx) => {
                            const isSelected = userAns === opt.id;
                            const isCorrectOption = opt.id === (question.correctAnswer || '').toString();
                            const style = getOptionStyle(opt.id);

                            return (
                                <button
                                    key={opt.id}
                                    style={style}
                                    onClick={() => handleSelect(opt.id)}
                                    disabled={!!userAns}
                                >
                                    {/* Badge de letra */}
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                        marginRight: '0.85rem', fontSize: '0.8rem', fontWeight: '700',
                                        background: userAns
                                            ? (isCorrectOption ? 'rgba(34, 197, 94, 0.2)' : isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)')
                                            : 'rgba(255,255,255,0.1)',
                                        color: userAns
                                            ? (isCorrectOption ? '#4ade80' : isSelected ? '#f87171' : '#64748b')
                                            : '#94a3b8',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s ease',
                                        lineHeight: '1',
                                    }}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span style={{ flex: 1, color: 'var(--color-text)' }}>{opt.text}</span>
                                    {userAns && isCorrectOption && <Check size={18} color="#16a34a" strokeWidth={2.5} style={{ marginLeft: '0.75rem', flexShrink: 0 }} />}
                                    {userAns && isSelected && !isCorrectOption && <X size={18} color="#dc2626" strokeWidth={2.5} style={{ marginLeft: '0.75rem', flexShrink: 0 }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Aviso si no hay respuesta correcta en el PDF */}
                    {userAns && !question.correctAnswer && (
                        <div style={{ margin: '0 1.75rem 1rem', padding: '0.75rem 1rem', background: '#fffbeb', color: '#92400e', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
                            ⚠️ No se encontró la solución automática para esta pregunta.
                        </div>
                    )}

                    {/* Botones de navegación */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 2.25rem 1.5rem',
                        borderTop: '1px solid var(--glass-border)',
                    }}>
                        <button
                            onClick={handlePrev}
                            disabled={currentIdx === 0}
                            style={{
                                background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)',
                                boxShadow: currentIdx === 0 ? 'none' : '0 0 12px rgba(59, 130, 246, 0.25)',
                                padding: '10px 16px', borderRadius: '10px',
                                cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                color: 'var(--color-text)',
                                opacity: currentIdx === 0 ? 0.3 : 0.9,
                                fontSize: '0.85rem', fontWeight: '500',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <ChevronLeft size={16} /> Anterior
                        </button>

                        <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '800' }}>
                            {currentIdx + 1} / {total}
                        </div>

                        {currentIdx < total - 1 ? (
                            <button
                                onClick={handleNext}
                                style={{
                                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
                                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)',
                                    padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    color: 'var(--color-text)',
                                    opacity: 0.9,
                                    fontSize: '0.85rem', fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        ) : (
                            <div style={{ width: '110px' }} />
                        )}
                    </div>

                    {/* Botón Finalizar siempre visible */}
                    <div style={{ padding: '0 2.25rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={onFinish}
                            style={{
                                background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)',
                                padding: '8px 24px', borderRadius: '10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '0.8rem', color: '#22c55e', fontWeight: '500',
                                transition: 'all 0.2s ease',
                                opacity: 0.7,
                            }}
                        >
                            <CheckCircle size={14} /> Finalizar Test
                        </button>
                    </div>
                </div>
            </main>

            {/* Cajón de teoría desplegable */}
            <TheoryDrawer
                theoryText={theoryText}
                questionText={question.text}
                pdfUrl={pdfUrl}
                pdfBlob={pdfBlob}
            />
        </>
    );
};
