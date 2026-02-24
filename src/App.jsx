import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, CheckCircle, ChevronRight, ChevronLeft, RotateCcw, Folder, FileText, Trash2, Plus, Menu, Sun, Moon, X as CloseIcon } from 'lucide-react';
import { parsePDF, parsePDFLight, parseQuestions } from './features/parser/pdfParser';
import { parseWord } from './features/parser/wordParser';
import { ExamEngine } from './features/exam/ExamEngine';
import localforage from 'localforage';
import './App.css';

// Configuración de base de datos offline
localforage.config({
  name: 'opositatest_library',
  storeName: 'exams'
});

function App() {
  const [mode, setMode] = useState('library'); // 'library', 'upload', 'exam', 'results'
  const [library, setLibrary] = useState([]); // Todos los exámenes guardados
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null); // 'promo' | 'tema'
  const [theme, setTheme] = useState(() => localStorage.getItem('testelia_theme') || 'dark');

  // Estados para el examen activo
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [activeExamTitle, setActiveExamTitle] = useState("");
  const [activeTheoryText, setActiveTheoryText] = useState(null); // Texto de teoría del examen activo
  const [activePDFUrl, setActivePDFUrl] = useState(null); // URL del PDF original si existe

  // Estados de carga y formulario de subida
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTheory, setIsLoadingTheory] = useState(false);
  const [error, setError] = useState(null);
  const [uploadData, setUploadData] = useState({ title: '', promo: '', tema: '', parsedQuestions: [], theoryText: null });

  // Efecto para persistir el tema
  useEffect(() => {
    localStorage.setItem('testelia_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Cargar la biblioteca al iniciar la app
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const savedExams = await localforage.getItem('all_exams');
        if (savedExams) {
          setLibrary(savedExams);
        }
      } catch (err) {
        console.error("Error cargando biblioteca:", err);
      }
    };
    fetchLibrary();
  }, []);

  const triggerUpload = (type) => {
    setUploadType(type);
    document.getElementById('file-input').click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      let text;
      if (file.name.toLowerCase().endsWith('.txt')) {
        let content = await file.text(); // Mantiene decodificación UTF-8 nativa impecable
        // NORMALIZACIÓN MAC-CRUCIAL:
        // Los exportadores de MacOS (Pages) emiten a menudo Carriage Return (\r) puros en vez de Line Feed (\n).
        // Las expresiones regulares de pdfParser.js fallan catastróficamente buscando "^|\n".
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        content = content.replace(/\xA0/g, ' '); // Purga de non-breaking spaces
        text = content;
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        text = await parseWord(file);
      } else {
        text = await parsePDF(file);
      }
      const parsed = parseQuestions(text);
      console.log("🔥 [DEBUG MASTER] Resultado puro del Parser para Pregunta 1: ", JSON.stringify(parsed[0]));
      if (parsed.length === 0) throw new Error("No se detectaron preguntas válidas.");

      // En vez de empezar el examen, vamos a la pantalla de "Guardar"
      setUploadData({
        title: file.name.replace('.pdf', ''),
        promo: uploadType === 'promo' ? 'Nueva Promoción' : 'Temario General',
        tema: uploadType === 'tema' ? 'Nuevo Tema' : 'Test Global',
        parsedQuestions: parsed,
        pdfBlob: file // Guardamos el archivo original
      });
      setMode('upload');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      // Limpiar el input para permitir volver a subir el mismo archivo
      e.target.value = null;
    }
  };

  const saveToLibrary = async (e) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.promo || !uploadData.tema) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const newExam = {
      id: Date.now().toString(),
      title: uploadData.title,
      promo: uploadData.promo,
      tema: uploadData.tema,
      date: new Date().toLocaleDateString(),
      questions: uploadData.parsedQuestions,
      theoryText: uploadData.theoryText || null,
      pdfBlob: uploadData.pdfBlob || null,
    };

    const updatedLibrary = [...library, newExam];

    try {
      await localforage.setItem('all_exams', updatedLibrary);
      setLibrary(updatedLibrary);
      setMode('library');
      setUploadData({ title: '', promo: '', tema: '', parsedQuestions: [], theoryText: null });
    } catch (err) {
      setError("Error al guardar en el dispositivo.");
    }
  };

  const deleteExam = async (id, e) => {
    e.stopPropagation();
    const updated = library.filter(ex => ex.id !== id);
    await localforage.setItem('all_exams', updated);
    setLibrary(updated);
  };

  const startExam = (exam) => {
    setQuestions(exam.questions);
    setActiveExamTitle(exam.title);
    setActiveTheoryText(exam.theoryText || null);

    // Generar URL para el visor PDF si existe el blob
    if (exam.pdfBlob) {
      const url = URL.createObjectURL(exam.pdfBlob);
      setActivePDFUrl(url);
    } else {
      setActivePDFUrl(null);
    }

    setCurrentIdx(0);
    setAnswers({});
    setMode('exam');
  };

  const handleFinish = () => {
    setMode('results');
  };

  const goToPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const goToNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const reset = () => {
    setMode('library');
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setActiveTheoryText(null);
  };

  // Agrupar los exámenes para la vista de biblioteca
  const groupedLibrary = library.reduce((acc, exam) => {
    if (!acc[exam.promo]) acc[exam.promo] = {};
    if (!acc[exam.promo][exam.tema]) acc[exam.promo][exam.tema] = [];
    acc[exam.promo][exam.tema].push(exam);
    return acc;
  }, {});

  return (
    <div className="app-container" style={{ paddingTop: '50px' }}>
      {/* NAVBAR STICKY COMPACTO */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '50px',
        background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 1.25rem', zIndex: 1000,
        boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 1px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', flexShrink: 0 }}>
            {isMenuOpen ? <CloseIcon size={24} color="var(--nav-text)" /> : <Menu size={24} color="var(--nav-text)" />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <h1 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--nav-text)', fontWeight: 'bold' }}>
              Testelia
            </h1>
            {mode === 'exam' && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>
                {activeExamTitle}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
              display: 'flex', alignItems: 'center', color: 'var(--nav-text)',
              opacity: 0.8, transition: 'opacity 0.2s'
            }}
            title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ padding: '0 0.2rem' }}></div>

          {mode === 'library' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('¿Purgar todos los tests de la biblioteca?')) {
                  localforage.clear().then(() => {
                    setLibrary([]);
                  });
                }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#94a3b8' }}
              title="Purgar tests"
            >
              <Trash2 size={18} color="#fca5a5" />
            </button>
          )}
          {mode === 'exam' && (
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <button
                onClick={goToPrev}
                disabled={currentIdx === 0}
                style={{
                  background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: currentIdx === 0 ? 'none' : '0 0 12px rgba(59, 130, 246, 0.25)',
                  padding: '6px', borderRadius: '8px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', color: '#000000',
                  opacity: currentIdx === 0 ? 0.2 : 0.8
                }}
                title="Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div key={`counter - ${currentIdx} `} style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '800', padding: '0 0.8rem', minWidth: '70px', textAlign: 'center' }}>
                {currentIdx + 1} / {questions.length}
              </div>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={goToNext}
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.25)',
                    padding: '6px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', color: '#000000',
                    opacity: 0.8
                  }}
                  title="Siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)',
                    padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#166534',
                    fontWeight: 'bold'
                  }}
                  title="Finalizar"
                >
                  <CheckCircle size={14} /> Fin
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* MENÚ LATERAL DESPLEGABLE */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed', top: '50px', left: 0, bottom: 0, width: '220px',
          background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
          zIndex: 1000, padding: '1.5rem',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          boxShadow: isMenuOpen ? '10px 0 30px rgba(0,0,0,0.2)' : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', paddingLeft: '1rem' }}>
            Navegación
          </div>
          <button className="btn" style={{ textAlign: 'left', padding: '1rem', background: mode === 'library' ? 'rgba(128,128,128,0.1)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: mode === 'library' ? 'bold' : 'normal', color: 'var(--nav-text)' }} onClick={() => { reset(); setIsMenuOpen(false); }}>
            <BookOpen size={18} style={{ marginRight: '1rem' }} /> Mi Biblioteca
          </button>
          <button className="btn" style={{ textAlign: 'left', padding: '1rem', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--nav-text)' }} onClick={() => { setIsMenuOpen(false); triggerUpload('tema'); }}>
            <Plus size={18} style={{ marginRight: '1rem' }} /> Nueva Ingesta (PDF)
          </button>
        </div>
      )}

      {/* DASHBOARD - BIBLIOTECA */}
      {mode === 'library' && (
        <main style={{ width: '100%', maxWidth: '1000px' }}>

          {/* Zona de Ingesta Rápida Bifurcada (ESTILO GLASS ADAPTATIVO) */}
          <div className="glass-panel" style={{ marginBottom: '3rem', padding: '3rem 2rem', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', boxShadow: theme === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-text)', fontWeight: '400', letterSpacing: '-0.5px' }}>Añadir Nuevo Material</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: '300', marginBottom: '1.5rem' }}>Clasifica tu origen de datos para organizar automáticamente tu entorno.</p>

            </div>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <button className="hover-scale glass-panel" onClick={() => triggerUpload('promo')} style={{ flex: '1 1 300px', padding: '2.5rem', fontSize: '1.1rem', background: 'rgba(128,128,128,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--color-text)' }}>
                <FileText size={42} color="#3b82f6" strokeWidth={1.5} />
                <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>Examen de Promoción</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>Pruebas oficiales por convocatoria</span>
              </button>

              <button className="hover-scale glass-panel" onClick={() => triggerUpload('tema')} style={{ flex: '1 1 300px', padding: '2.5rem', fontSize: '1.1rem', background: 'rgba(128,128,128,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--color-text)' }}>
                <Folder size={42} color="#10b981" strokeWidth={1.5} />
                <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>Test por Tema</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>Bloques específicos teóricos</span>
              </button>
            </div>
            <input id="file-input" type="file" accept=".pdf,application/pdf,.txt,text/plain" onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>

          {isLoading && <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#3b82f6' }}>Procesando documento inteligente...</div>}
          {error && <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#ef4444' }}>{error}</div>}

          {/* Vista Estructurada de la Biblioteca */}
          {Object.keys(groupedLibrary).length === 0 && !isLoading ? (
            <div className="glass-panel text-center" style={{ padding: '4rem', opacity: 0.6 }}>
              <BookOpen size={48} className="mb-4" color="var(--color-text-muted)" style={{ margin: '0 auto' }} />
              <h3>Tu biblioteca está vacía</h3>
              <p>Sube tu primer PDF para empezar a entrenar.</p>
            </div>
          ) : (
            <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'start' }}>
              {Object.keys(groupedLibrary).map(promo => (
                <details open={true} key={promo} className="promo-section glass-panel hover-scale" style={{ padding: '2rem', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', boxShadow: theme === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 4px 15px rgba(0,0,0,0.05)' }}>

                  <summary style={{ fontSize: '1.4rem', color: 'var(--color-text)', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', cursor: 'pointer', outline: 'none', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Folder size={24} color="#3b82f6" strokeWidth={1.5} /> {promo}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>Expandir ⏷</span>
                  </summary>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {Object.keys(groupedLibrary[promo]).map(tema => (
                      <div key={tema} className="tema-card" style={{ background: 'rgba(128,128,128,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981', fontSize: '1.2rem', fontWeight: '500' }}>
                          <BookOpen size={18} strokeWidth={1.5} /> {tema}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          {groupedLibrary[promo][tema].map(exam => (
                            <div key={exam.id} className="exam-item glass-panel" style={{ cursor: 'pointer', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', border: '1px solid var(--glass-border)', background: 'transparent' }} onClick={() => startExam(exam)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <FileText size={18} color="var(--color-text-muted)" />
                                <div>
                                  <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{exam.title}</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{exam.questions.length} preguntas disponibles</div>
                                </div>
                              </div>
                              <button onClick={(e) => deleteExam(exam.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.6, cursor: 'pointer', padding: '0.5rem', display: 'flex', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </main>
      )}

      {/* FORMULARIO DE CATALOGACIÓN AL SUBIR PDF */}
      {mode === 'upload' && (
        <main className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3rem', margin: '2rem auto', background: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text)' }}>Catalogar Examen</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            Se han detectado <strong style={{ color: 'var(--color-success)' }}>{uploadData.parsedQuestions.length} preguntas</strong> listas para ser unidas y procesadas.
          </p>

          <form onSubmit={saveToLibrary} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text)' }}>Título del Test</label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text)' }}>Promoción</label>
              <input
                type="text"
                placeholder="Ej: Promoción 35, Oficiales..."
                value={uploadData.promo}
                onChange={(e) => setUploadData({ ...uploadData, promo: e.target.value })}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text)' }}>Tema</label>
              <input
                type="text"
                placeholder="Ej: Tema 5 - Violencia de Género"
                value={uploadData.tema}
                onChange={(e) => setUploadData({ ...uploadData, tema: e.target.value })}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>

            {/* Campo opcional de PDF de teoría */}
            <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', padding: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '500', fontSize: '0.9rem' }}>
                📚 Adjuntar PDF de teoría
                <span style={{ fontWeight: '400', color: '#94a3b8', fontSize: '0.8rem' }}>(opcional)</span>
              </label>
              {uploadData.theoryText ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#10b981', fontSize: '0.85rem' }}>✅ Teoría cargada correctamente</span>
                  <button type="button" onClick={() => setUploadData({ ...uploadData, theoryText: null })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                  {isLoadingTheory ? '⏳ Procesando PDF de teoría...' : '📂 Seleccionar PDF o TXT del temario'}
                  <input
                    type="file"
                    accept=".pdf,application/pdf,.txt,text/plain"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      setIsLoadingTheory(true);
                      try {
                        let tText;
                        if (f.name.toLowerCase().endsWith('.txt')) {
                          tText = await f.text();
                          tText = tText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                        } else {
                          tText = await parsePDFLight(f);
                        }
                        setUploadData(prev => ({ ...prev, theoryText: tText }));
                      } catch {
                        setError('No se pudo leer el PDF de teoría.');
                      } finally {
                        setIsLoadingTheory(false);
                        e.target.value = null;
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn glass-panel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('library')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)' }}>
                Guardar en Biblioteca
              </button>
            </div>
          </form>
        </main>
      )}

      {mode === 'exam' && (
        <React.Fragment>
          {/* El div de título antiguo y el botón de Salir fueron eliminados para ganar 100% de inmersión vertical */}
          <ExamEngine
            questions={questions}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            answers={answers}
            setAnswers={setAnswers}
            onFinish={handleFinish}
            theoryText={activeTheoryText}
            pdfUrl={activePDFUrl}
            pdfBlob={activePDFBlob}
          />
        </React.Fragment>
      )}

      {mode === 'results' && (
        <main className="glass-panel text-center" style={{ maxWidth: '600px', width: '100%', padding: '3rem', background: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-text)' }}>Resultados del Test</h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '3rem' }}>
            <div className="stat">
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#22c55e' }}>
                {Object.keys(answers).filter(idx => answers[idx] === questions[idx].correctAnswer).length}
              </div>
              <p style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', fontWeight: '600' }}>Aciertos</p>
            </div>

            <div className="stat">
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ef4444' }}>
                {Object.keys(answers).filter(idx => answers[idx] !== questions[idx].correctAnswer).length}
              </div>
              <p style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', fontWeight: '600' }}>Fallos</p>
            </div>

            <div className="stat">
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                {questions.length - Object.keys(answers).length}
              </div>
              <p style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', fontWeight: '600' }}>Blancos</p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={reset} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            <RotateCcw size={20} style={{ marginRight: '0.5rem' }} /> Volver a la Biblioteca
          </button>
        </main>
      )}
    </div>
  );
}

export default App;
