# CongoFlow v1 — Application web

**Fichier unique : `congoflow.html`** (2,6 Mo, autonome — aucune dépendance réseau).
Ouvre-le simplement dans un navigateur (double-clic), ou héberge-le tel quel.

## Ce que c'est
Plateforme de découverte, publication et suivi d'événements locaux à Kinshasa (RDC) :
fil à swiper façon Tinder, publication façon TikTok, score de « hype » propre à CongoFlow,
stories éphémères 24 h façon Instagram. Mobile first, responsive, installable (PWA),
trois langues (français / English / Lingala).

## Identité
- **Logo officiel** : celui que vous avez fourni, décliné en 3 versions (encre, blanc cassé, rouge)
  et en icônes PWA 192/512 — intégré partout (nav, footer, splash, auth, en-tête de l'app, favicon).
- **Typographie** (copiée de trendsaas.ai) : **Bricolage Grotesque** (titres),
  **Instrument Sans** (texte), **Spline Sans Mono** (labels), Instrument Serif italique (accents).

## Parcours de démonstration
1. **Landing page** : nav pilule (ancres Fonctionnalités / FAQ), hero avec téléphone animé,
   grille de points interactive limitée au hero, manifeste mot à mot,
   section « Pourquoi » avec **grandes images défilantes en arrière-plan** derrière les 4 atouts
   (2 rangées opposées + voile clair pour la lisibilité), FAQ accordéon, footer avec invitation.
2. **Auth** : bouton retour en haut à gauche, logo sur le panneau images (haut droite),
   « Continuer avec Google » en haut (simulé), e-mail + confirmation de mot de passe,
   téléphone optionnel avec consentement. Connexion démo : `demo@congoflow.cd` / `demo1234`.
3. **Onboarding** : 5 questions rapides (ou « Passer »).
4. **Le fil (Accueil)** : salutation personnalisée au prénom selon l'heure, barre de recherche
   (présente uniquement ici), swipe droite = j'aime, gauche = passer, haut = précédent.
5. **Fiche événement** : page entière dédiée (`#/ev/…`) avec retour, partage, like, rappel,
   commentaires, itinéraire — accessible depuis le fil, la recherche, « Mes événements » et les hashtags.
6. **Mes événements** : onglets **Aimés / Publiés**, filtres, rappels, vue « passés ».
7. **Activité** : rangée de **stories** (bulles façon Instagram, expirent après 24 h),
   3 onglets Notifications / Messages / Mes stories, bouton **+** (storie 24 h · post · à la une)
   à côté du raccourci paramètres. Visionneuse plein écran avec barres de progression.
8. **Profil** : photo de profil (affichée partout : en-tête, commentaires, stories…),
   statistiques, brouillons/programmés, édition, paramètres, déconnexion.
9. **Recherche & hashtags** : suggestions, historique, filtres, Tendances du moment.
10. **Signalement** : motif → modération simulée à seuil pondéré, recours avec ticket.

## Notes techniques
- Données persistées dans `localStorage` (compte, likes, stories, boosts…).
  Pour repartir de zéro : Paramètres → Supprimer mon compte.
- `prefers-reduced-motion` respecté partout ; navigation clavier et focus visibles.
- **Lingala** : traductions provisoires, à faire relire par un locuteur natif (`src/i18n/ln.js`).
- Connexion Google **simulée** (aucun appel réseau) : à brancher sur un vrai OAuth en production.
- Les pages légales (CGV, confidentialité, règles) sont provisoires.

## Sources (reconstruisables)
`scripts/congoflow/` — modules ES (`src/`), images WebP (`images/`),
polices (`fonts/`), logo officiel décliné (`make_logo_variants.py`),
build : `node scripts/congoflow/build.mjs` → régénère `download/congoflow.html`.
