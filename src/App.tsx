import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  ShieldCheck, FileText, UploadCloud, ClipboardCheck, AlertTriangle,
  CheckCircle2, CircleHelp, LoaderCircle, X, Sparkles, Languages,
  ArrowRight, RotateCcw, FileSearch, House, ChevronDown
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Risk = {
  title: string;
  clause: string;
  level: "High" | "Medium" | "Low";
  explanation: string;
  whyItMatters: string;
  question: string;
};

type Analysis = {
  summary: string;
  risks: Risk[];
  questions: string[];
};

const DISCLAIMER =
  "This is awareness guidance, not legal advice. AI-generated risk classifications may be incorrect. Review the original agreement and consult a qualified professional when necessary.";

async function extractPdfText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").replace(/\s+/g, " ").trim();
}

export default function App() {
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [agreementText, setAgreementText] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const setSelectedFile = (selected: File | undefined) => {
    setError("");
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (selected.size > 12 * 1024 * 1024) {
      setError("This PDF is larger than 12 MB. Please choose a smaller file.");
      return;
    }
    setFile(selected);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSelectedFile(event.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    setError("");
    setAnalysis(null);
    setCheckedQuestions([]);

    let text = agreementText.trim();
    if (mode === "pdf") {
      if (!file) {
        setError("Upload a PDF agreement first.");
        return;
      }
      setExtracting(true);
      try {
        text = await extractPdfText(file);
      } catch {
        setError("We couldn't read this PDF. Try another PDF or paste its text instead.");
        setExtracting(false);
        return;
      }
      setExtracting(false);
      if (text.length < 100) {
        setError("Little or no selectable text was found. This may be a scanned PDF; paste the text or use an OCR tool first.");
        return;
      }
    }

    if (text.length < 100) {
      setError("Paste at least 100 characters of agreement text before analysis.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed. Please try again.");
      setAnalysis(data as Analysis);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAgreementText("");
    setAnalysis(null);
    setError("");
    setCheckedQuestions([]);
    setMode("pdf");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const risks = analysis?.risks ?? [];
  const countLevel = (level: Risk["level"]) => risks.filter((risk) => risk.level === level).length;
  const questions = analysis?.questions?.length
    ? analysis.questions
    : risks.map((risk) => risk.question).filter(Boolean);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); reset(); }}>
          <span className="brand-icon"><ShieldCheck size={23} /></span>
          <span>PG<span className="brand-accent">Shield</span></span>
        </a>
        <nav className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#analyzer">Analyzer</a>
        </nav>
        <a className="nav-cta" href="#analyzer">Check my agreement <ArrowRight size={15} /></a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A smarter move starts here</div>
            <h1>Read between<br />the <span>red flags.</span></h1>
            <p className="hero-description">
              Your PG agreement shouldn't be a mystery. Spot risky clauses, understand the fine print, and know what to ask before you sign.
            </p>
            <a className="primary-button" href="#analyzer">Analyze my agreement <ArrowRight size={17} /></a>
            <div className="trust-note"><ShieldCheck size={16} /> Your agreement is analyzed on request. We don't save it to a database.</div>
          </div>
          <div className="hero-art" aria-label="Agreement risk overview illustration">
            <div className="floating-chip chip-top"><span className="mini-dot red" /> Hidden charges</div>
            <div className="document-card">
              <div className="doc-top"><span className="doc-symbol"><FileText size={20} /></span><span className="doc-label">RENTAL AGREEMENT</span><span className="doc-menu">•••</span></div>
              <div className="doc-title-line" />
              <div className="doc-line long" /><div className="doc-line" /><div className="doc-line medium" />
              <div className="highlight-clause"><span className="highlight-icon"><AlertTriangle size={15} /></span><div><b>Security deposit</b><span>Non-refundable deposit clause</span></div><strong>HIGH</strong></div>
              <div className="doc-line long" /><div className="doc-line medium" /><div className="doc-line" />
              <div className="highlight-clause medium-risk"><span className="highlight-icon"><CircleHelp size={15} /></span><div><b>Notice period</b><span>Clarification recommended</span></div><strong>MED</strong></div>
            </div>
            <div className="floating-chip chip-bottom"><span className="success-badge"><CheckCircle2 size={16} /></span> Plain-language insights</div>
            <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          </div>
        </section>

        <section className="stats-strip" id="how-it-works">
          <div className="stat-item"><span className="stat-icon purple"><FileSearch size={19} /></span><div><b>Spot red flags</b><span>Find clauses worth a second look</span></div></div>
          <div className="stat-item"><span className="stat-icon orange"><Languages size={19} /></span><div><b>Plain language</b><span>Understand the fine print</span></div></div>
          <div className="stat-item"><span className="stat-icon green"><ClipboardCheck size={19} /></span><div><b>Ask with confidence</b><span>Get questions for your owner</span></div></div>
        </section>

        <section className="analyzer-section" id="analyzer">
          <div className="section-heading">
            <div className="eyebrow">THE AGREEMENT CHECKER</div>
            <h2>Let's check your agreement.</h2>
            <p>Upload your PDF or paste the agreement text below to get started.</p>
          </div>

          <div className="analyzer-card">
            <div className="step-heading"><span className="step-number">01</span><div><h3>Add your agreement</h3><p>Your document stays in this session and is sent for AI analysis only when you click analyze.</p></div></div>
            <div className="tabs">
              <button className={mode === "pdf" ? "tab active" : "tab"} onClick={() => { setMode("pdf"); setError(""); }}><FileText size={17} /> Upload PDF</button>
              <button className={mode === "text" ? "tab active" : "tab"} onClick={() => { setMode("text"); setError(""); }}><ClipboardCheck size={17} /> Paste text</button>
            </div>

            {mode === "pdf" ? (
              <div className={`dropzone ${file ? "has-file" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={onFileChange} hidden />
                {file ? (
                  <div className="selected-file"><span className="file-icon"><FileText size={24} /></span><div className="file-meta"><b>{file.name}</b><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · PDF document</span></div><button className="icon-button" aria-label="Remove PDF" onClick={() => setFile(null)}><X size={18} /></button></div>
                ) : (
                  <>
                    <div className="upload-icon"><UploadCloud size={27} /></div>
                    <h4>Drop your agreement here</h4>
                    <p>or choose a file from your device</p>
                    <button className="secondary-button" onClick={() => inputRef.current?.click()}>Browse PDF <ArrowRight size={15} /></button>
                    <span className="file-hint">PDF only · Max 12 MB</span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-entry">
                <label htmlFor="agreement-text">Agreement text</label>
                <textarea id="agreement-text" value={agreementText} onChange={(e) => setAgreementText(e.target.value)} placeholder="Paste the PG, hostel, or rental agreement text here..." rows={9} />
                <div className="textarea-footer"><span>Include as much of the agreement as possible.</span><span>{agreementText.length.toLocaleString()} characters</span></div>
              </div>
            )}

            <div className="options-row">
              <label htmlFor="language">Explanation language</label>
              <div className="select-wrap"><Languages size={16} /><select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>Kannada</option><option>Hindi</option></select><ChevronDown size={15} /></div>
            </div>

            {error && <div className="error-message" role="alert"><AlertTriangle size={17} />{error}</div>}

            <button className="analyze-button" onClick={analyze} disabled={loading || extracting}>
              {extracting ? <><LoaderCircle className="spin" size={18} /> Reading PDF...</> : loading ? <><LoaderCircle className="spin" size={18} /> Analyzing agreement...</> : <><Sparkles size={18} /> Analyze agreement <ArrowRight size={17} /></>}
            </button>
            <p className="privacy-note"><ShieldCheck size={14} /> No account required. Avoid uploading documents containing unnecessary sensitive personal information.</p>
          </div>
        </section>

        {analysis && (
          <section className="results-section" ref={resultsRef}>
            <div className="results-heading"><div><div className="eyebrow">YOUR AGREEMENT REPORT</div><h2>Here's what to look out for.</h2></div><button className="secondary-button" onClick={reset}><RotateCcw size={15} /> New agreement</button></div>
            <div className="summary-card"><div className="summary-icon"><Sparkles size={21} /></div><div><h3>AI summary</h3><p>{analysis.summary}</p></div></div>
            <div className="risk-stats">
              <div className="risk-stat total"><span>Total flagged</span><b>{risks.length}</b></div>
              <div className="risk-stat high"><span>High risk</span><b>{countLevel("High")}</b></div>
              <div className="risk-stat medium"><span>Medium risk</span><b>{countLevel("Medium")}</b></div>
              <div className="risk-stat low"><span>Low risk</span><b>{countLevel("Low")}</b></div>
            </div>
            <div className="results-subheading"><h3>Clauses to review</h3><span>{risks.length} finding{risks.length === 1 ? "" : "s"}</span></div>
            {risks.length === 0 ? <div className="empty-state"><CheckCircle2 size={23} /><div><b>No clear red flags were identified.</b><p>This does not guarantee the agreement is safe. Review all terms and ask about anything unclear.</p></div></div> : (
              <div className="risk-list">{risks.map((risk, index) => (
                <article className={`risk-card ${risk.level.toLowerCase()}`} key={`${risk.title}-${index}`}>
                  <div className="risk-card-top"><span className={`risk-pill ${risk.level.toLowerCase()}`}><span /> {risk.level} risk</span><span className="risk-number">CLAUSE {String(index + 1).padStart(2, "0")}</span></div>
                  <h4>{risk.title}</h4>
                  <blockquote>{risk.clause}</blockquote>
                  <div className="explanation-grid"><div><h5>In simple terms</h5><p>{risk.explanation}</p></div><div><h5>Why it matters</h5><p>{risk.whyItMatters}</p></div></div>
                  {risk.question && <div className="ask-box"><CircleHelp size={18} /><div><b>Ask the owner</b><p>“{risk.question}”</p></div></div>}
                </article>
              ))}</div>
            )}
            <div className="questions-card"><div className="questions-title"><span className="questions-icon"><ClipboardCheck size={21} /></span><div><h3>Questions to ask the owner</h3><p>Check these off as you get clear answers.</p></div></div>
{questions.length > 0 ? (
  <div className="question-list">
    {questions.map((question, index) => (
      <label
        className={`question-row ${
          checkedQuestions.includes(index) ? "checked" : ""
        }`}
        key={`${question}-${index}`}
      >
        <input
          type="checkbox"
          checked={checkedQuestions.includes(index)}
          onChange={() =>
            setCheckedQuestions((prev) =>
              prev.includes(index)
                ? prev.filter((n) => n !== index)
                : [...prev, index]
            )
          }
        />
        <span className="custom-checkbox">
          <CheckCircle2 size={17} />
        </span>
        <span>{question}</span>
      </label>
    ))}
  </div>
) : (
  <p className="no-questions">
    Ask the owner to clarify any term you do not understand, and request
    important promises in writing.
  </p>
)}
            </div>
            <div className="disclaimer"><AlertTriangle size={18} /><p><b>Important disclaimer</b><br />{DISCLAIMER}</p></div>
          </section>
        )}

        <section className="bottom-cta"><div className="bottom-cta-icon"><House size={22} /></div><h2>A better stay starts with clarity.</h2><p>Take a few minutes to understand what you're signing.</p><a href="#analyzer" className="primary-button">Check an agreement <ArrowRight size={16} /></a></section>
      </main>

      <footer><a className="brand footer-brand" href="#" onClick={(e) => { e.preventDefault(); reset(); }}><span className="brand-icon"><ShieldCheck size={20} /></span><span>PG<span className="brand-accent">Shield</span></span></a><p>Built for students. Designed for peace of mind.</p><span className="footer-disclaimer">Awareness guidance, not legal advice.</span></footer>
    </div>
  );
}
