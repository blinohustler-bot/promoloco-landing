/* ============================================================
   CONFIG — tout ce qui se règle sans toucher au reste
   ============================================================ */
export type Reponses = Record<string, string>;

export const CONFIG = {
  seuil: 6,
  plafondVerrou: 3,
  // Semaines 1 et 2 : on note tout le monde, mais tout le monde voit le calendrier
  // (pour placer le seuil sur la distribution réelle). Remettre à false ensuite.
  calendrierPourTous: false,
  // Widgets de réservation GHL par niche
  calendriers: {
    mecanique:  'xbtFcS6Os4ebiQWkWvcc',
    lavage:     'y0RvpgktjxatzaAerrkX',
    concession: 'bFYAzyGJOaRAcae6dbMV',
  } as Record<string, string>,
  // Niches sans calendrier dédié (esthétique, carrosserie, pneus, autre)
  calendrierParDefaut: 'xbtFcS6Os4ebiQWkWvcc',
  poids: {
    // CAPACITÉ — le seul critère publié par PromoLoco (« 20 à 50 nouveaux clients/mois minimum »)
    capacite:   { '50plus':4, '20a50':3.5, '10a20':1.5, 'moins10':0 },
    // LIEU — la promo se réclame en personne
    lieu:       { 'local':3, 'deux':2, 'mobile':0 },
    // AUTORITÉ — qui peut dire oui. Axe positif, pas une pénalité.
    autorite:   { 'moi':3, 'associe':2.5, 'siege':0, 'demander':0 },
    // ANCIENNETÉ — hypothèse non validée : simple malus
    anciennete: { '10plus':0, '6a10':0, '3a5':0, '1a2':-0.5, 'moins1':-1 },
    marques:    { 'toutes':0, 'surtout':0, 'notre':-2 },
    groupe:     { '1':0, '2a3':0.5, '4plus':1 }
  } as Record<string, Record<string, number>>,
  verrous: [
    { si: (r: Reponses) => r.lieu === 'mobile',                              motif:'sans_local' },
    { si: (r: Reponses) => r.capacite === 'moins10',                         motif:'sous_le_plancher' },
    { si: (r: Reponses) => r.service === 'interne' || r.service === 'aucun', motif:'service_interne' }
  ]
};

export function calcule(R: Reponses) {
  let n = 0;
  for (const [axe, table] of Object.entries(CONFIG.poids)) n += table[R[axe]] ?? 0;
  const motifs = CONFIG.verrous.filter(v => v.si(R)).map(v => v.motif);
  n = Math.max(0, Math.min(10, n));
  if (motifs.length) n = Math.min(n, CONFIG.plafondVerrou);
  return { note: Math.round(n * 10) / 10, motifs };
}
