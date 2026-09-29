'use client';

import { useEffect, useRef, useState } from 'react';
import { CONFIG, calcule, type Reponses } from '@/lib/config';
import { SCREENS, path, type Screen } from '@/lib/screens';
import {
  captureAttribution, postPartial, fireLead, fireCompleteRegistration, fireLeadQualifie,
  type Attribution,
} from '@/lib/tracking';
import { PITCH_TEXT, PitchTitle, Proof } from './Pitch';
import NicheIcon from './NicheIcon';
import Calendar from './Calendar';
import DebugPanel from './DebugPanel';

/* ============================================================
   MOTEUR
   ============================================================ */
const KEY = 'promoloco_form_v2';
const KEYS = new Set(SCREENS.map(s => s.key));

type State = { R: Reponses; cur: string; history: string[] };
type Field = 'nom' | 'tel' | 'email';
type Nav = 'instant' | 'smooth';
type Dir = 'fwd' | 'bwd';

function save(st: State) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }
function load(): State | null {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!d || !d.R || !Object.keys(d.R).length) return null;
    const history = Array.isArray(d.history) ? d.history.filter((k: string) => KEYS.has(k)) : [];
    const cur = KEYS.has(d.cur) ? d.cur : 'niche';
    // formulaire terminé : on repart à zéro
    return cur === 'fin' ? null : { R: d.R, cur, history };
  } catch { return null; }
}

/* téléphone : formatage pendant la frappe */
function formatTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 10);
  return d.length > 6 ? `${d.slice(0,3)} ${d.slice(3,6)}-${d.slice(6)}`
       : d.length > 3 ? `${d.slice(0,3)} ${d.slice(3)}`
       : d;
}

function validate(f: { nom: string; tel: string; email: string }) {
  const e: Partial<Record<Field, string>> = {};
  if (f.nom.trim().length < 2) e.nom = 'On a besoin de ton nom.';
  if (f.tel.replace(/\D/g, '').length < 10) e.tel = 'Un numéro à 10 chiffres, s\'il te plaît.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'Ce courriel a l\'air incomplet.';
  return e;
}

export default function PartnerForm() {
  const [st, setSt] = useState<State>({ R: {}, cur: 'niche', history: [] });
  const [dir, setDir] = useState<Dir>('fwd');
  const [ready, setReady] = useState(false);
  const [debug, setDebug] = useState(false);
  const [fields, setFields] = useState({ nom: '', tel: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);

  // Les handlers différés (setTimeout, clavier) lisent l'état ici, jamais une closure périmée.
  const stRef = useRef(st);
  const attr = useRef<Attribution | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nav = useRef<Nav | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inputs = { nom: useRef<HTMLInputElement>(null), tel: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null) };

  function commit(next: State, n?: Nav, d?: Dir) {
    stRef.current = next;
    setSt(next);
    save(next);
    if (n) nav.current = n;
    if (d) setDir(d);
  }

  function finir(R: Reponses) {
    const { note, motifs } = calcule(R);
    const ok = note >= CONFIG.seuil && motifs.length === 0;
    const event_id = attr.current?.event_id;
    fireCompleteRegistration({ note, niche: R.niche, event_id });
    if (ok) fireLeadQualifie({ note, niche: R.niche, event_id });
  }

  function next() {
    const s = stRef.current;
    const p = path(s.R);
    const nxt = p[p.findIndex(x => x.key === s.cur) + 1]?.key ?? 'fin';
    commit({ R: s.R, cur: nxt, history: [...s.history, s.cur] }, 'smooth', 'fwd');
    if (nxt === 'fin') finir(s.R);
  }

  function choose(key: string, v: string) {
    const s = stRef.current;
    const R = { ...s.R, [key]: v };
    if (key === 'service' && v !== 'public') delete R.marques;
    commit({ ...s, R });
    clearTimeout(timer.current);
    timer.current = setTimeout(next, 220);
  }

  function back() {
    const s = stRef.current;
    if (!s.history.length) return;
    clearTimeout(timer.current);
    commit({ R: s.R, cur: s.history[s.history.length - 1], history: s.history.slice(0, -1) }, 'smooth', 'bwd');
  }

  function setField(k: Field, v: string) {
    setFields(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  }

  async function submitContact() {
    if (busy) return;
    const e = validate(fields);
    setErrors(e);
    const first = (['nom', 'tel', 'email'] as Field[]).find(k => e[k]);
    if (first) { inputs[first].current?.focus(); return; }

    const nom = fields.nom.trim(), tel = fields.tel.replace(/\D/g, ''), email = fields.email.trim();
    const s = stRef.current;
    stRef.current = { ...s, R: { ...s.R, nom, tel, email } };
    setBusy(true);
    // Le lead est enregistré ici : un échec réseau ne doit jamais bloquer la suite du formulaire.
    try { await postPartial({ nom, tel, email, niche: s.R.niche, ...attr.current }); }
    catch (err) { console.error(err); }
    setBusy(false);
    fireLead({ niche: s.R.niche, event_id: attr.current?.event_id });
    next();
  }

  /* attribution + reprise */
  useEffect(() => {
    attr.current = captureAttribution();
    setDebug(new URLSearchParams(location.search).has('debug'));
    const saved = load();
    if (saved) {
      commit(saved, 'instant');
      setFields({ nom: saved.R.nom ?? '', tel: formatTel(saved.R.tel ?? ''), email: saved.R.email ?? '' });
    }
    setReady(true);
    return () => clearTimeout(timer.current);
  }, []);

  /* défilement + focus à chaque changement d'écran */
  useEffect(() => {
    const n = nav.current;
    if (!n) return;
    nav.current = null;
    const top = Math.max(0, (sectionRef.current?.closest('.card')?.getBoundingClientRect().top ?? 0) + window.scrollY - 16);
    if (window.scrollY > top) {
      try { window.scrollTo({ top, behavior: n === 'instant' ? 'auto' : 'smooth' }); }
      catch { window.scrollTo(0, top); }
    }
    const sec = sectionRef.current;
    if (n === 'smooth') (sec?.querySelector<HTMLElement>('.opt, input') ?? sec?.querySelector<HTMLElement>('h1'))?.focus({ preventScroll: true });
  }, [st.cur]);

  /* clavier : 1..9 choisit une option */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      const n = parseInt(e.key, 10);
      if (!n) return;
      const scr = SCREENS.find(s => s.key === stRef.current.cur);
      const opt = scr?.type === 'choice' ? scr.options[n - 1] : undefined;
      if (scr && opt) { e.preventDefault(); choose(scr.key, opt.v); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const p = path(st.R);
  const idx = p.findIndex(s => s.key === st.cur);
  const fin = st.cur === 'fin';
  const tot = p.length - 1;
  const screen = SCREENS.find(s => s.key === st.cur) as Screen;
  const pct = fin ? 100 : Math.round((idx / tot) * 100);

  return (
    <div className="card" data-ready={ready}>
      {!fin && (
        <>
          <div className="navrow">
            <button type="button" className="backbtn" onClick={back} hidden={st.history.length === 0}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3L4.5 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Retour
            </button>
            <span className="steps" aria-live="polite">Étape <b>{idx + 1}</b> sur {tot}</span>
          </div>
          <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progression">
            <span style={{ width: pct + '%' }} />
          </div>
        </>
      )}

      <form noValidate onSubmit={e => { e.preventDefault(); if (screen.type === 'fields') submitContact(); }}>
        <section key={st.cur} ref={sectionRef} className={`screen on ${dir}`}>
          {screen.type === 'choice' && (
            <>
              {screen.hero && (
                <div className="hero m-only">
                  <b><PitchTitle /></b>
                  <p>{PITCH_TEXT}</p>
                </div>
              )}
              <p className="kicker">{screen.label}</p>
              <h1 tabIndex={-1}>{screen.title}</h1>
              {screen.sub && <p className="sub">{screen.sub}</p>}
              <div className={'opts' + (screen.key === 'niche' ? ' opts-icons' : '')} role="group" aria-label={screen.title}>
                {screen.options.map((o, i) => (
                  <button key={o.v} type="button" className="opt" aria-pressed={st.R[screen.key] === o.v}
                    onClick={() => choose(screen.key, o.v)}>
                    {screen.key === 'niche' ? <NicheIcon v={o.v} /> : <span className="mark" />}
                    <span className="txt">{o.label}{o.hint && <span className="hint">{o.hint}</span>}</span>
                    <span className="key" aria-hidden="true">{i + 1}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {screen.type === 'fields' && (
            <>
              <p className="kicker">Coordonnées</p>
              <h1 tabIndex={-1}>On parle à qui&nbsp;?</h1>
              <div className="m-only">
                <Proof />
                <div className="reassure">
                  <b>Tu payes rien tant qu&apos;un client s&apos;est pas présenté chez vous.</b>
                  <p>Aucun frais fixe. On t&apos;appelle 15 minutes pour valider ton secteur, pis c&apos;est tout.</p>
                </div>
              </div>
              {([
                ['nom', 'Prénom et nom', { type: 'text', autoComplete: 'name', placeholder: 'Martin Tremblay' }],
                ['tel', 'Téléphone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 12, placeholder: '514 555-0123' }],
                ['email', 'Courriel', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'martin@garagetremblay.ca' }],
              ] as const).map(([k, label, attrs]) => (
                <div className="field" key={k}>
                  <label htmlFor={`f-${k}`}>{label}</label>
                  <input id={`f-${k}`} ref={inputs[k]} name={k} {...attrs}
                    aria-invalid={!!errors[k] || undefined} aria-describedby={errors[k] ? `e-${k}` : undefined}
                    value={fields[k]}
                    onChange={e => setField(k, k === 'tel' ? formatTel(e.target.value) : e.target.value)} />
                  {errors[k] && <p className="ferr" id={`e-${k}`}>{errors[k]}</p>}
                </div>
              ))}
              <button type="submit" className="btn" aria-busy={busy} disabled={busy}>
                {busy ? <span className="spin" aria-label="Envoi en cours" /> : <>Continuer <span aria-hidden="true">→</span></>}
              </button>
              <p className="microcta">Aucun engagement · aucune carte requise</p>
            </>
          )}

          {screen.type === 'fin' && <Fin R={st.R} />}
        </section>
      </form>

      {debug && <DebugPanel R={st.R} />}
    </div>
  );
}

function Fin({ R }: { R: Reponses }) {
  const { note, motifs } = calcule(R);
  const ok = note >= CONFIG.seuil && motifs.length === 0;
  const showCal = ok || CONFIG.calendrierPourTous;
  const [prenom, ...reste] = (R.nom ?? '').split(/\s+/);

  return (
    <>
      <div className={'verdict ' + (ok ? 'go' : 'hold')}>
        <div className="verdict-icon" aria-hidden="true">
          {ok
            ? <svg viewBox="4 4 24 24"><path className="draw" d="M9 16.5l4.8 4.8L23.5 11.5" /></svg>
            : <svg viewBox="5 5 22 22"><path className="draw" d="M11.5 8.5h3l1.5 4-2 1.5a10 10 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A15.5 15.5 0 019.5 10.5a2 2 0 012-2z" /></svg>}
        </div>
        <h1 tabIndex={-1}>
          {ok ? 'Ton secteur est admissible.' : showCal ? `Merci${prenom ? ', ' + prenom : ''}, c'est reçu.` : 'Merci — on te rappelle.'}
        </h1>
        <p>
          {showCal
            ? 'Choisis un moment pour l\'appel de 15 minutes. On valide ton secteur pis on part la campagne.'
            : 'Un membre de l\'équipe va t\'appeler pour voir ce qu\'on peut faire dans ton cas.'}
        </p>
      </div>
      {showCal && (
        <Calendar
          id={CONFIG.calendriers[R.niche] ?? CONFIG.calendrierParDefaut}
          prefill={{ first_name: prenom, last_name: reste.join(' '), email: R.email, phone: R.tel }}
        />
      )}
    </>
  );
}
