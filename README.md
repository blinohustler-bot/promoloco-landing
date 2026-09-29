# PromoLoco — formulaire partenaire B2B

Tunnel de qualification des partenaires PromoLoco.
Projet Next.js (App Router, TypeScript) :

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

**Pour :** Hugo · **De :** TPS Digital Services · **Date :** 2026-09-17

---

## Ce que c'est

Un formulaire multi-étapes qui remplace le formulaire instantané Meta actuel. Il :

1. demande la **niche** (1 tap, 7 choix) ;
2. prend les **coordonnées** — et **c'est là que le lead est enregistré**, pas à la fin ;
3. pose **4 questions de tri** (6 en concession) ;
4. calcule une **note sur 10** — jamais montrée au prospect ;
5. affiche le **calendrier GHL** de sa niche si la note atteint 6, sinon un message de rappel.

| Fichier | Contenu |
|---|---|
| `lib/config.ts` | `CONFIG` (seuil, poids, verrous) et `calcule()` |
| `lib/screens.ts` | les écrans, leurs options et les règles d'affichage (`only`, `requires`) |
| `lib/tracking.ts` | attribution + coquilles d'événements à brancher |
| `components/PartnerForm.tsx` | le moteur : navigation, reprise, validation, écran de fin |
| `components/Pitch.tsx` | l'argumentaire (colonne de gauche sur desktop, étapes 1-2 sur mobile) |
| `components/Calendar.tsx` | l'iframe de réservation GHL |
| `app/globals.css` | tout le style |

---

## Pourquoi c'est bâti comme ça

Trois décisions qui ont l'air arbitraires mais qui ne le sont pas.

**Le lead est enregistré à l'écran 2, pas à la fin.** Quelqu'un qui abandonne à l'étape 5 reste
dans le CRM et rappelable. Aujourd'hui, un abandon disparaît complètement.

**Personne n'est refusé.** Les trois verrous plafonnent la note à 3, ils ne ferment pas le
formulaire. On veut *mesurer* combien de mauvais leads arrivent, pas les rendre invisibles.
Le formulaire actuel filtre en silence : sur 206 leads, **206 ont répondu « oui »** à la question
de qualification, dont 42 qui écrivaient « Chez moi » ou « Mobile » dans le champ d'adresse juste
après.

**Aucune question ne demande au répondant de se décrire.** « Êtes-vous un garage ? » obtient
toujours « oui ». Les questions demandent **un nombre, un lieu, un nom** — des choses qu'on n'a pas
intérêt à fausser.

---

## Ce qu'il reste à brancher

### 1. Les événements Meta

Quatre coquilles vides dans `lib/tracking.ts` :

```js
function postPartial(d){ … }              // POST vers GHL : créer le contact
function fireLead(d){ … }                 // navigateur + serveur
function fireCompleteRegistration(d){ … } // navigateur + serveur
function fireLeadQualifie(d){ … }         // serveur seulement, si note >= seuil
```

| Événement | Quand | Chemin |
|---|---|---|
| `Lead` | submit de l'écran 2 | navigateur **+** serveur |
| `CompleteRegistration` | dernière étape soumise | navigateur **+** serveur |
| `LeadQualifie` | **seulement si note ≥ seuil** | serveur |
| `Schedule` | RDV confirmé | **workflow GHL**, pas d'ici |

⚠️ **Le même `event_id` des deux côtés**, sinon Meta compte chaque lead deux fois.
Il est déjà généré dans `ATTR.event_id`.

⚠️ **`Schedule` ne peut pas partir du navigateur.** Le calendrier est une iframe servie par
`api.leadconnectorhq.com` — le JS de la page ne voit pas la réservation. Ça doit venir d'un
workflow GHL « Appointment Booked ».

⚠️ **`LeadQualifie` est le point le plus important de tout le projet.** Une note qui ne vit que
dans le CRM ne change rien au trafic qu'on achète : Meta continue d'aller chercher des gens qui
remplissent des formulaires, parce que c'est le seul signal qu'on lui envoie. C'est cet événement-là
qui permet de faire monter la proportion de bons leads.

### 2. L'attribution

`captureAttribution()` lit déjà `fbclid` et reconstruit `_fbc`. Il faut **poster `fbp`, `fbc`,
`event_id` et les UTM avec chaque envoi**, et les conserver jusqu'au booking.

### 3. Le calcul de la note passe au serveur

Celui du navigateur sert à tester. L'objet `CONFIG` se recopie tel quel au backend.
**Le seuil et les poids se lisent dans une config, jamais en dur** — ils vont changer dès qu'on
aura des données de closing.

### 4. Le calendrier — branché, à valider

Les widgets GHL sont intégrés à la fin (`CONFIG.calendriers`) :

| Niche | Widget |
|---|---|
| mécanique | `xbtFcS6Os4ebiQWkWvcc` |
| lave-auto | `y0RvpgktjxatzaAerrkX` |
| concession | `bFYAzyGJOaRAcae6dbMV` |
| esthétique, carrosserie, pneus, autre | mécanique par défaut (`CONFIG.calendrierParDefaut`) |

L'iframe reçoit `first_name`, `last_name`, `email` et `phone` en paramètres pour préremplir
la réservation — **à vérifier que GHL les applique** sur ces calendriers.

### 5. Le reste du look

- **Les polices** : **Barlow Condensed** (titres) et **Barlow** (texte), servies par `next/font`.
  Barlow est dessinée d'après la signalisation routière — le registre de l'auto. Le site live est
  en Clash Display + Satoshi : à aligner si on garde ce choix.
- **Le fond** (`components/Backdrop.tsx`) : un quartier vu du ciel, des trajets rouges qui
  convergent vers le commerce, derrière la carte du formulaire. Figé si « réduire les animations ».
- **Le logo** est le vrai, en PNG 460×180. `public/logo.png` a les lettres repassées en blanc
  pour le fond sombre ; `public/logo-fond-clair.png` est l'original (lettres noires). Un SVG
  vectoriel serait plus net sur grand écran, si on peut l'obtenir.
- **La VSL** au-dessus de l'écran 1, si on garde le format actuel de la page.

---

## La grille de notation

| Axe | Réponses | Points |
|---|---|---|
| **Capacité mensuelle** | +50 · 20-50 · 10-20 · −10 | 4 · 3,5 · 1,5 · 0 |
| **Lieu** | local · les deux · mobile | 3 · 2 · 0 |
| **Autorité** | moi · avec associé · siège · dois demander | 3 · 2,5 · 0 · 0 |
| **Ancienneté** | 3 ans + · 1-2 ans · −1 an | 0 · −0,5 · −1 |
| **Marques** *(concession)* | notre marque uniquement | −2 |
| **Groupe** *(concession)* | 4+ · 2-3 | +1 · +0,5 |

**Trois verrous plafonnent la note à 3 :**

| Verrou | Motif |
|---|---|
| service mobile, pas de local | `sans_local` |
| moins de 10 nouveaux clients/mois | `sous_le_plancher` |
| concession sans service ouvert au public | `service_interne` |

Pourquoi ces trois-là : PromoLoco publie sur sa propre page partenaire qu'il faut
**« la capacité d'accueillir 20 à 50 nouveaux clients par mois minimum »**, et la promotion se
réclame en personne. En dessous, c'est structurel — pas une question de points.

**Le seuil de 6 est un paramètre, pas une constante.** On n'a aucune donnée de closing pour le
fixer. Semaines 1 et 2 : on note tout le monde mais **tout le monde voit le calendrier**, puis on
place le seuil sur la distribution réelle. C'est l'interrupteur `CONFIG.calendrierPourTous`.

---

## Compatibilité

Testé à 390 px (téléphone), 768 px (iPad) et 1440 px (ordinateur). Ce qui est géré :

- champs à 16 px — sous ce seuil, iOS zoome de force à la mise au point ;
- `env(safe-area-inset-*)` pour les encoches en paysage ;
- pas de flash gris au tap, pas de sélection au double-tap, délai de 300 ms enlevé ;
- `appearance:none` sur champs et boutons, sinon iOS impose ses coins et son ombre ;
- **aucun `vh`** — la barre d'adresse mobile ne casse rien ;
- replis pour `crypto.randomUUID`, `scrollTo({})`, `matchMedia`, `inset` (les quatre manquent sur
  Safari < 15) ;
- `localStorage` dans un try/catch — en navigation privée iOS il lève une exception.

La progression est gardée dans le navigateur : quelqu'un d'interrompu au comptoir retrouve son
formulaire. Rien n'est envoyé avant la fin de l'écran 2.

---

## Le panneau de test

Ajoute `?debug=1` à l'adresse : un panneau sous le formulaire montre en direct les réponses, les
verrous déclenchés, la note et les événements tirés. Invisible sans ce paramètre.

---

## Choix d'interface

- **La note n'est pas montrée au prospect.** Un « 3/10 » à l'écran est vexant pour quelqu'un
  qu'on rappelle quand même, et la note va passer au serveur. Elle reste dans `?debug=1`.
- **Desktop** : l'argumentaire (titre, chiffres, garanties) est à gauche en permanence, le
  formulaire à droite. **Mobile** : l'accroche est sur l'écran 1, les chiffres de preuve sur
  l'écran 2 — c'est là qu'on hésite. Ce sont les chiffres publiés : 50+ partenaires, 4,9/5, 340+
  représentants.
- **Le retour est en haut**, à côté du compteur d'étapes. Le glissement change de sens au retour.
- **Le téléphone se formate tout seul** ; les erreurs s'affichent sous chaque champ.
- **Les touches 1 à 9** choisissent une option au clavier (masquées sur mobile) ; Entrée valide
  l'écran 2.

## Ce qui a été coupé, et pourquoi

La règle : **une question mérite sa place seulement si sa réponse change ce qu'on fait avant
l'appel.**

1. **« Autour de ton commerce, c'est plutôt… »** — valait 0 point, parce qu'on ne connaît pas le
   rayon réel du porte-à-porte. Elle revient le jour où Étienne donne le rayon.
2. **« Combien de baies / véhicules par semaine »** — double emploi avec « combien de nouveaux
   clients de plus par mois », qui mesure la capacité *disponible*, la seule qui compte.

Résultat : **6 questions en mécanique (avant 8), 9 en concession (avant 11)**, sous les 90 secondes.
La longueur ne coûte pas de leads : le lead est enregistré à l'écran 2, et l'écran 1 est un tap.

---

## Ce qui bloque côté TPS

1. **Le jeton GHL répond 403** sur la location B2B `arI7TDV0mGV7uuvqhOvL`. Sans lui, la note
   s'écrit et personne à l'extérieur ne peut la relire — donc impossible de vérifier qu'un 8/10
   ferme mieux qu'un 4/10.
2. **Aucun événement « deal gagné » n'existe.** Il en faut un au passage de l'opportunité à Gagné,
   avec la valeur du contrat.
3. **Trois rouges différents circulent** : `#FA1909` (variable `--red-promooco` du site live, celui
   utilisé ici), `#E2231A` (nos affiches Meta, marqué « estimé, à confirmer »), `#FF0F00` (les
   pixels du logo). À trancher.

---

*Spec complète : `PromoLoco-Tunnel-Qualification-TPS.pdf` (19 pages, 2 schémas) — demande-la à Sam.*
