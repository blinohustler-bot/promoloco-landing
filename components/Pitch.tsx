/* Argumentaire : colonne de gauche sur desktop, intercalé dans les étapes 1 et 2 sur mobile. */

export const PitchTitle = () => <>Des clients du quartier, <em>livrés chez vous.</em></>;
export const PITCH_TEXT = 'Payé à la performance. Tu payes seulement pour les clients qui se présentent.';

export function Proof() {
  return (
    <div className="proof">
      <div><div className="n">50+</div><div className="l">garages<br />partenaires</div></div>
      <div><div className="n">4,9/5</div><div className="l">note des<br />partenaires</div></div>
      <div><div className="n">340+</div><div className="l">représentants<br />sur la route</div></div>
    </div>
  );
}

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <circle cx="9" cy="9" r="9" fill="var(--red)" />
    <path d="M5.2 9.3l2.4 2.4 5.2-5.3" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Aside() {
  return (
    <aside className="aside">
      <p className="eyebrow">Programme partenaire</p>
      <p className="aside-title"><PitchTitle /></p>
      <p className="aside-text">{PITCH_TEXT}</p>
      <Proof />
      <ul className="checks">
        <li><Check />Tu payes rien tant qu&apos;un client s&apos;est pas présenté chez vous.</li>
        <li><Check />Aucun frais fixe · aucun engagement · aucune carte requise.</li>
        <li><Check />On t&apos;appelle 15 minutes pour valider ton secteur, pis c&apos;est tout.</li>
      </ul>
    </aside>
  );
}
