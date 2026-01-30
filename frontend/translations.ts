
export type Language = 'fr' | 'en' | 'ar';

export const TRANSLATIONS = {
  fr: {
    meta: {
      homeTitle: "X-Zone Technologie | Matériel Informatique & Maintenance Maroc",
      homeDesc: "Leader IT au Maroc : Vente de serveurs, PC, intégration réseaux et contrats de maintenance pour entreprises.",
      contactTitle: "Contactez-nous | X-Zone Technologie",
      contactDesc: "Besoin d'un devis ou d'un conseil technique ? Contactez nos experts à Casablanca.",
      aboutTitle: "À propos de nous | X-Zone Technologie",
      aboutDesc: "Intégrateur informatique de référence au Maroc depuis 2001. Découvrez notre histoire et nos valeurs.",
      servicesTitle: "Nos Services IT",
      servicesDesc: "Expertise complète : Vente, Location, Maintenance, Réseaux et Sécurité.",
      shopTitle: "Catalogue Produits IT",
      shopDesc: "Serveurs, PC portables, stations de travail et équipements réseau professionnels."
    },
    nav: {
      home: "Accueil",
      company: "Entreprise",
      services: "Services",
      solutions: "Solutions",
      catalog: "Catalogue",
      resources: "Ressources",
      contact: "Contact",
      clientArea: "Espace Client",
      quote: "Demander un devis",
      search: "Recherche",
      servicesSub: {
        sales: "Vente & Intégration",
        rental: "Location de matériel",
        network: "Réseau & Infrastructure",
        maintenance: "Maintenance & Support",
        surveillance: "Vidéosurveillance",
        buyback: "Reprise de parc (Rachat)",
        diagnostic: "Audit & Diagnostic IT"
      },
      solutionsSub: {
        pme: "PME / TPE",
        education: "Éducation & Écoles",
        medical: "Santé & Médical",
        callcenter: "Centres d'Appel",
        administration: "Administrations Publiques",
        industry: "Industrie",
        logistics: "Logistique & Retail"
      },
      resourcesSub: {
        blog: "Actualités & Blog",
        knowledge: "Base de Connaissances",
        faq: "Questions Fréquentes"
      }
    },
    whatsapp: {
      productMsg: "Bonjour, je souhaiterais connaître le prix et la disponibilité de ce produit : [Product].",
      servicesMsg: "Bonjour, je suis intéressé par vos services d'intégration et de maintenance.",
      generalMsg: "Bonjour, je souhaiterais avoir plus d'informations sur vos offres."
    },
    chatbot: {
      title: "Assistant Virtuel X-Zone",
      subtitle: "Conseil & Support IA",
      placeholder: "Posez votre question ici...",
      welcome: "Bonjour ! 👋 Je suis l'assistant virtuel de X-Zone. Je peux vous aider à choisir votre matériel ou répondre à vos questions techniques. Par quoi commençons-nous ?",
      footer: "IA X-Zone • Propulsé par Gemini",
      quick: {
        pc: "🎯 Choisir un PC",
        server: "🖥️ Expert Serveur",
        support: "🔧 Support Technique"
      },
      systemPrompt: "Tu es l'Assistant Virtuel Intelligent de X-Zone Technologie. Tu dois répondre UNIQUEMENT en FRANÇAIS. Tu es expert en matériel informatique (Serveurs, PC, Réseau). Ton ton est professionnel, courtois, commercial et tu utilises le vouvoiement."
    },
    clientArea: {
        login: {
            title: "Espace Client Pro",
            subtitle: "Connectez-vous pour gérer vos commandes et tickets.",
            demoMode: "Mode Démo : Identifiants pré-remplis pour test",
            emailLabel: "Email professionnel",
            passwordLabel: "Mot de passe",
            forgotPassword: "Mot de passe oublié ?",
            rememberMe: "Se souvenir de moi",
            submitButton: "Accéder à mon espace",
            backToSite: "Retour au site web"
        },
        sidebar: {
            dashboard: "Tableau de bord",
            quotes: "Mes Devis",
            invoices: "Factures",
            orders: "Commandes",
            support: "Support & Tickets",
            documents: "Documents",
            settings: "Paramètres",
            logout: "Déconnexion"
        }
    },
    home: {
      hero: {
        since: "EXPERTISE DEPUIS 2001",
        title: "Votre Partenaire\nTechnologique de Confiance",
        subtitle: "Leader en vente, location et maintenance de matériel informatique au Maroc.\nDes solutions IT sur mesure pour propulser la croissance de votre entreprise.",
        ctaProducts: "Parcourir le catalogue",
        ctaQuote: "Demander un devis"
      },
      sectors: {
        title: "Solutions par Secteur d'Activité",
        subtitle: "Parce que chaque métier a des exigences uniques, nous avons conçu des offres dédiées."
      },
      diagnostic: {
        title: "Audit de Santé IT",
        desc: "Notre outil de diagnostic par IA analyse votre infrastructure en 2 minutes et détecte les failles de sécurité et les opportunités d'optimisation.",
        cta: "Lancer l'audit gratuit"
      },
      buyback: {
        title: "Reprise de parc informatique",
        desc: "Valorisez votre ancien matériel IT. Estimation gratuite et rachat au meilleur prix pour le recyclage ou le reconditionnement.",
        cta: "Estimer mon matériel"
      },
      services: {
        title: "Nos Domaines d'Expertise",
        subtitle: "X-Zone Technologie offre une gamme complète de services pour répondre à tous vos besoins en infrastructure IT.",
        readMore: "En savoir plus"
      },
      products: {
        title: "Sélection du moment",
        subtitle: "Une sélection de nos meilleures offres et nouveautés.",
        viewAll: "Tout le catalogue",
        quote: "Devis rapide"
      },
      ctaBottom: {
        title: "Prêt à moderniser votre infrastructure IT ?",
        subtitle: "Nos experts sont à votre disposition pour auditer vos besoins et vous proposer les solutions les plus adaptées.",
        ctaChat: "Discuter avec un expert",
        ctaCall: "Appeler maintenant"
      }
    },
    // Missing Services Page Keys Added Here
    services: {
      header: {
        title: "Nos Pôles d'Expertise",
        subtitle: "De l'audit à la maintenance, X-Zone Technologie vous propose une offre globale pour sécuriser et optimiser votre système d'information."
      },
      btnDetail: "Consulter l'offre"
    },
    about: {
      header: { 
        title: "Entreprise", 
        subtitle: "Partenaire de votre transformation numérique depuis 2001." 
      },
      presentation: {
        title: "Présentation de X-Zone Technologie",
        p1: "Fondée à Casablanca en 2001, X-Zone Technologie s’est imposée au fil des années comme un acteur majeur des services informatiques et des solutions technologiques au Maroc. Depuis plus de deux décennies, notre entreprise accompagne les organisations dans l’ensemble de leur écosystème IT : vente et location de matériel informatique, intégration de solutions, maintenance, support et infogérance.",
        p2: "Animés par une exigence constante de qualité, de performance et de fiabilité, nous avons su bâtir des relations durables et de confiance avec nos clients. Cette proximité nous permet d’agir bien au-delà d’un simple prestataire, en devenant un véritable partenaire technologique, engagé dans la réussite et la transformation numérique de chaque projet. Aujourd’hui, X-Zone Technologie est reconnue comme une référence incontournable dans plusieurs domaines de l’informatique professionnelle."
      },
      team: {
        title: "Une équipe experte, engagée et à l’écoute",
        p1: "La force de X-Zone Technologie repose avant tout sur une équipe hautement qualifiée, alliant expertise technique, expérience terrain et sens du service. Nos collaborateurs maîtrisent les technologies actuelles tout en accordant une importance essentielle aux compétences relationnelles et à la communication.",
        p2: "Entreprise à taille humaine, X-Zone Technologie s’appuie sur une équipe soudée d’une dizaine de professionnels de confiance. Cette stabilité garantit réactivité, proximité et continuité de service, et constitue le socle de la satisfaction et de la fidélité de nos clients."
      }
    },
    services_data: {
      "vente-integration": {
        title: "Vente & Intégration Matériel",
        shortDescription: "Fourniture de matériel informatique de pointe et intégration sur mesure.",
        fullDescription: "X-Zone Technologie vous accompagne dans l'acquisition et le déploiement de votre parc informatique. Nous travaillons avec les plus grands constructeurs (Dell, HP, Lenovo, Cisco) pour vous offrir des équipements fiables et performants.",
        benefits: ["Partenariats constructeurs officiels", "Conseil avant-vente personnalisé", "Installation clé en main", "Gestion des garanties constructeur"],
        features: ["Serveurs d'entreprise & Stockage", "Postes de travail & Stations graphiques", "Licences logicielles (Microsoft, Adobe)", "Périphériques & Accessoires"]
      },
      "location": {
        title: "Location de Matériel IT",
        shortDescription: "Solutions flexibles de location courte et longue durée.",
        fullDescription: "Pour vos événements, formations, pics d'activité ou besoins ponctuels, X-Zone propose un large choix de matériel informatique en location, livré et installé.",
        benefits: ["Flexibilité financière (OPEX)", "Matériel toujours récent", "Service maintenance inclus", "Remplacement rapide en cas de panne"],
        features: ["Vidéoprojecteurs & Sonorisation", "Écrans tactiles & Murs d'images", "Ordinateurs portables & Tablettes", "Imprimantes multifonctions"]
      },
      "reseau-infrastructure": {
        title: "Réseau & Infrastructure",
        shortDescription: "Câblage, switching, routing et architecture réseau sécurisée.",
        fullDescription: "Une infrastructure réseau solide est la colonne vertébrale de votre entreprise. Nos experts certifiés conçoivent, déploient et sécurisent vos réseaux LAN/WAN/WiFi.",
        benefits: ["Audit réseau complet", "Sécurité renforcée (Firewalling)", "Haute disponibilité & Redondance", "Architecture évolutive"],
        features: ["Câblage structuré (Cuivre/Fibre)", "Armoires de brassage & Salles serveurs", "Switching, Routing & WiFi Pro", "Solutions VPN & Télétravail"]
      },
      "maintenance": {
        title: "Maintenance & Infogérance",
        shortDescription: "Contrats de maintenance préventive et curative.",
        fullDescription: "Minimisez les interruptions de service avec nos contrats de maintenance sur mesure. X-Zone assure le suivi proactif de votre parc et intervient rapidement en cas d'incident.",
        benefits: ["Intervention prioritaire (SLA)", "Support téléphonique dédié", "Visites préventives régulières", "Rapports d'intervention détaillés"],
        features: ["Support Helpdesk & Prise en main à distance", "Infogérance totale ou partielle", "Réparation matériel en atelier", "Gestion des mises à jour & Patchs"]
      },
      "surveillance": {
        title: "Vidéosurveillance & Sécurité",
        shortDescription: "Protection électronique de vos locaux et données.",
        fullDescription: "Sécurisez vos actifs physiques et numériques avec nos solutions de vidéosurveillance IP, contrôle d'accès et systèmes d'alarme de dernière génération.",
        benefits: ["Vision nocturne & Haute définition", "Accès à distance via mobile", "Enregistrement sécurisé", "Alertes en temps réel"],
        features: ["Caméras IP & Thermiques", "Enregistreurs NVR & Stockage", "Contrôle d'accès biométrique/Carte", "Systèmes d'alarme connectés"]
      }
    },
    sectors_data: {
      "pme": { title: "PME / TPE", description: "Packs productivité adaptés aux petites et moyennes structures.", challenges: ["Budget maîtrisé", "Sécurité des données", "Mobilité des collaborateurs"], solutions: ["Serveurs NAS de sauvegarde", "Flotte PC Portables Pro", "Contrats de maintenance Agile"] },
      "education": { title: "Éducation", description: "Solutions numériques pour écoles, universités et centres de formation.", challenges: ["Classes connectées", "Gestion de parc tablettes", "WiFi campus haute densité"], solutions: ["Vidéoprojecteurs Interactifs", "Serveurs pédagogiques", "Licences Microsoft Éducation"] },
      "medical": { title: "Santé & Médical", description: "Fiabilité et confidentialité pour les cliniques et cabinets médicaux.", challenges: ["Confidentialité (CNDP|Loi 09-08)", "Continuité de service 24/7", "Imagerie haute définition"], solutions: ["Écrans diagnostic DICOM", "Serveurs sécurisés", "Onduleurs critiques"] },
      "call-center": { title: "Centres d'Appel", description: "Performance et stabilité pour les plateaux téléphoniques.", challenges: ["Densité d'équipement", "Qualité audio (VoIP)", "Réduction du bruit ambiant"], solutions: ["Mini-PC silencieux", "Casques à réduction de bruit", "Switching QoS VoIP"] },
      "administration": { title: "Administration", description: "Solutions conformes aux standards des marchés publics.", challenges: ["Conformité aux normes", "Durabilité du matériel", "Sécurisation des accès"], solutions: ["PC Certifiés", "Archivage légal", "Contrôle d'accès physique"] },
      "industrie": { title: "Industrie", description: "Matériel durci et infrastructure pour environnements exigeants.", challenges: ["Environnements difficiles (Poussière/Chaleur)", "Continuité de production", "Connectivité IoT"], solutions: ["PC Industriels (Rugged)", "Tablettes Durcies", "Réseaux Mesh Industriels"] },
      "logistique": { title: "Logistique & Retail", description: "Optimisation de la chaîne logistique et des points de vente.", challenges: ["Gestion de stock temps réel", "Mobilité en entrepôt", "Encaissement rapide"], solutions: ["Terminaux Code-Barres", "Imprimantes Étiquettes", "Systèmes de Caisse (POS)"] }
    },
    products_data: {
      "srv-001": { name: "Serveur Pro Enterprise X1 (Dell PowerEdge)", description: "Serveur haute performance optimisé pour la virtualisation.", fullDescription: "Le Dell EMC PowerEdge R750 est le serveur d'entreprise par excellence. Conçu pour les charges de travail exigeantes comme les bases de données, la virtualisation (VMware/Hyper-V) et l'IA.", specs: ["Intel Xeon Gold", "64GB RAM DDR4 ECC", "2x 960GB SSD NVMe", "Alimentation redondante", "Garantie 3 ans J+1"] },
      "lap-001": { name: "Ultrabook Business Elite (HP EliteBook)", description: "Légèreté et puissance pour les professionnels nomades.", fullDescription: "Le HP EliteBook 840 G9 supprime les obstacles au travail hybride. Avec son design fin, sa sécurité HP Wolf Security et ses performances de pointe, c'est l'outil idéal pour les cadres.", specs: ["Core i7 13th Gen", "16GB RAM DDR5", "512GB SSD NVMe", "Écran 14\" FHD IPS", "Windows 11 Pro"] },
      "des-001": { name: "Station de Travail Graphique (Lenovo ThinkStation)", description: "Puissance de calcul brute pour le rendu 3D et l'ingénierie.", fullDescription: "Conçue pour les architectes, ingénieurs et créateurs de contenu. La ThinkStation P620 offre une fiabilité inégalée pour les logiciels CAO/DAO (AutoCAD, Revit, 3ds Max).", specs: ["Ryzen 9 Threadripper", "NVIDIA RTX 4070 12GB", "32GB RAM ECC", "1TB SSD M.2", "Certifié ISV"] },
      "net-001": { name: "Switch 24 Ports PoE+ (Cisco Catalyst)", description: "Gestion réseau avancée avec alimentation PoE pour caméras et téléphones.", fullDescription: "Offrant 24 ports PoE+ et 4 uplinks SFP+, le Cisco Catalyst 9200L est la fondation idéale pour un réseau d'entreprise sécurisé et évolutif.", specs: ["24 Ports Gigabit PoE+", "4 Ports SFP+", "Layer 3 Lite", "Garantie à vie limitée", "Cisco DNA Ready"] },
      "prt-001": { name: "Multifonction Laser Couleur (HP LaserJet Pro)", description: "Solution d'impression rapide et sécurisée pour les groupes de travail.", fullDescription: "Impression rapide, numérisation recto-verso en un seul passage et sécurité renforcée. Idéale pour les équipes de 3 à 10 personnes.", specs: ["40 ppm", "Recto-verso automatique", "Scan vers Email/Dossier", "Écran tactile couleur", "WiFi Direct"] },
      "soft-001": { name: "Licence Microsoft 365 Business Standard", description: "La suite bureautique complète et collaborative dans le cloud.", fullDescription: "Boostez la productivité de vos équipes avec Microsoft 365. Inclut les versions de bureau de Word, Excel, PowerPoint ainsi que les services cloud Exchange, Teams et SharePoint.", specs: ["Apps Office Bureau", "Messagerie Exchange 50Go", "SharePoint & Teams", "OneDrive 1TB", "Mises à jour incluses"] },
      "rent-001": { name: "Location Vidéoprojecteur 4K", description: "Idéal pour conférences, séminaires et événements.", fullDescription: "Louez un vidéoprojecteur professionnel 4K haute luminosité pour garantir l'impact de vos présentations, même dans des salles éclairées.", specs: ["5000 Lumens", "Résolution 4K UHD", "Connectique HDMI/USB-C", "Écran de projection inclus"] },
      "rent-002": { name: "Location Écran Tactile 65\"", description: "Animation interactive pour stands et réunions.", fullDescription: "Dynamisez vos présentations avec nos écrans tactiles interactifs de 65 pouces. Idéal pour la collaboration ou l'affichage dynamique sur stand.", specs: ["4K UHD", "Multitouch 20 points", "Support à roulettes inclus", "PC OPS intégré en option"] },
      "lap-002": { name: "Dell Latitude 5420 (Reconditionné Grade A)", description: "PC professionnel robuste et fiable à prix réduit.", fullDescription: "Profitez de la fiabilité Dell à petit prix. Nos PC reconditionnés sont testés sur plus de 20 points de contrôle et garantis 1 an.", specs: ["Core i5 11th Gen", "8GB RAM", "256GB SSD", "Grade A+ (État Excellent)", "Windows 10/11 Pro"] },
      "srv-002": { name: "Serveur Stockage NAS Pro (Synology)", description: "Solution de sauvegarde centralisée et partage de fichiers.", fullDescription: "Le Synology DS923+ est une solution de stockage réseau performante et évolutive pour PME. Sécurisez vos données contre les ransomwares.", specs: ["4 Baies (extensible)", "Support RAID 0/1/5/10", "2x 10GbE Ready", "OS DSM Intuitif"] }
    },
    faqPage: {
      title: "Foire Aux Questions",
      subtitle: "Trouvez rapidement des réponses aux questions les plus fréquentes.",
      categories: { all: "Tout", vente: "Vente & Achat", location: "Location", support: "Support Technique", services: "Services IT" },
      noResults: "Vous n'avez pas trouvé votre réponse ?",
      contactUs: "Contactez-nous",
      expertText: "Nos experts sont disponibles pour vous répondre directement par téléphone ou email."
    },
    knowledgePage: {
      title: "Centre de Connaissances",
      subtitle: "La base de savoir X-Zone : guides techniques, définitions et bonnes pratiques IT.",
      searchPlaceholder: "Rechercher un sujet (ex: RAID, Onduleur, Sécurité...)",
      noResults: "Aucun article ne correspond à votre recherche.",
      readTime: "de lecture",
      readMore: "Lire la suite"
    },
    blogPage: {
      title: "Actualités & Blog",
      subtitle: "Restez informé des dernières tendances technologiques et de la vie de l'entreprise.",
      readArticle: "Lire l'article",
      newsletter: { title: "Restez informé", text: "Inscrivez-vous pour recevoir les dernières actualités IT directement par email.", placeholder: "Votre email professionnel", button: "S'abonner" }
    },
    shopPage: {
      filters: { title: "Filtres", reset: "Réinitialiser", category: "Catégorie", brand: "Marque", ram: "Mémoire RAM", noResults: "Aucun produit ne correspond à votre recherche." }
    },
    servicesPage: {
      description: "Description du service",
      whyUs: "Pourquoi choisir X-Zone ?",
      features: "Solutions & Équipements inclus",
      sidebar: { needHelp: "Besoin de ce service ?", desc: "Nos experts analysent vos besoins et vous proposent un devis personnalisé sous 24h.", other: "Autres services disponibles :" }
    },
    sectorPage: {
      tag: "Solutions Sectorielles",
      challengesTitle: "Vos enjeux, nos solutions",
      challengesIntro: "Chaque secteur a ses contraintes spécifiques. Chez X-Zone Technologie, nous adaptons le matériel et l'infrastructure pour répondre aux exigences exactes de votre métier.",
      problems: "Vos Problématiques",
      solution: "L'approche X-Zone",
      cta: "Demander une offre pour",
      successStory: "Étude de Cas",
      readCase: "Lire le cas complet",
      recommendedGear: "Matériel Recommandé"
    },
    // Updated stats_data to object to support t('stats_data.years') syntax
    stats_data: {
      years: "Années d'expérience",
      clients: "Clients satisfaits",
      experts: "Experts certifiés",
      quality: "Engagement Qualité"
    },
    faq_data: [
      { category: "vente", question: "Proposez-vous des facilités de paiement ?", answer: "Oui, pour les entreprises partenaires, nous proposons des solutions de paiement échelonné ou de leasing (location financière) via nos partenaires bancaires, sous réserve d'acceptation du dossier." },
      { category: "vente", question: "Les produits sont-ils sous garantie ?", answer: "Absolument. Tout notre matériel neuf bénéficie de la garantie constructeur officielle (généralement 1 à 3 ans). Nous gérons le SAV directement pour vous auprès des fabricants." },
      { category: "location", question: "Quelle est la durée minimale de location ?", answer: "La durée minimale est d'une journée (24h). Nous proposons également des tarifs dégressifs avantageux pour les locations à la semaine ou au mois." },
      { category: "location", question: "La livraison est-elle incluse dans la location ?", answer: "La livraison et l'installation sur site à Casablanca sont incluses pour tout montant de location supérieur à 2000 MAD HT. En dehors de cette zone, des frais de déplacement peuvent s'appliquer." },
      { category: "support", question: "Quel est le délai d'intervention en cas de panne ?", answer: "Pour les clients sous contrat de maintenance, nous garantissons une intervention sur site sous 4 heures ouvrables (GTR). Pour les clients standard, l'intervention se fait généralement à J+1." },
      { category: "services", question: "Faites-vous l'audit de sécurité ?", answer: "Oui, nous réalisons des audits complets de votre infrastructure réseau et sécurité pour identifier les vulnérabilités et préconiser des mesures correctives conformes aux standards actuels." }
    ],
    stories_data: [
      { client: "Groupe Industriel Marocain", title: "Modernisation complète du Data Center", challenge: "L'infrastructure existante était obsolète et causait des arrêts de production réguliers, impactant la chaîne logistique et la facturation.", solution: "Déploiement d'un cluster de serveurs haute disponibilité (Dell VXRail) et refonte du cœur de réseau en fibre optique.", result: "0 minute d'arrêt en 12 mois, performance des applications x3, réduction de la facture énergétique de 20%." },
      { client: "Call Center International", title: "Équipement de 500 positions de travail", challenge: "Fournir et installer 500 PC complets en moins de 3 semaines pour l'ouverture urgente d'un nouveau site à Rabat.", solution: "Logistique dédiée, masterisation industrielle des PC (image disque personnalisée) et déploiement par une équipe de 10 techniciens.", result: "Livraison dans les délais, site opérationnel au jour J, taux de panne au déballage inférieur à 0.1%." }
    ],
    blog_data: {
      "b-1": { title: "La montée des Ransomwares au Maroc : Comment protéger votre PME ?", excerpt: "Analyse des menaces cybersécurité en 2025 et présentation des solutions de sauvegarde immuables pour sécuriser vos données critiques." },
      "b-2": { title: "WiFi 6E : La révolution de la connectivité en entreprise", excerpt: "Pourquoi passer au WiFi 6E ? Découvrez les avantages concrets en termes de vitesse, de latence et de capacité pour vos bureaux open-space." },
      "b-3": { title: "Serveurs : Cloud Public vs Infrastructure On-Premise", excerpt: "Le débat continue. Nous analysons les coûts réels (TCO) et les avantages de sécurité de garder vos serveurs en local au Maroc." },
      "b-4": { title: "Télétravail Sécurisé : Les indispensables IT", excerpt: "VPN, authentification double facteur (2FA) et PC portables sécurisés : le kit de survie pour vos équipes nomades." },
      "b-5": { title: "Maintenance Prédictive : N'attendez plus la panne", excerpt: "Comment l'IA et le monitoring proactif permettent d'anticiper les défaillances matérielles avant qu'elles ne bloquent votre activité." },
      "b-6": { title: "Green IT : Réduire l'empreinte carbone de votre parc", excerpt: "Adoptez une démarche RSE avec du matériel reconditionné certifié et des serveurs à haute efficacité énergétique." },
      "b-7": { title: "Comprendre les licences Microsoft 365 pour Entreprise", excerpt: "Business Basic, Standard ou Premium ? Guide complet pour choisir la bonne licence et optimiser vos coûts opérationnels." }
    },
    knowledge_data: {
      "k-1": { title: "Comprendre les niveaux RAID (0, 1, 5, 10)", excerpt: "Redondance et performance : quel niveau RAID choisir pour votre serveur de données ?", content: "Le RAID (Redundant Array of Independent Disks) est essentiel pour la sécurité des données..." },
      "k-2": { title: "Bien dimensionner son Onduleur (UPS)", excerpt: "Watts vs VA, autonomie et topologie : le guide technique pour protéger efficacement vos équipements.", content: "Un onduleur protège votre matériel contre les coupures et surtensions..." },
      "k-3": { title: "Stockage : HDD vs SSD vs NVMe", excerpt: "Comparatif des technologies de stockage pour serveurs et postes de travail : performances et usages.", content: "Le choix du disque dur impacte directement la vitesse de votre système..." },
      "k-4": { title: "Introduction à la Virtualisation Serveur", excerpt: "Hyper-V, VMware, Proxmox : comment consolider vos serveurs physiques et réduire les coûts.", content: "La virtualisation permet de faire tourner plusieurs machines virtuelles sur un seul serveur physique..." },
      "k-5": { title: "Câblage Structuré : Cat6 vs Cat6A", excerpt: "Les normes de câblage cuivre pour supporter le 10 Gigabit Ethernet dans votre bâtiment.", content: "L'infrastructure passive est la base de votre réseau..." },
      "k-6": { title: "Firewall & Sécurité Périmétrique", excerpt: "Comprendre le rôle d'un pare-feu UTM dans la protection de votre réseau local contre les intrusions.", content: "Le firewall filtre le trafic entrant et sortant pour bloquer les menaces..." },
      "k-7": { title: "La stratégie de sauvegarde 3-2-1", excerpt: "La règle d'or pour ne jamais perdre vos données professionnelles en cas de sinistre.", content: "3 copies de vos données, sur 2 supports différents, dont 1 hors site..." }
    },
    contact: {
      header: { title: "Contactez-nous", subtitle: "Une question ? Un projet ? Notre équipe vous répond sous 24h." },
      info: { title: "Nos Coordonnées", address: "Adresse", addressValue: "Bd Taza (Aïn Chok), 11-13 rue 71 hay Mly Abdellah, Aïn Chok, Casablanca, Maroc", phone: "Téléphone", email: "Email", hours: "Horaires d'ouverture", standard: "Standard", commercial: "Commercial", support: "Support Technique", openHours: "Lundi - Vendredi : 08:30 - 18:30", saturday: "Samedi : 09:00 - 13:00", closed: "Dimanche : Fermé" },
      form: { title: "Envoyez-nous un message", name: "Nom et Prénom", phone: "Téléphone", email: "Email professionnel", subject: "Sujet", message: "Votre message", submit: "Envoyer mon message", successTitle: "Message envoyé avec succès", successDesc: "Merci. Notre équipe vous contactera dans les plus brefs délais.", disclaimer: "En soumettant ce formulaire, vous acceptez que vos données soient traitées pour répondre à votre demande.", subjects: { select: "Sélectionnez un sujet", quote: "Demande de devis", info: "Renseignements Services", support: "Support Technique", partner: "Partenariat / Fournisseur", other: "Autre demande" } }
    },
    footer: { desc: "Votre partenaire technologique de confiance au Maroc depuis 2001. Solutions informatiques, intégration réseaux et location de matériel.", links: "Accès Rapide", services: "Nos Services", contact: "Contact", rights: "Tous droits réservés.", address: "Bd Taza (Aïn Chok), 11-13 rue 71 hay Mly Abdellah, Aïn Chok, Casablanca, Maroc" },
    trust: { exp: "23 ans d'expérience", expDesc: "Expertise prouvée depuis 2001", clients: "+2000 clients", clientsDesc: "La référence au Maroc", expert: "Expert Serveurs", expertDesc: "Certification HPE & Dell", support: "Support Pro", supportDesc: "Intervention rapide J+1", custom: "Sur Mesure", customDesc: "Solutions 100% adaptées" },
    common: { 
      readMore: "En savoir plus", 
      download: "Télécharger", 
      seeProduct: "Détails", 
      askQuote: "Demander un devis", 
      addToCart: "Ajouter au panier",
      addedToCart: "Ajouté au panier !",
      loading: "Chargement en cours...", 
      error: "Une erreur est survenue", 
      price_on_request: "Sur devis", 
      promo: "Promo", 
      new: "Nouveau", 
      bestSeller: "Meilleure Vente", 
      rental: "LOCATION", 
      viewDetails: "Voir les détails", 
      refurbished: "Reconditionné", 
      refurbishedPremium: "Reconditionné Premium",
      condition: "État",
      conditionNew: "Neuf",
      specWarranty: "Spécifications & Garantie", 
      technicalDocs: "Documentation Technique", 
      dataSheet: "Fiche Technique Complète", 
      installGuide: "Guide d'Installation", 
      visualConfig: "Vue 3D Interactive", 
      interactiveMode: "Mode Interactif", 
      memory: "Mémoire RAM", 
      storage: "Stockage", 
      requestConfigQuote: "Demander un devis config.", 
      rentalSimulator: "Simulateur de Location", 
      durationDays: "Durée (Jours)", 
      quantity: "Quantité", 
      receiveOffer: "Recevoir cette offre par email", 
      proReviews: "Avis Clients Professionnels", 
      similarProducts: "Produits Similaires", 
      whyChoose: "Pourquoi choisir X-Zone ?", 
      officialWarranty: "Garantie Officielle", 
      officialWarrantyDesc: "Produits certifiés constructeurs avec garantie incluse.", 
      deliveryInstall: "Livraison & Installation", 
      deliveryInstallDesc: "Service d'installation sur site par nos experts.", 
      reactiveSupport: "Support Réactif", 
      reactiveSupportDesc: "Assistance technique disponible 6j/7.", 
      needAdvice: "Besoin de conseils ?", 
      adviceDesc: "Nos experts vous aident à choisir la configuration idéale.", 
      callSales: "Appeler le service commercial",
      share: {
        title: "Partager",
        copyLink: "Copier le lien",
        linkCopied: "Lien copié !",
        instaMessage: "Lien copié ! Instagram ne permet pas le partage direct.",
        copyError: "Erreur lors de la copie"
      }
    },
    shop_data: { title: "Catalogue Produits", subtitle: "Le meilleur du matériel informatique professionnel", filters: "Filtres", searchPlaceholder: "Rechercher un produit (référence, nom...)", reset: "Réinitialiser", categories: { all: "Tout voir", server: "Serveurs", laptop: "PC Portables", desktop: "Ordinateurs de Bureau", network: "Réseau", printer: "Impression", software: "Logiciels", rental: "Location" }, tabs: { general: "Catalogue Général", promo: "Offres Spéciales", refurbished: "Reconditionné Premium" }, configurator: { title: "Configurateur Intelligent", subtitle: "Trouvez votre PC idéal" } },
    diagnostic_data: { steps: { material: "Matériel", symptom: "Symptôme", diagnostic: "Résultat" }, devices: { laptop: "PC Portable / Fixe", server: "Serveur / Stockage", wifi: "Réseau / WiFi", printer: "Impression" }, symptoms: { slow: "Lenteurs extrêmes / Freezes", startup: "Ne démarre pas / Écran noir", network: "Perte de connexion intermittente", battery: "Problème batterie / alimentation", noise: "Bruit anormal / Surchauffe" }, result: { title: "Diagnostic Probable", quickSolution: "Piste de solution", recommended: "Produit recommandé pour vous", ticket: "Ouvrir un ticket SAV", talk: "Échanger avec un expert", retry: "Refaire le diagnostic" } },
    configurator_data: { title: "Configurateur Intelligent", subtitle: "Répondez à 3 questions pour trouver votre solution idéale.", steps: { usage: "Usage", budget: "Budget", prefs: "Préférences", result: "Résultat" }, usage: { office: "Bureautique & Gestion", server: "Serveur & Infra", workstation: "Création / 3D / Dev" }, result: { found: "Configuration Idéale Trouvée !", pack: "Pack Recommandé X-Zone", perf: "Performance optimisée pour", warranty: "Garantie 3 ans J+1", install: "Installation sur site incluse", cta: "Demander un devis pour ce pack", retry: "Recommencer la configuration" } },
    buyback_data: { hero: { title: "Donnez une seconde vie à votre matériel IT", subtitle: "X-Zone rachète votre parc informatique obsolète.", cta: "Obtenir une estimation", badge: "Économie Circulaire" }, steps: { title: "Comment ça marche ?", s1: { title: "Déclarez", desc: "Remplissez le formulaire en ligne." }, s2: { title: "Estimez", desc: "Recevez une offre sous 48h." }, s3: { title: "Envoyez", desc: "Nous collectons le matériel." }, s4: { title: "Encaissez", desc: "Recevez votre paiement." } }, form: { title: "Formulaire d'estimation", type: "Type de matériel", brand: "Marque", year: "Année d'achat", condition: "État esthétique", photos: "Photos", email: "Email", phone: "Téléphone", submit: "Obtenir mon estimation", options: { type: { laptop: "PC Portable", desktop: "PC Fixe", server: "Serveur", screen: "Écran", other: "Autre" }, condition: { likeNew: "Comme neuf", good: "Bon état", wear: "Usure visible", broken: "Non fonctionnel" } }, placeholders: { brand: "Ex: Dell", year: "2020", email: "pro@societe.com", phone: "06..." } } }
  },
  en: {}, 
  ar: {}
};

TRANSLATIONS.en = TRANSLATIONS.fr;
TRANSLATIONS.ar = TRANSLATIONS.fr;
