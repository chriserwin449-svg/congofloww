# CongoFlow 🇨🇩

**Ta ville bouge. Suis le flow.** Découvre, publie et suis les événements de ta ville :
fil à swiper, stories éphémères 24 h, hype en temps réel, priorité à ta ville.

## Démo rapide

Ouvre simplement **`index.html`** dans un navigateur (aucun serveur ni installation requis —
tout est inline : images, polices, code).

- Connexion démo : `demo@congoflow.cd` / `demo1234`
- Ou crée un compte en 30 s (données stockées localement, aucune donnée envoyée)

## Fonctionnalités

| | |
|---|---|
| 🔥 **Fil à swiper** | Carte-affiche 4:5, rail d'actions façon TikTok, pile de 3 cartes, tampons J'AIME/PASSER. |
| 🏙️ **Priorité à ta ville** | 15 villes (Kinshasa, Lubumbashi, Goma, Boma, Matadi…), détection GPS/IP, seuil de hype national. |
| 🗓️ **Agenda + rappels** | Un rappel avant chaque événement que tu aimes. |
| 📣 **Publication en 4 étapes** | Affiche, prix (USD/CDF), ville, réglages — brouillons et programmation inclus. |
| 📈 **Hype** | Score live (vues, likes, commentaires, partages, enregistrements, boosts) + jauge. |
| ⭕ **Stories 24 h** | Photos éphémères façon Instagram. |
| 👤 **Profils enrichis** | Bandeau, badges, hype du profil, progression, mini-stats organisateur, menu ⋯ par post. |
| 🔍 **Recherche 3 onglets** | Événements / Comptes / Hashtags, tendances sans compteurs, pages hashtag façon TikTok. |
| 🌍 **Trilingue** | Français · English · Lingala (⚠︎ lingala à faire relire par un locuteur natif). |
| 📱 **PWA** | Installable, événements aimés disponibles hors connexion. |
| 🖼️ **Landing soignée** | Hero 2 lignes + téléphone animé à droite, bandeau d'images défilant (2 rangées, sens inverse), 5 cartes « Pourquoi » superposées qui se déplient au scroll et se replient en remontant, responsive mobile/tablette/desktop. |

## Structure du dépôt

```
index.html              ← l'application complète (fichier unique autonome)
download/congoflow.html ← même application (copie de livraison)
scripts/congoflow/      ← sources modulaires + build
  src/                  ← modules ES (app, feed, pages, i18n fr/en/ln, css…)
  images/ fonts/        ← assets (WebP inline au build)
  build.mjs             ← node scripts/congoflow/build.mjs → régénère index.html
  audit_dom.py          ← audit DOM automatisé multi-viewports (Playwright)
  audit_flow.py         ← test du parcours utilisateur complet
  audit_contrast.py     ← audit de contraste WCAG
```

## Développer

```bash
node scripts/congoflow/build.mjs        # régénère le HTML autonome
python scripts/congoflow/audit_dom.py   # audit layout (5 viewports)
python scripts/congoflow/audit_flow.py  # parcours complet automatisé
```

Puis ouvre `index.html` — c'est tout (pas de bundler, pas de dépendances runtime).

## Déploiement (Vercel)

1. Importe ce dépôt sur [vercel.com/new](https://vercel.com/new)
2. Framework Preset : **Other** · Build Command : *(vide)* · Output Directory : *(racine)*
3. Deploy → chaque `git push` redéploie automatiquement.

## État du projet

Démo fonctionnelle (données en `localStorage`, backend non branché) :
connexion Google simulée, modération simulée, Lingala à faire relire par un locuteur natif.
