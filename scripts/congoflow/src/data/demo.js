// CongoFlow — Données de démonstration (RDC, Kinshasa)
// Personnes fictives, lieux réels génériques de Kinshasa, dates relatives à la date du jour.
// Les événements e1..e12 utilisent les affiches générées ; dates calculées par rapport à aujourd'hui.

export const COMMUNES = ['Gombe', 'Lingwala', 'Kalamu', 'Bandalungwa', 'Limete', 'Ngaliema', 'Kasa-Vubu', 'Lemba', 'Mont-Ngafula', 'Matete', 'Barumbu', 'Ngiri-Ngiri'];

// offset en jours par rapport à aujourd'hui, heure de début
export function demoEvents() {
  const d = (off, h, m = 0) => { const t = new Date(); t.setDate(t.getDate() + off); t.setHours(h, m, 0, 0); return t.toISOString(); };
  return [
    {
      id: 'e1', img: 'rumba', category: 'concert', price: { on: true, amount: 15, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Rumba Nights — Grand concert en plein air', en: 'Rumba Nights — Big open-air concert', ln: 'Rumba Nights — Grand concert na libanda' },
      sub: { fr: 'Édition spéciale : hommage aux grands orchestres', en: 'Special edition: tribute to the great orchestras', ln: 'Édition spéciale : hommage aux grands orchestres' },
      desc: { fr: 'Une soirée dédiée à la rumba congolaise, avec deux orchestres sur scène et des invités surprises. Viens danser sous les étoiles au bord du fleuve. Buvette et grillades sur place.', en: 'An evening dedicated to Congolese rumba, with two orchestras on stage and surprise guests. Come dance under the stars by the river. Drinks and grills on site.', ln: 'Soirée moko ya rumba ya Congo, na orchestres mibale na scène mpe bopesi mpia ya nsango. Ya kwea na kala ya minzoto pembeni ya mai. Buvette mpe grillades ezali.' },
      program: { fr: '18h : ouverture des portes · 19h : premier orchestre · 20h30 : formation principale · 23h : descente au fleuve', en: '6pm: doors open · 7pm: first orchestra · 8:30pm: main band · 11pm: riverside after', ln: '18h : bibuangeli efungwami · 19h : orchestre ya liboso · 20h30 : formation ya ntina · 23h : nzela ya mai' },
      practical: { fr: 'Prévoir une tenue légère. Parking surveillé. Enfants accompagnés bienvenus.', en: 'Light clothing recommended. Guarded parking. Supervised children welcome.', ln: 'Tenue ya pete esengeli. Parking ya bombo. Bana ya makambu balekami.' },
      organizer: 'u3', date: d(3, 19), commune: 'Ngaliema', area: 'Ngaliema', addr: 'Esplanade du fleuve, avenue des Palmiers',
      hashtags: ['rumba', 'concertkin', 'musiquelive', 'weekendakin'],
      stats: { views: 3200, likes: 410, comments: 87, shares: 64, saves: 130, boosts: 52 }, ts: d(-6, 12),
    },
    {
      id: 'e2', img: 'club', category: 'party', price: { on: true, amount: 10, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: false,
      title: { fr: 'Afro Vibes — Soirée dansante', en: 'Afro Vibes — Dance night', ln: 'Afro Vibes — Soirée ya kala' },
      sub: { fr: 'DJs residents + invité de Brazzaville', en: 'Resident DJs + guest from Brazzaville', ln: 'DJs residents + mopya ya Brazzaville' },
      desc: { fr: 'La piste la plus chaude de la Gombe ce vendredi. Afrobeat, amapiano et un peu de ndombolo jusqu\u2019au petit matin.', en: 'The hottest floor in Gombe this Friday. Afrobeat, amapiano and a bit of ndombolo until the early morning.', ln: 'Piste ya moto mingi na Gombe vendredi oyo. Afrobeat, amapiano mpe ndombolo moke tika na tongo.' },
      program: { fr: '22h : ouverture · 23h : DJ set 1 · 1h : guest · 4h : fermeture', en: '10pm: opening · 11pm: DJ set 1 · 1am: guest · 4am: closing', ln: '22h : efungwami · 23h : DJ set 1 · 1h : mopya · 4h : ekangami' },
      practical: { fr: 'Tenue chic exigée. Entrée refusée aux mineurs.', en: 'Chic dress code. Minors refused.', ln: 'Tenue ya chic esengeli. Baya ya moke bakangami.' },
      organizer: 'u2', date: d(2, 22), commune: 'Gombe', area: 'Gombe', addr: 'Rooftop Triomphe, boulevard du 30 Juin',
      hashtags: ['afrovibes', 'nightlife', 'amapiano', 'gombe'],
      stats: { views: 5100, likes: 620, comments: 103, shares: 140, saves: 98, boosts: 61 }, ts: d(-4, 10),
    },
    {
      id: 'e3', img: 'conf', category: 'conference', price: { on: false, amount: 0, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Kinshasa Tech Meetup — Jeunes entrepreneurs', en: 'Kinshasa Tech Meetup — Young entrepreneurs', ln: 'Kinshasa Tech Meetup — Baya ya mikolo' },
      sub: { fr: 'Comment lancer son activité avec peu de moyens', en: 'How to launch your business with little money', ln: 'Ndenge ya kobanda business na mbongo ya moke' },
      desc: { fr: 'Trois entrepreneurs kinois racontent leur parcours : premiers clients, erreurs à éviter, financement. Session de questions-réponses ouverte à tous.', en: 'Three Kinshasa entrepreneurs share their journey: first clients, mistakes to avoid, funding. Open Q&A session for everyone.', ln: 'Bayamotoro misato ya Kin balobaka nzela na bango : bakliya ya liboso, mabe ya kopekisa, mbongo. Mituna-na-bamakomi ya bobuki epai ya bato nyonso.' },
      program: { fr: '9h : accueil · 9h30 : témoignages · 11h : atelier · 12h30 : networking', en: '9am: welcome · 9:30am: talks · 11am: workshop · 12:30pm: networking', ln: '9h : bokboli · 9h30 : balobeli · 11h : atelier · 12h30 : networking' },
      practical: { fr: 'Entrée libre, inscription conseillée. Café offert.', en: 'Free entry, registration recommended. Coffee offered.', ln: 'Kokota ya boboto, inscription ya ntina. Kafe ya boboto.' },
      organizer: 'u5', date: d(6, 9), commune: 'Gombe', area: 'Gombe', addr: 'Hub Kin, avenue Colonel Mondjiba',
      hashtags: ['techkin', 'entrepreneuriat', 'networking', 'gratuit'],
      stats: { views: 1800, likes: 210, comments: 45, shares: 52, saves: 160, boosts: 18 }, ts: d(-3, 9),
    },
    {
      id: 'e4', img: 'foot', category: 'sport', price: { on: true, amount: 3, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: false,
      title: { fr: 'Tournoi de football des quartiers — Demi-finales', en: 'Neighborhood football tournament — Semi-finals', ln: 'Tournoi ya football ya quartier — Demi-finales' },
      sub: { fr: 'Bandal vs Kalamu, la revanche', en: 'Bandal vs Kalamu, the rematch', ln: 'Bandal na Kalamu, limpingi' },
      desc: { fr: 'Le tournoi qui chauffe les fins de semaine de Bandalungwa. Ambiance garantie, buvette et maboke pour tout le monde.', en: 'The tournament that heats up Bandalungwa weekends. Guaranteed atmosphere, drinks and grilled skewers for everyone.', ln: 'Tournoi oyo esalisaka moto ya weekend na Bandalungwa. Ambiance ya solo, buvette mpe maboke epai ya bato nyonso.' },
      program: { fr: '15h : première demi-finale · 17h : seconde demi-finale · 19h : concert de clôture', en: '3pm: first semi-final · 5pm: second semi-final · 7pm: closing concert', ln: '15h : demi-finale ya liboso · 17h : ya mibale · 19h : concert ya botuli' },
      practical: { fr: 'Tribunes ombragées, chaises longues en bord de terrain.', en: 'Shaded stands, deckchairs by the pitch.', ln: 'Tribunes ya mpuyu, chaises longues pembeni ya terrain.' },
      organizer: 'u4', date: d(5, 15), commune: 'Bandalungwa', area: 'Bandal', addr: 'Stade Saint-Jean, avenue Kimbuta',
      hashtags: ['footballkin', 'sport', 'bandal', 'weekendakin'],
      stats: { views: 4400, likes: 380, comments: 120, shares: 85, saves: 210, boosts: 44 }, ts: d(-8, 16),
    },
    {
      id: 'e5', img: 'wax', category: 'fair', price: { on: true, amount: 5, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Foire du Pagne & de la Mode — Édition 4', en: 'Wax & Fashion Fair — 4th edition', ln: 'Foire ya Pagne & Mode — Édition 4' },
      sub: { fr: '30 créateurs, défilés et ateliers couture', en: '30 designers, runway shows and sewing workshops', ln: 'Bakrei 30, défilés mpe atelier ya couture' },
      desc: { fr: 'Le rendez-vous des créateurs de mode kinois. Pagne contemporain, accessoires, défilés chaque heure et ateliers pour apprendre à coudre.', en: 'The meeting point for Kinshasa fashion designers. Contemporary wax, accessories, hourly runway shows and sewing workshops.', ln: 'Esika ya bokutani ya bakrei ya mode ya Kin. Pagne ya sikoyo, accessoires, défilés na ngonga nyonso mpe atelier ya kosolola.' },
      program: { fr: '10h : ouverture · 12h : défilé 1 · 14h : atelier enfants · 16h : grand défilé · 19h : clôture', en: '10am: opening · 12pm: show 1 · 2pm: kids workshop · 4pm: grand show · 7pm: closing', ln: '10h : efungwami · 12h : défilé 1 · 14h : atelier bana · 16h : défilé ya ntina · 19h : botuli' },
      practical: { fr: 'Paiement en USD et CDF accepté sur tous les stands.', en: 'USD and CFD payment accepted on all stands.', ln: 'Mbongo USD na CDF endimami na stand nyonso.' },
      organizer: 'u6', date: d(9, 10), commune: 'Lingwala', area: 'Lingwala', addr: 'Halle de la Gare, boulevard du 30 Juin',
      hashtags: ['pagne', 'mode', 'wax', 'createurskin'],
      stats: { views: 2900, likes: 470, comments: 66, shares: 74, saves: 190, boosts: 37 }, ts: d(-5, 11),
    },
    {
      id: 'e6', img: 'gospel', category: 'church', price: { on: false, amount: 0, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: false,
      title: { fr: 'Nuit de Louange — Chorale Unie de Kinshasa', en: 'Night of Praise — United Choir of Kinshasa', ln: 'Nuit ya Louange — Chorale Unie ya Kinshasa' },
      sub: { fr: 'Chorales de 12 communes réunies', en: 'Choirs from 12 communes together', ln: 'Bachorale ya commune 12 esangisami' },
      desc: { fr: 'Une nuit de chants et de louange avec les chorales de douze communes. Entrée libre, offrande libre.', en: 'A night of songs and praise with choirs from twelve communes. Free entry, free offering.', ln: 'Nuit moko ya nzembo na louange na bachorale ya commune zomi na mibale. Kokota ya boboto, offrande ya boboto.' },
      program: { fr: '19h : accueil · 20h : louange · 22h : témoignages · 23h30 : prière', en: '7pm: welcome · 8pm: praise · 10pm: testimonies · 11:30pm: prayer', ln: '19h : bokboli · 20h : louange · 22h : banzeni · 23h30 : losambo' },
      practical: { fr: 'Tenue sobre conseillée. Espace prévu pour les familles.', en: 'Sober attire recommended. Family space available.', ln: 'Tenue ya moninga esengeli. Esika ya libota ezali.' },
      organizer: 'u7', date: d(1, 19), commune: 'Kalamu', area: 'Kalamu', addr: 'Église Centrale, avenue Kasa-Vubu',
      hashtags: ['gospel', 'louange', 'chorale', 'gratuit'],
      stats: { views: 2600, likes: 520, comments: 38, shares: 96, saves: 150, boosts: 29 }, ts: d(-2, 14),
    },
    {
      id: 'e7', img: 'gastro', category: 'fair', price: { on: true, amount: 7, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Kin Food Fest — Festival gastronomique', en: 'Kin Food Fest — Food festival', ln: 'Kin Food Fest — Festival ya bilei' },
      sub: { fr: 'Les saveurs des 26 provinces sur une terrasse', en: 'Flavors of the 26 provinces on one terrace', ln: 'Bilei ya province 26 na terrasse moko' },
      desc: { fr: 'Chope, pondu, mbenga, misangu… Vingt cuisiniers kinois se disputent le prix du meilleur plat. Dégustations à petits prix.', en: 'Chope, pondu, mbenga, misangu… Twenty Kinshasa cooks compete for the best dish award. Tastings at small prices.', ln: 'Chope, pondu, mbenga, misangu… Baklisti 20 ya Kin balinganaka na prix ya bilei ya malamu. Kolia na mbongo ya moke.' },
      program: { fr: '11h : ouverture · 13h : concours · 16h : atelier cuisine · 20h : remise des prix', en: '11am: opening · 1pm: contest · 4pm: cooking class · 8pm: awards', ln: '11h : efungwami · 13h : likanisi · 16h : atelier · 20h : bopesi prix' },
      practical: { fr: 'Terrasse couverte, place assise limitée — viens tôt.', en: 'Covered terrace, limited seating — come early.', ln: 'Terrasse ya ekangi, esika ya kitoko ya moke — ya liboso.' },
      organizer: 'u8', date: d(12, 11), commune: 'Limete', area: 'Limete', addr: 'Terrasse Salon Vert, avenue Kasa-Vubu',
      hashtags: ['gastro', 'foodkin', 'pondu', 'sortirakin'],
      stats: { views: 3900, likes: 530, comments: 92, shares: 118, saves: 240, boosts: 48 }, ts: d(-7, 12),
    },
    {
      id: 'e8', img: 'roof', category: 'party', price: { on: true, amount: 20, cur: 'USD' }, allowComments: true, showLikes: false, allowMessages: true,
      title: { fr: 'Sunset Rooftop — Anniversaire Kinshasa', en: 'Sunset Rooftop — Kinshasa Anniversary', ln: 'Sunset Rooftop — Anniversaire ya Kinshasa' },
      sub: { fr: 'Cocktail, vue sur le fleuve et DJ set', en: 'Cocktail, river view and DJ set', ln: 'Cocktail, vue ya mai mpe DJ set' },
      desc: { fr: 'Un anniversaire privé ouvert aux amis du flow : cocktails signature, coucher de soleil sur le fleuve et DJ set chill.', en: 'A private birthday opened to friends of the flow: signature cocktails, sunset over the river and a chill DJ set.', ln: 'Anniversaire ya mbala oyo efungwami epai ya baninga ya flow : cocktails, kokwea ya moi na mai mpe DJ set ya chill.' },
      program: { fr: '17h : accueil · 18h : coucher de soleil · 19h30 : gâteau · 21h : DJ set', en: '5pm: welcome · 6pm: sunset · 7:30pm: cake · 9pm: DJ set', ln: '17h : bokboli · 18h : kokwea ya moi · 19h30 : gâteau · 21h : DJ set' },
      practical: { fr: 'Réservation obligatoire, places limitées à 80.', en: 'Booking required, limited to 80 places.', ln: 'Reservation esengeli, esika 80 nde ezali.' },
      organizer: 'u9', date: d(4, 17), commune: 'Gombe', area: 'Gombe', addr: 'Le Toit de la Gombe, avenue de la Justice',
      hashtags: ['rooftop', 'sunset', 'cocktails', 'gombe'],
      stats: { views: 2100, likes: 290, comments: 41, shares: 48, saves: 87, boosts: 22 }, ts: d(-1, 15),
    },
    {
      id: 'e9', img: 'club', category: 'concert', price: { on: true, amount: 12, cur: 'USD' }, allowComments: false, showLikes: true, allowMessages: false,
      title: { fr: 'Live Jazz au Sous-Sol', en: 'Live Jazz at the Sous-Sol', ln: 'Live Jazz na Sous-Sol' },
      sub: { fr: 'Trio piano-contrebasse-batterie, session acoustique', en: 'Piano-bass-drums trio, acoustic session', ln: 'Trio piano-contrebasse-batterie, session ya acoustique' },
      desc: { fr: 'Le club le plus intime de la Gombe ouvre ses portes pour une session jazz acoustique. Capacité limitée, réservation conseillée.', en: 'The most intimate club in Gombe opens for an acoustic jazz session. Limited capacity, booking recommended.', ln: 'Club ya kitoko na Gombe efungwami mpo na session ya jazz. Esika ya moke, reservation ya ntina.' },
      program: { fr: '20h : set 1 · 21h15 : pause · 21h45 : set 2', en: '8pm: set 1 · 9:15pm: break · 9:45pm: set 2', ln: '20h : set 1 · 21h15 : pause · 21h45 : set 2' },
      practical: { fr: 'Silence demandé pendant les morceaux.', en: 'Silence requested during the pieces.', ln: 'Kimya esengeli na ntango ya nzembo.' },
      organizer: 'u2', date: d(7, 20), commune: 'Gombe', area: 'Gombe', addr: 'Le Sous-Sol, avenue Majestic',
      hashtags: ['jazz', 'live', 'acoustique', 'gombe'],
      stats: { views: 1400, likes: 190, comments: 0, shares: 31, saves: 74, boosts: 12 }, ts: d(-9, 18),
    },
    {
      id: 'e10', img: 'conf', category: 'conference', price: { on: false, amount: 0, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Atelier Photographie de Rue — Kin la Belle', en: 'Street Photography Workshop — Kin la Belle', ln: 'Atelier ya Photo ya Rue — Kin la Belle' },
      sub: { fr: 'Balade photo guidée dans le centre', en: 'Guided photo walk downtown', ln: 'Lilota ya photo na centre' },
      desc: { fr: 'Trois heures de balade photo dans le centre-ville avec un photographe kinois : cadrage, lumière, portraits de rue. Tous niveaux.', en: 'Three hours of photo walk downtown with a Kinshasa photographer: framing, light, street portraits. All levels.', ln: 'Ntuku misato ya lilota ya photo na centre-ville na mopaya-foto ya Kin : cadrage, lumière, portraits ya rue. Niveau nyonso.' },
      program: { fr: '9h : théorie express · 10h : balade · 12h30 : retour et critique', en: '9am: express theory · 10am: walk · 12:30pm: return and review', ln: '9h : théorie express · 10h : lilota · 12h30 : kozonga na critique' },
      practical: { fr: 'Amène ton téléphone ou ton appareil photo.', en: 'Bring your phone or your camera.', ln: 'Yaka na telefone na yo to appareil photo.' },
      organizer: 'u5', date: d(10, 9), commune: 'Kasa-Vubu', area: 'Kasa-Vubu', addr: 'Rendez-vous Place du 30 Juin',
      hashtags: ['photo', 'atelier', 'kinlabelle', 'gratuit'],
      stats: { views: 950, likes: 130, comments: 22, shares: 26, saves: 66, boosts: 9 }, ts: d(-10, 10),
    },
    {
      id: 'e11', img: 'gospel', category: 'culture', price: { on: true, amount: 2, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: true,
      title: { fr: 'Soirée Contes & Poésie au Kasa', en: 'Tales & Poetry Night at Kasa', ln: 'Soirée ya Makomi & Poesie na Kasa' },
      sub: { fr: 'Conteurs et slameurs de la scène kinoise', en: 'Storytellers and slammers of the Kinshasa scene', ln: 'Baklisti ya makomi mpe slameurs ya Kin' },
      desc: { fr: 'Une soirée de contes traditionnels et de slam en français et lingala. Ouverture par les enfants de l\u2019école du quartier.', en: 'An evening of traditional tales and slam in French and Lingala. Opening by the neighborhood school children.', ln: 'Soirée moko ya makomi ya kala mpe slam na français mpe lingala. Ebandeli na bana ya école ya quartier.' },
      program: { fr: '18h : enfants · 19h : conteurs · 20h30 : slam · 21h30 : scène ouverte', en: '6pm: children · 7pm: storytellers · 8:30pm: slam · 9:30pm: open stage', ln: '18h : bana · 19h : baklisti · 20h30 : slam · 21h30 : scène ya bobuki' },
      practical: { fr: 'Petite buvette solidaire, bénéfice pour l\u2019école.', en: 'Small solidarity bar, proceeds to the school.', ln: 'Buvette ya boboto, mbongo ekoya na école.' },
      organizer: 'u7', date: d(8, 18), commune: 'Kalamu', area: 'Kalamu', addr: 'Maison de la Culture, avenue 17 Mai',
      hashtags: ['contes', 'slam', 'culture', 'poesie'],
      stats: { views: 1200, likes: 160, comments: 34, shares: 28, saves: 51, boosts: 11 }, ts: d(-11, 13),
    },
    {
      id: 'e12', img: 'foot', category: 'sport', price: { on: false, amount: 0, cur: 'USD' }, allowComments: true, showLikes: true, allowMessages: false,
      title: { fr: 'Course solidaire « Kin Court » — 5 km', en: 'Charity run “Kin Runs” — 5 km', ln: 'Course ya boboto « Kin Court » — 5 km' },
      sub: { fr: 'Au profit de l\u2019école primaire de Matonge', en: 'For the Matonge primary school', ln: 'Mpo na école primaire ya Matonge' },
      desc: { fr: 'Cinq kilomètres dans les rues de Matonge, au profit d\u2019une école primaire. Chrono officiel, t-shirts pour les 100 premiers inscrits.', en: 'Five kilometers through the streets of Matonge, for a primary school. Official timing, t-shirts for the first 100 registered.', ln: 'Kilomètre 5 na banzela ya Matonge, mpo na école primaire. Chrono officiel, t-shirts mpo na liboso 100.' },
      program: { fr: '7h : retrait des dossards · 8h : départ · 9h30 : récompenses', en: '7am: bib pickup · 8am: start · 9:30am: awards', ln: '7h : dossards · 8h : bandela · 9h30 : bopesi prix' },
      practical: { fr: 'Point d\u2019eau tous les 2 km. Encadrement médical présent.', en: 'Water point every 2 km. Medical staff present.', ln: 'Mai na kilomètre 2. Baklisti ya minganga bazali.' },
      organizer: 'u4', date: d(14, 8), commune: 'Kalamu', area: 'Matonge', addr: 'Départ Place Yolo',
      hashtags: ['course', 'solidarite', 'sport', 'gratuit'],
      stats: { views: 1700, likes: 240, comments: 40, shares: 58, saves: 130, boosts: 19 }, ts: d(-12, 9),
    },
  ];
}

// Profils (organisateurs fictifs, divers)
export const demoUsers = [
  { id: 'u2', name: 'Didier Mwanza', username: 'didier.m', bio: { fr: 'Organisateur de soirées à la Gombe. Le rooftop c\u2019est ma maison.', en: 'Party organizer in Gombe. The rooftop is my home.', ln: 'Organisateur ya soirée na Gombe. Rooftop nde ndako na ngai.' }, verified: true, followers: 2840, following: 130, posts: 34, color: '#9B1C28' },
  { id: 'u3', name: 'Fanny Lokwa', username: 'fanny.l', bio: { fr: 'Productrice de concerts. La rumba, c\u2019est la vie.', en: 'Concert producer. Rumba is life.', ln: 'Productrice ya concerts. Rumba nde bomoi.' }, verified: true, followers: 5210, following: 89, posts: 56, color: '#0E0E10' },
  { id: 'u4', name: 'Serge Ilunga', username: 'serge.i', bio: { fr: 'Le sport réunit, j\u2019organise ça à Bandal.', en: 'Sport brings people together, I organize it in Bandal.', ln: 'Sport esangisa bato, nay organiser na Bandal.' }, verified: false, followers: 980, following: 210, posts: 18, color: '#2E7D5B' },
  { id: 'u5', name: 'Grâce Kabuya', username: 'grace.k', bio: { fr: 'Tech & formation. J\u2019aide les jeunes à lancer leurs projets.', en: 'Tech & training. I help young people launch their projects.', ln: 'Tech & formation. Nasalisa bana ya mikolo na kobanda projet.' }, verified: true, followers: 3130, following: 402, posts: 41, color: '#9B1C28' },
  { id: 'u6', name: 'Maman Ngiza', username: 'maman.ngiza', bio: { fr: 'Créatrice de mode, reine du pagne.', en: 'Fashion designer, queen of wax.', ln: 'Créatrice ya mode, ngangi ya pagne.' }, verified: true, followers: 7640, following: 55, posts: 88, color: '#0E0E10' },
  { id: 'u7', name: 'Pasteur Élie', username: 'pasteur.elie', bio: { fr: 'Servir par le chant et la parole.', en: 'Serving through song and word.', ln: 'Kosalela na nzembo na liloba.' }, verified: false, followers: 1540, following: 12, posts: 23, color: '#2E7D5B' },
  { id: 'u8', name: 'Chef Fabi', username: 'chef.fabi', bio: { fr: 'Cuisinière, passionnée de chikwangue et de pondu.', en: 'Cook, passionate about chikwangue and pondu.', ln: 'Moklisti ya bilei, na mposa ya chikwangue na pondu.' }, verified: false, followers: 2210, following: 178, posts: 29, color: '#9B1C28' },
  { id: 'u9', name: 'Naomi Kanku', username: 'naomi.k', bio: { fr: 'Rooftops, cocktails et sunsets. Gombe girl.', en: 'Rooftops, cocktails and sunsets. Gombe girl.', ln: 'Rooftops, cocktails mpe sunsets. Mwana ya Gombe.' }, verified: false, followers: 1120, following: 340, posts: 15, color: '#0E0E10' },
];

// Notifications de démonstration (pour l'utilisateur démo)
export const demoNotifications = [
  { id: 'n1', type: 'like', user: 'u2', event: 'e5', ago: 2 },
  { id: 'n2', type: 'boost', user: 'u3', event: 'e5', ago: 3 },
  { id: 'n3', type: 'follow', user: 'u6', ago: 5 },
  { id: 'n4', type: 'comment', user: 'u8', event: 'e5', text: { fr: 'On sera là avec toute la famille !', en: 'We\u2019ll be there with the whole family!', ln: 'Tokoya na libota mobimba !' }, ago: 7 },
  { id: 'n5', type: 'suggestion', user: 'u3', ago: 26 },
];

// Conversations de démonstration
export const demoConversations = [
  {
    id: 'c1', user: 'u3', messages: [
      { id: 'm1', from: 'u3', text: { fr: 'Bonjour ! Bienvenue sur CongoFlow 🎉', en: 'Hello! Welcome to CongoFlow 🎉', ln: 'Mbote ! Boyei malamu na CongoFlow 🎉' }, t: -3 },
      { id: 'm2', from: 'me', text: { fr: 'Merci ! J\u2019hâte d\u2019être au concert de rumba.', en: 'Thanks! Can\u2019t wait for the rumba concert.', ln: 'Merci ! Nazali kozela concert ya rumba.' }, t: -3, seen: true },
      { id: 'm3', from: 'u3', text: { fr: 'Viens tôt, les meilleures places partent vite 😉', en: 'Come early, the best seats go fast 😉', ln: 'Yaka ya liboso, esika ya malamu ezali kosila nsembu 😉' }, t: -2 },
    ],
  },
  {
    id: 'c2', user: 'u5', messages: [
      { id: 'm4', from: 'u5', text: { fr: 'Salut ! Tu viens au meetup tech de samedi ?', en: 'Hi! Are you coming to Saturday\u2019s tech meetup?', ln: 'Mbote ! Okei na meetup tech ya samedi ?' }, t: -1 },
    ],
  },
  {
    id: 'c3', user: 'u8', messages: [
      { id: 'm5', from: 'u8', text: { fr: 'Il restera des plats végétariens au Food Fest ?', en: 'Will there be vegetarian dishes left at the Food Fest?', ln: 'Bilei ya bonyama te ekozala na Food Fest ?' }, t: -1 },
      { id: 'm6', from: 'me', text: { fr: 'Bien sûr, arrive avant 13h pour avoir le choix !', en: 'Of course, arrive before 1pm to have the choice!', ln: 'Ya solo, yaka liboso ya 13h mpo na pona !' }, t: -1 },
    ],
  },
];

// Suggestions de hashtags pendant la frappe (publier) + tendances
export const demoHashtagPool = ['rumba', 'concertkin', 'musiquelive', 'weekendakin', 'afrovibes', 'nightlife', 'amapiano', 'gombe', 'techkin', 'entrepreneuriat', 'networking', 'gratuit', 'footballkin', 'sport', 'bandal', 'pagne', 'mode', 'wax', 'createurskin', 'gospel', 'louange', 'chorale', 'gastro', 'foodkin', 'pondu', 'sortirakin', 'rooftop', 'sunset', 'cocktails', 'jazz', 'live', 'acoustique', 'photo', 'atelier', 'kinlabelle', 'contes', 'slam', 'culture', 'poesie', 'course', 'solidarite'];
