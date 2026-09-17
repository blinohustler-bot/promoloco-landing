# PromoLoco — formulaire partenaire B2B

Maquette fonctionnelle du tunnel de qualification. **Structure + 70 % du look.**
Ouvre `index.html` dans un navigateur, il n'y a rien à installer.

**Pour :** Hugo · **De :** TPS Digital Services · **Date :** 2026-09-17

---

## Ce que c'est

Un formulaire multi-étapes qui remplace le formulaire instantané Meta actuel. Il :

1. demande la **niche** (1 tap, 7 choix) ;
2. prend les **coordonnées** — et **c'est là que le lead est enregistré**, pas à la fin ;
3. pose **4 questions de tri** (6 en concession) ;
4. calcule une **note sur 10** ;
5. affiche le **calendrier** si la note atteint 6, sinon un message de rappel.

Tout est dans un seul fichier, sans dépendance, sans build. Le JS est en bas de `index.html`.

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

Quatre coquilles vides en haut du `<script>` :

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

### 4. Le calendrier

Un bloc pointillé attend à la fin. Les trois widgets GHL :

| Niche | Widget |
|---|---|
| mécanique | `xbtFcS6Os4ebiQWkWvcc` |
| lave-auto | `y0RvpgktjxatzaAerrkX` |
| concession | `bFYAzyGJOaRAcae6dbMV` |

### 5. Le reste du look

- **Les vraies polices.** Le site tourne sur **Clash Display** (titres) et **Satoshi** (texte),
  servies par Fontshare. Ici ce sont des substituts Google (Archivo + Plus Jakarta Sans).
- **Le vrai logo.** Il est redessiné en SVG inline pour que le fichier soit autonome. ⚠️ Le seul
  fichier qu'on a est en **lettres blanches** — pour fond sombre seulement.
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
place le seuil sur la distribution réelle.

---

## Compatibilité

Testé à 375 px (iPhone SE), 768 px (iPad) et 1280 px (ordinateur). Ce qui est géré :

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

En bas de la page, « Panneau de test » montre en direct les réponses, les verrous déclenchés, la
note et les événements tirés. À enlever avant la mise en ligne, ou à cacher derrière `?debug=1`.

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
