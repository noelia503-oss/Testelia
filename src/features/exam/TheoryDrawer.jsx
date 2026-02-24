import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, X, ChevronRight } from 'lucide-react';
import { findRelevantParagraph } from './theorySearcher';

/**
 * Highlight keywords in a paragraph text with high contrast.
 */
function HighlightedText({ text, keywords }) {
    if (!keywords || keywords.length === 0) return <>{text}</>;

    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} style={{
                        background: '#fef08a', color: '#1a1a1a',
                        borderRadius: '2px', padding: '0 3px',
                        fontWeight: '600'
                    }}>
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export function TheoryDrawer({ theoryText, questionText, pdfUrl = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [viewMode, setViewMode] = useState('text'); // 'text' | 'pdf'
    const drawerRef = useRef(null);

    // Reset when changing question
    useEffect(() => {
        setResult(null);
    }, [questionText]);

    const handleToggle = () => {
        if (!isOpen && !result) {
            setIsSearching(true);
            setTimeout(() => {
                const found = findRelevantParagraph(theoryText, questionText);
                setResult(found);
                setIsSearching(false);
                setIsOpen(true);
            }, 50);
        } else {
            setIsOpen(prev => !prev);
        }
    };

    if (!theoryText && !pdfUrl) return null;

    return (
        <>
            {/* Botón elegante integrado en el navbar */}
            <button
                onClick={handleToggle}
                style={{
                    position: 'fixed',
                    top: '0',
                    right: '80px',
                    height: '50px',
                    zIndex: 1001,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0 0.8rem',
                    background: 'none',
                    color: isOpen ? (document.body.classList.contains('light-theme') ? '#2563eb' : '#ffffff') : 'var(--nav-text)',
                    opacity: isOpen ? 1 : 0.7,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                }}
            >
                <BookOpen size={16} strokeWidth={2} />
                {isSearching ? '...' : (pdfUrl ? 'Material' : 'Explicación')}
                {isOpen && <ChevronRight size={14} style={{ marginLeft: '-2px' }} />}
            </button>

            {/* Backdrop con desenfoque suave */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1005,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}

            {/* PANEL LATERAL (Side Sheet) */}
            <div style={{
                position: 'fixed',
                top: 0, bottom: 0,
                right: 0,
                width: '350px',
                maxWidth: '90vw',
                zIndex: 1010,
                background: 'var(--nav-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '-10px 0 40px rgba(0,0,0,0.2)',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid var(--glass-border)',
            }}>
                {/* Cabecera del Panel */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'rgba(128, 128, 128, 0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={20} color="var(--color-primary)" strokeWidth={2.5} />
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>
                                {viewMode === 'pdf' ? 'Documento PDF' : 'Teoría'}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(128,128,128,0.1)', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text)', padding: '6px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Selector de Modo (Texto / PDF) si hay PDF disponible */}
                {pdfUrl && (
                    <div style={{
                        display: 'flex', padding: '0.5rem 1.5rem',
                        gap: '0.5rem', borderBottom: '1px solid var(--glass-border)',
                        background: 'rgba(128, 128, 128, 0.02)'
                    }}>
                        <button
                            onClick={() => setViewMode('text')}
                            style={{
                                flex: 1, padding: '6px', borderRadius: '8px', border: 'none',
                                fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                                background: viewMode === 'text' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: viewMode === 'text' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Texto
                        </button>
                        <button
                            onClick={() => setViewMode('pdf')}
                            style={{
                                flex: 1, padding: '6px', borderRadius: '8px', border: 'none',
                                fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                                background: viewMode === 'pdf' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: viewMode === 'pdf' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            PDF
                        </button>
                    </div>
                )}

                {/* Contenido con scroll */}
                <div ref={drawerRef} style={{
                    overflowY: 'auto',
                    padding: viewMode === 'pdf' ? '0' : '1.5rem',
                    flex: 1,
                    lineHeight: '1.8',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {viewMode === 'pdf' ? (
                        <iframe
                            src={pdfUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Visor PDF"
                        />
                    ) : (
                        result ? (
                            result.score === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                        No hemos encontrado una coincidencia exacta para esta pregunta, pero aquí tienes el contexto general:
                                    </div>
                                    <p style={{ textAlign: 'left', color: 'var(--color-text)', fontSize: '0.95rem', background: 'rgba(128,128,128,0.05)', padding: '1.25rem', borderRadius: '12px' }}>
                                        {result.text.substring(0, 1000)}...
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    fontSize: '0.95rem',
                                    color: 'var(--color-text)',
                                    whiteSpace: 'pre-wrap',
                                    fontWeight: '400',
                                }}>
                                    <HighlightedText text={result.text} keywords={result.keywords} />
                                </div>
                            )
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
                                <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Buscando en el temario...</div>
                            </div>
                        )
                    )}
                </div>

                {/* Pie del Panel */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'rgba(128, 128, 128, 0.05)',
                }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            width: '100%', padding: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#000000',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            fontWeight: '700', fontSize: '0.85rem',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            outline: 'none',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                        }}
                    >
                        Entendido
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </>
    );
}
