/* ============================================================
   HUGO — les coquilles à remplir
   ============================================================ */
type Listener = (events: string[]) => void;

const EVENTS: string[] = [];
const listeners = new Set<Listener>();

/** Le panneau de test s'abonne ici pour afficher les événements tirés. */
export function onEvents(fn: Listener) {
  listeners.add(fn);
  fn([...EVENTS]);
  return () => { listeners.delete(fn); };
}

function log(n: string, d?: object) {
  EVENTS.push(n);
  console.log('[event]', n, d || {});
  listeners.forEach(fn => fn([...EVENTS]));
}

export type Attribution = { fbp: string; fbc: string; utm: Record<string, string>; event_id: string };

/** À appeler une fois, côté navigateur. */
export function captureAttribution(): Attribution {
  const p = new URLSearchParams(location.search);
  const fbclid = p.get('fbclid');
  if (fbclid) { try { document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; path=/; max-age=7776000`; } catch {} }
  const read = (n: string) => { try { return (document.cookie.match('(^|;)\\s*' + n + '=([^;]*)') || [])[2] || ''; } catch { return ''; } };
  return { fbp: read('_fbp'), fbc: read('_fbc'), utm: Object.fromEntries(p),
           event_id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) };
}

export async function postPartial(d: object){ /* TODO Hugo — POST vers GHL, créer le contact */ log('→ POST partiel (GHL)', d); }
export function fireLead(d: object){                 /* TODO — fbq + CAPI, même event_id */ log('Lead', d); }
export function fireCompleteRegistration(d: object){ /* TODO — fbq + CAPI, même event_id */ log('CompleteRegistration', d); }
export function fireLeadQualifie(d: object){         /* TODO — CAPI seulement, si note >= seuil */ log('LeadQualifie', d); }
