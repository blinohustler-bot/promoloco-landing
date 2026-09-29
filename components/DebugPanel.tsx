'use client';

import { useEffect, useState } from 'react';
import { CONFIG, calcule, type Reponses } from '@/lib/config';
import { onEvents } from '@/lib/tracking';

/** Panneau de test — à enlever avant la mise en ligne, ou à cacher derrière ?debug=1. */
export default function DebugPanel({ R }: { R: Reponses }) {
  const [events, setEvents] = useState<string[]>([]);
  useEffect(() => onEvents(setEvents), []);
  const { note, motifs } = calcule(R);
  const entries = Object.entries(R);

  return (
    <details className="dbg">
      <summary>Panneau de test — ce que le serveur recevrait</summary>
      <div className="body">
        <div>
          {motifs.length
            ? motifs.map(m => <span key={m} className="tagpill">VERROU {m}</span>)
            : <span style={{ color: 'var(--muted)' }}>aucun verrou</span>}
        </div>
        <table>
          <tbody>
            {entries.length
              ? entries.map(([k, v]) => <tr key={k}><td>{k}</td><td><b>{v}</b></td></tr>)
              : <tr><td colSpan={2} style={{ color: 'var(--muted)' }}>aucune réponse</td></tr>}
          </tbody>
        </table>
        <p style={{ margin: '12px 0 0' }}>
          <b>note</b> = {note}
          &nbsp;·&nbsp; <b>seuil</b> = {CONFIG.seuil}
          &nbsp;·&nbsp; <b>événements</b> : {events.length ? events.join(' · ') : '—'}
        </p>
      </div>
    </details>
  );
}
