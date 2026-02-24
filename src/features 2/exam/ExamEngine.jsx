import React, { useEffect, useCallback, useMemo } from 'react';

export const ExamEngine = ({
    questions = [],
    mode,
    onFinish,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    setUserAnswers
}) => {
    const [timeLeft, setTimeLeft] = React.useState(questions.length * 60);
    const [isFinished, setIsFinished] = React.useState(false);

    const question = useMemo(() => questions[currentQuestionIndex] || null, [questions, currentQuestionIndex]);

    const handleFinish = useCallback(() => {
        setIsFinished(true);
        let aciertos = 0, fallos = 0, blancos = 0;

        questions.forEach(q => {
            const uA = userAnswers[q.id];
            if (!uA) blancos++;
            else if (uA === q.correctAnswer) aciertos++;
            else fallos++;
        });

        const rawScore = aciertos - (fallos / 3);
        const notaSobre10 = Math.max(0, (rawScore / questions.length) * 10).toFixed(2);
        onFinish({ aciertos, fallos, blancos, notaSobre10 });
    }, [questions, userAnswers, onFinish]);

    useEffect(() => {
        if (mode === 'exam' && !isFinished) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [mode, isFinished, handleFinish]);

    const handleSelectOption = (questionId, optionLabel) => {
        if (isFinished) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: optionLabel }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            window.scrollTo(0, 0);
        }
    };

    if (!question) return <div className="glass-panel">Cargando preguntas del examen...</div>;

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const getOptionClasses = (optLabel) => {
        const uSub = userAnswers[question.id];
        const isSelected = uSub === optLabel;
        let cls = "btn-option exam-option";

        if (mode === 'review' || (mode === 'exam' && isFinished)) {
            const isCorrect = question.correctAnswer === optLabel;
            if (uSub) {
                if (isCorrect) cls += " correct-option";
                else if (isSelected) cls += " incorrect-option";
            }
        } else if (isSelected) {
            cls += " selected-option";
        }
        return cls;
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', width: '100%', textAlign: 'left', minHeight: '520px' }}>
            <div className="exam-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <span className="badge">{mode === 'exam' ? 'Examen Oficial' : 'Repaso'}</span>
                    <span style={{ marginLeft: '1.2rem', fontWeight: 'bold' }}>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                </div>
                {mode === 'exam' && <div className="timer" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft < 300 ? 'var(--color-danger)' : 'inherit' }}>⏱ {formatTime(timeLeft)}</div>}
            </div>

            <div className="question-content">
                <h3 style={{ fontSize: '1.5rem', lineHeight: '1.5', marginBottom: '2.5rem', fontWeight: '500' }}>
                    {question.id}. {question.text}
                </h3>

                <div className="options-grid" style={{ display: 'grid', gap: '1.2rem' }}>
                    {question.options.map(opt => (
                        <button
                            key={opt.label}
                            className={getOptionClasses(opt.label)}
                            onClick={() => handleSelectOption(question.id, opt.label)}
                            style={{ padding: '1.2rem', fontSize: '1.1rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start' }}
                        >
                            <span className="opt-label" style={{ fontWeight: '900', marginRight: '1.5rem', minWidth: '25px', display: 'inline-block' }}>{opt.label}.</span>
                            <span>{opt.text}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="exam-navigation" style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    className="btn btn-secondary"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    style={{ minWidth: '120px' }}
                >
                    Anterior
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                    <button className="btn btn-primary btn-large shadow-lg" onClick={handleFinish} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                        Finalizar y Corregir
                    </button>
                ) : (
                    <button className="btn btn-primary btn-large shadow-lg" onClick={nextQuestion} style={{ minWidth: '160px' }}>
                        Siguiente »
                    </button>
                )}
            </div>
        </div>
    );
};
