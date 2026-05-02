import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check, Loader, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import JSZip from 'jszip';

// Extract all text nodes from a slide XML string
const extractSlideText = (xmlStr) => {
  // Get all <a:t> text node values
  const matches = [...xmlStr.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)];
  const texts = matches.map(m => m[1].trim()).filter(Boolean);

  // Try to find the title (first text in title placeholder)
  const titleMatch = xmlStr.match(/ph type="title"[^>]*>[\s\S]*?<a:t[^>]*>([^<]+)<\/a:t>/);
  const title = titleMatch ? titleMatch[1].trim() : texts[0] || '';

  // Body = all other text joined
  const body = texts.filter(t => t !== title).join(' · ').slice(0, 200);

  return { title, body, allText: texts };
};

// Sprint 7.D — PDF: lazy-load pdfjs-dist (~700KB) only when a .pdf is selected.
const parsePdfFile = async (file, { maxPages = 50 } = {}) => {
  const pdfjs = await import('pdfjs-dist');
  // Use bundled worker (Vite handles ?url import).
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, maxPages);
  const slides = [];
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    const txt = await page.getTextContent();
    const lines = [];
    let line = '';
    let lastY = null;
    for (const item of txt.items) {
      const y = Math.round(item.transform?.[5] ?? 0);
      if (lastY !== null && Math.abs(lastY - y) > 4) {
        if (line.trim()) lines.push(line.trim());
        line = '';
      }
      line += item.str + ' ';
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    const cleaned = lines.filter((l) => l.length > 1);
    if (!cleaned.length) continue;
    const title = cleaned[0].slice(0, 120);
    const body = cleaned.slice(1).join(' · ').slice(0, 200);
    slides.push({ index: p, title, body, allText: cleaned });
  }
  return slides;
};

// Split plain text / markdown into "slides" using blank lines or markdown headings.
const parsePlainText = (raw) => {
  const cleaned = raw.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  // Headings (# / ##) get priority; otherwise split on blank lines.
  const headingMatches = [...cleaned.matchAll(/^#{1,3}\s+.+$/gm)];
  let chunks;
  if (headingMatches.length >= 2) {
    chunks = cleaned.split(/^(?=#{1,3}\s+)/gm);
  } else {
    chunks = cleaned.split(/\n\s*\n/g);
  }

  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 20)
    .map((chunk, i) => {
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
      const title = (lines[0] || `Слајд ${i + 1}`).replace(/^#{1,3}\s+/, '').slice(0, 120);
      const body = lines.slice(1).join(' · ').slice(0, 200);
      return { index: i + 1, title, body, allText: lines };
    });
};

const TYPE_OPTIONS = [
  { value: 'open',      label: 'Отворен текст',     desc: 'Учесниците пишуваат слободен одговор' },
  { value: 'wordcloud', label: 'Облак со зборови',   desc: 'Еден збор по учесник' },
  { value: 'poll',      label: 'Анкета',             desc: 'Текстот од слајдот = опции за гласање' },
  { value: 'ai',        label: 'AI Активност',       desc: 'Gemini генерира квиз од текстот на слајдот' },
];

const ImportPPTXModal = ({ isOpen, onClose, onImport }) => {
  const inputRef = useRef();
  const [slides, setSlides] = useState([]);
  const [selected, setSelected] = useState([]);
  const [pollType, setPollType] = useState('open');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setSlides([]); setSelected([]); setError('');
    setFileName(''); setLoading(false); setImporting(false);
  };

  const handleFile = async (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPptx = lower.endsWith('.pptx');
    const isPdf = lower.endsWith('.pdf');
    const isText = lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.markdown');
    if (!isPptx && !isPdf && !isText) {
      setError('Поддржани се .pptx, .pdf, .txt и .md датотеки.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Датотеката е поголема од 8MB.');
      return;
    }
    setError('');
    setLoading(true);
    setFileName(file.name);

    try {
      let parsed = [];
      if (isPptx) {
        const zip = await JSZip.loadAsync(file);
        const slideFiles = Object.keys(zip.files)
          .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)[0]);
            const nb = parseInt(b.match(/\d+/)[0]);
            return na - nb;
          });

        if (!slideFiles.length) {
          setError('Не можам да најдам слајдови во датотеката.');
          setLoading(false);
          return;
        }

        parsed = await Promise.all(
          slideFiles.map(async (name, i) => {
            const xml = await zip.files[name].async('string');
            const { title, body, allText } = extractSlideText(xml);
            return { index: i + 1, title: title || `Слајд ${i + 1}`, body, allText };
          })
        );
      } else if (isPdf) {
        try {
          parsed = await parsePdfFile(file, { maxPages: 50 });
        } catch (err) {
          console.warn('PDF parse failed', err);
          setError('Не можам да го прочитам PDF-от. Можеби е скениран (без текст).');
          setLoading(false);
          return;
        }
        if (!parsed.length) {
          setError('PDF-от не содржи текст за извлекување (можеби е скениран).');
          setLoading(false);
          return;
        }
      } else {
        const raw = await file.text();
        parsed = parsePlainText(raw);
        if (!parsed.length) {
          setError('Не можам да најдам блокови текст. Користи празни редови или # наслови.');
          setLoading(false);
          return;
        }
      }

      const withContent = parsed.filter(s => s.title || s.body);
      setSlides(withContent);
      setSelected(withContent.map(s => s.index));
    } catch (e) {
      setError('Грешка при читање на датотеката. Обидете се повторно.');
    }
    setLoading(false);
  };

  const toggleSlide = (idx) => {
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const buildPromptFromSlide = (slide) => {
    const text = [slide.title, ...(slide.allText || [])]
      .join('. ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 480);
  };

  const aiGenerateForSlide = async (slide) => {
    const prompt = buildPromptFromSlide(slide);
    if (prompt.length < 10) return null;
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type: 'quiz', strategy: 'default' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'AI грешка.');
    }
    return await res.json();
  };

  const handleImport = async () => {
    const toImport = slides.filter(s => selected.includes(s.index));
    if (!toImport.length) return;
    setImporting(true);
    try {
      if (pollType === 'ai') {
        const aiPolls = [];
        for (const slide of toImport) {
          try {
            const generated = await aiGenerateForSlide(slide);
            if (generated && generated.question) {
              aiPolls.push({
                ...slide,
                _aiPoll: {
                  question: generated.question,
                  type: generated.type || 'quiz',
                  is_quiz: generated.is_quiz === true,
                  options: Array.isArray(generated.options) ? generated.options : [],
                },
              });
            }
          } catch (e) {
            // continue with remaining slides — partial success is better than none
            console.warn('AI generation failed for slide', slide.index, e);
          }
        }
        if (!aiPolls.length) {
          setError('AI не успеа да генерира ниту една активност. Обиди се повторно.');
          setImporting(false);
          return;
        }
        await onImport(aiPolls, 'ai');
      } else {
        await onImport(toImport, pollType);
      }
      onClose();
      reset();
    } catch (e) {
      setError('Грешка при увоз. Обидете се повторно.');
    }
    setImporting(false);
  };

  const handleClose = () => { onClose(); reset(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Увези документ</h3>
                <p className="text-slate-400 font-bold text-sm mt-1">PowerPoint, текст или Markdown → интерактивни активности</p>
              </div>
              <button onClick={handleClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8">
              {/* Upload zone */}
              {!slides.length && (
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                  className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                >
                  <input ref={inputRef} type="file" accept=".pptx,.pdf,.txt,.md,.markdown" className="hidden"
                    onChange={e => handleFile(e.target.files[0])} />
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader size={40} className="text-indigo-600 animate-spin" />
                      <p className="font-black text-slate-500">Се чита {fileName}...</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="font-black text-slate-700 text-lg mb-2">Повлечи .pptx · .pdf · .txt · .md овде</p>
                      <p className="font-bold text-slate-400 text-sm mb-6">или кликни за да изберeш</p>
                      <span className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all">
                        Избери датотека
                      </span>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {/* Slide list */}
              {slides.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-slate-900">
                      Најдени <span className="text-indigo-600">{slides.length}</span> слајдови — {fileName}
                    </p>
                    <button
                      onClick={() => setSelected(selected.length === slides.length ? [] : slides.map(s => s.index))}
                      className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                    >
                      {selected.length === slides.length ? 'Одбери ги сите' : 'Избери ги сите'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {slides.map(slide => {
                      const isSelected = selected.includes(slide.index);
                      return (
                        <button
                          key={slide.index}
                          onClick={() => toggleSlide(slide.index)}
                          className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                            isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Слајд {slide.index}</span>
                            </div>
                            <p className="font-black text-slate-800 truncate">{slide.title}</p>
                            {slide.body && <p className="text-slate-400 font-medium text-xs truncate mt-0.5">{slide.body}</p>}
                          </div>
                          <FileText size={16} className="text-slate-300 flex-shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Poll type */}
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Тип на активност за увоз</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TYPE_OPTIONS.map(opt => {
                        const isAI = opt.value === 'ai';
                        const selected = pollType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setPollType(opt.value)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              selected
                                ? (isAI ? 'border-violet-500 bg-violet-50' : 'border-indigo-500 bg-indigo-50')
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isAI && <Sparkles size={14} className={selected ? 'text-violet-600' : 'text-slate-400'} />}
                              <p className={`font-black text-sm ${
                                selected
                                  ? (isAI ? 'text-violet-600' : 'text-indigo-600')
                                  : 'text-slate-700'
                              }`}>{opt.label}</p>
                            </div>
                            <p className="text-slate-400 font-medium text-xs leading-snug">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    {pollType === 'ai' && (
                      <p className="text-[10px] font-black text-violet-600 mt-3 px-1 uppercase tracking-widest">
                        Внимание: AI ќе изврши едно барање по слајд (макс 10/мин).
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => { reset(); }}
                    className="text-xs font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors"
                  >
                    ← Избери друга датотека
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            {slides.length > 0 && (
              <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-400">
                  {selected.length} слајдови избрани
                </p>
                <button
                  onClick={handleImport}
                  disabled={importing || !selected.length}
                  className={`flex items-center gap-3 px-8 py-4 text-white rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95 ${
                    pollType === 'ai'
                      ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {importing ? (
                    <><Loader size={18} className="animate-spin" /> {pollType === 'ai' ? 'AI генерира...' : 'Се увезува...'}</>
                  ) : pollType === 'ai' ? (
                    <><Sparkles size={18} /> Генерирај {selected.length} активности <ChevronRight size={18} /></>
                  ) : (
                    <>Увези {selected.length} анкети <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImportPPTXModal;
