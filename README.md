# CongoFlow 🇨🇩

**Les événements de Kinshasa, dans ta poche.** Découvre, publie et suis les événements
près de chez toi : fil à swiper, stories éphémères 24 h, hype en temps réel.

## Démo rapide

Ouvre simplement **`index.html`** dans un navigateur (aucun serveur ni installation requis —
tout est inline : images, polices, code).

- Connexion démo : `demo@congoflow.cd` / `demo1234`
- Ou crée un compte en 30 s (données stockées localement, aucune donnée envoyée)

## Fonctionnalités

| | |
|---|---|
| 🔥 **Fil à swiper** | Droite = j'aime, gauche = je passe. Un geste, et l'événement est dans ton agenda. |
| 📅 **Rappels** | Des notifications avant chaque événement que tu as aimé. |
| 📣 **Publication** | Ton affiche, ton prix, tes règles — en quelques minutes, sans intermédiaire. |
| 📈 **Hype** | Vois quels événements montent, en temps réel. |
| ⭕ **Stories 24 h** | Photos éphémères façon Instagram, visibles 24 h par tes abonnés. |
| 👤 **Profils** | Photo de profil, abonnés, événements publiés. |
| 🔍 **Recherche** | Événements, lieux, hashtags + tendances du moment. |
| 🌍 **Trilingue** | Français · English · Lingala |

## Structure du dépôt

```
index.html              ← l'application complète (fichier unique autonome)
download/congoflow.html ← même application (copie de livraison)
scripts/congoflow/      ← sources modulaires + build
  src/                  ← modules ES (app, feed, pages, i18n fr/en/ln, css…)
  images/ fonts/        ← assets (WebP inline au build)
  build.mjs             ← node scripts/congoflow/build.mjs → régénère index.html
```

## Développer

```bash
node scripts/congoflow/build.mjs   # régénère le HTML autonome
```

Puis ouvre `index.html` — c'est tout (pas de bundler, pas de dépendances).

## Déploiement (Vercel)

1. Importe ce dépôt sur [vercel.com/new](https://vercel.com/new)
2. Framework Preset : **Other** · Build Command : *(vide)* · Output Directory : *(racine)*
3. Deploy → URL `congoflow-xxxx.vercel.app`

Chaque `git push` redéploie automatiquement.

## État du projet

Démo fonctionnelle (données en `localStorage`, backend non branché) :
connexion Google simulée, modération simulée, Lingala à faire relire par un locuteur natif.
