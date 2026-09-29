import type { Reponses } from './config';

export type Option = { v: string; label: string; hint?: string };

export type Screen =
  | { key: string; type: 'choice'; label: string; title: string; sub?: string; hero?: boolean;
      only?: string; requires?: [string, string]; options: Option[] }
  | { key: 'contact'; type: 'fields' }
  | { key: 'fin'; type: 'fin' };

export const SCREENS: Screen[] = [
  /* ===== 1 — NICHE ===== */
  { key: 'niche', type: 'choice', hero: true, label: 'Ton domaine', title: 'T\'es dans quel domaine ?',
    sub: 'Ça nous dit quelles questions te poser ensuite. Un seul tap.',
    options: [
      { v: 'mecanique',   label: 'Mécanique générale / entretien' },
      { v: 'esthetique',  label: 'Esthétique automobile / detailing' },
      { v: 'lavage',      label: 'Lave-auto', hint: 'tunnel ou portique' },
      { v: 'concession',  label: 'Concession automobile' },
      { v: 'carrosserie', label: 'Carrosserie' },
      { v: 'pneus',       label: 'Pneus' },
      { v: 'autre',       label: 'Autre' },
    ] },

  /* ===== 2 — COORDONNÉES ===== */
  { key: 'contact', type: 'fields' },

  /* ===== 3 — CAPACITÉ ===== */
  { key: 'capacite', type: 'choice', label: 'Capacité',
    title: 'Combien de nouveaux clients de plus tu peux prendre par mois ?',
    sub: 'Sans engager personne de plus. On veut être sûrs que le volume qu\'on t\'envoie te mette pas dans le trouble.',
    options: [
      { v: '50plus',  label: 'Plus de 50' },
      { v: '20a50',   label: 'Entre 20 et 50' },
      { v: '10a20',   label: 'Entre 10 et 20' },
      { v: 'moins10', label: 'Moins de 10' },
    ] },

  /* ===== 4 — LIEU ===== */
  { key: 'lieu', type: 'choice', label: 'Ton local', title: 'Où tes clients laissent leur véhicule ?',
    options: [
      { v: 'local',  label: 'À mon local commercial' },
      { v: 'deux',   label: 'Les deux', hint: 'j\'ai un local et je me déplace aussi' },
      { v: 'mobile', label: 'Je me déplace chez le client', hint: 'service mobile' },
    ] },

  /* ===== 5 — AUTORITÉ ===== */
  { key: 'autorite', type: 'choice', label: 'Décision', title: 'Qui décide des promotions chez vous ?',
    options: [
      { v: 'moi',      label: 'Moi' },
      { v: 'associe',  label: 'Moi, avec un associé' },
      { v: 'siege',    label: 'Le siège social ou la bannière' },
      { v: 'demander', label: 'Je dois demander au propriétaire' },
    ] },

  /* ===== 6 — ANCIENNETÉ ===== */
  { key: 'anciennete', type: 'choice', label: 'Ancienneté', title: 'Depuis quand t\'es ouvert ?',
    options: [
      { v: '10plus', label: 'Plus de 10 ans' },
      { v: '6a10',   label: '6 à 10 ans' },
      { v: '3a5',    label: '3 à 5 ans' },
      { v: '1a2',    label: '1 à 2 ans' },
      { v: 'moins1', label: 'Moins d\'un an' },
    ] },

  /* ===== 7 — CONCESSION : service ===== */
  { key: 'service', type: 'choice', only: 'concession', label: 'Service',
    title: 'Avez-vous un département de service ?',
    sub: 'Mécanique ou esthétique — c\'est là qu\'un client du quartier revient le plus souvent.',
    options: [
      { v: 'public',  label: 'Oui, ouvert au public' },
      { v: 'interne', label: 'Oui, mais réservé à notre clientèle', hint: 'seulement nos propres acheteurs' },
      { v: 'aucun',   label: 'Non, vente de véhicules seulement' },
    ] },

  /* ===== 8 — CONCESSION : marques (l'effet papillon) ===== */
  { key: 'marques', type: 'choice', only: 'concession', requires: ['service', 'public'], label: 'Marques',
    title: 'Acceptez-vous les véhicules d\'autres marques que la vôtre ?',
    options: [
      { v: 'toutes',  label: 'Oui, toutes les marques' },
      { v: 'surtout', label: 'Oui, mais surtout la nôtre' },
      { v: 'notre',   label: 'Non, notre marque uniquement' },
    ] },

  /* ===== 9 — CONCESSION : groupe ===== */
  { key: 'groupe', type: 'choice', only: 'concession', label: 'Ton groupe',
    title: 'Combien de concessions détenez-vous ?',
    options: [
      { v: '1',     label: 'Une seule' },
      { v: '2a3',   label: '2 à 3' },
      { v: '4plus', label: '4 et plus' },
    ] },

  /* ===== FIN ===== */
  { key: 'fin', type: 'fin' },
];

export function visible(s: Screen, R: Reponses) {
  if (s.type !== 'choice') return true;
  if (s.only && R.niche !== s.only) return false;
  if (s.requires && R[s.requires[0]] !== s.requires[1]) return false;
  return true;
}

export const path = (R: Reponses) => SCREENS.filter(s => visible(s, R));
