
import { Service, Product, Stat, NavItem, BlogPost, SuccessStory, KnowledgeArticle, FAQItem, Sector, Review } from './types';
export { COMPANY_INFO } from './siteConfig';

export const DEFAULT_PRODUCT_IMAGE = "/images/Vide.avif";

export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", path: "/", key: "nav.home" },
  { label: "Entreprise", path: "/about", key: "nav.company" },
  { 
    label: "Services", 
    path: "/services",
    key: "nav.services",
    subItems: [
      { label: "Vente & Intégration", path: "/services/vente-integration", key: "nav.servicesSub.sales" },
      { label: "Location", path: "/services/location", key: "nav.servicesSub.rental" },
      { label: "Réseau & Infra", path: "/services/reseau-infrastructure", key: "nav.servicesSub.network" },
      { label: "Maintenance", path: "/services/maintenance", key: "nav.servicesSub.maintenance" },
      { label: "Surveillance", path: "/services/surveillance", key: "nav.servicesSub.surveillance" },
      { label: "Reprise Matériel", path: "/rachat", key: "nav.servicesSub.buyback" },
      { label: "Diagnostic en ligne", path: "/diagnostic", key: "nav.servicesSub.diagnostic" },
    ]
  },
  {
    label: "Solutions",
    path: "/solutions",
    key: "nav.solutions",
    subItems: [
        { label: "PME / TPE", path: "/solutions/pme", key: "nav.solutionsSub.pme" },
        { label: "Éducation", path: "/solutions/education", key: "nav.solutionsSub.education" },
        { label: "Médical", path: "/solutions/medical", key: "nav.solutionsSub.medical" },
        { label: "Call Centers", path: "/solutions/call-center", key: "nav.solutionsSub.callcenter" },
        { label: "Administration", path: "/solutions/administration", key: "nav.solutionsSub.administration" },
        { label: "Industrie", path: "/solutions/industrie", key: "nav.solutionsSub.industry" },
        { label: "Logistique", path: "/solutions/logistique", key: "nav.solutionsSub.logistics" },
    ]
  },
  { label: "Catalogue", path: "/produits", key: "nav.catalog" },
  { 
    label: "Ressources", 
    path: "/resources", 
    key: "nav.resources",
    subItems: [
      { label: "Blog & Actualités", path: "/blog", key: "nav.resourcesSub.blog" },
      { label: "Centre de Connaissances", path: "/knowledge", key: "nav.resourcesSub.knowledge" },
      { label: "FAQ", path: "/faq", key: "nav.resourcesSub.faq" },
    ]
  },
  { label: "Contact", path: "/contact", key: "nav.contact" },
];

export const TRUST_BADGES = [
    { icon: "Clock", label: "23 ans d'expérience", desc: "Expertise prouvée depuis 2001" },
    { icon: "Users", label: "+2000 clients", desc: "La référence au Maroc" },
    { icon: "Server", label: "Expert Serveurs", desc: "Certification HPE & Dell" },
    { icon: "Shield", label: "Support Pro", desc: "Intervention rapide J+1" },
    { icon: "Settings", label: "Sur Mesure", desc: "Solutions 100% adaptées" },
];

export const STATS: Stat[] = [
  { value: "+23", label: "stats_data.years", icon: "Clock" },
  { value: "+2000", label: "stats_data.clients", icon: "Users" },
  { value: "+10", label: "stats_data.experts", icon: "Award" },
  { value: "100%", label: "stats_data.quality", icon: "CheckCircle" },
];

export const REVIEWS: Review[] = [
  { id: "1", company: "Groupe Scolaire Al-Amine", sector: "Éducation", author: "M. Tazi, DSI", rating: 5, comment: "Excellent accompagnement pour l'équipement de nos 3 nouvelles salles informatiques. Matériel robuste et délais de livraison respectés.", date: "Oct 2024" },
  { id: "2", company: "Clinique du Parc", sector: "Santé", author: "Dr. Benjelloun", rating: 4.8, comment: "Réactivité exemplaire du service technique. Les serveurs installés fonctionnent 24/7 sans aucun incident.", date: "Sept 2024" },
  { id: "3", company: "Call Center Connect", sector: "Services", author: "Sarah K., Operations Mgr", rating: 4.5, comment: "Bon rapport qualité/prix sur les casques et les mini-PC. Je recommande X-Zone pour les achats en volume.", date: "Août 2024" },
];

export const SERVICES_STRUCT = [
  { id: "1", slug: "vente-integration", icon: "Monitor" },
  { id: "2", slug: "location", icon: "Calendar" },
  { id: "3", slug: "reseau-infrastructure", icon: "Wifi" },
  { id: "4", slug: "maintenance", icon: "Tool" },
  { id: "5", slug: "surveillance", icon: "Shield" }
];

export const SECTORS_STRUCT = [
  { id: "pme", slug: "pme-tpe", icon: "Building", image: "/images/pme.jpg" },
  { id: "education", slug: "education", icon: "GraduationCap", image: "/images/Education.avif" },
  { id: "medical", slug: "sante-medical", icon: "HeartPulse", image: "/images/Hopital.avif" },
  { id: "call-center", slug: "call-centers", icon: "Headphones", image: "/images/CallC.avif" },
  { id: "administration", slug: "administration", icon: "Landmark", image: "/images/Admin.avif" },
  { id: "industrie", slug: "industrie", icon: "Settings", image: "/images/Industrie.avif" },
  { id: "logistique", slug: "logistique", icon: "Package", image: "/images/Logistique.avif" }
];

export const PRODUCTS_STRUCT = [
  {
    id: "srv-001",
    slug: "serveur-dell-poweredge-r750",
    name: "Serveur Pro Enterprise X1",
    description: "Serveur haute performance pour virtualisation.",
    category: "server",
    image: "/images/Server.avif",
    badge: 'bestseller',
    rating: 5,
    price: "price_on_request",
    specs: ["Intel Xeon Gold", "64GB RAM", "2x 960GB SSD", "Redundant PSU"]
  },
  {
    id: "lap-001",
    slug: "hp-elitebook-840-g9",
    name: "Ultrabook Business Elite",
    description: "Légèreté et puissance pour les professionnels nomades.",
    category: "laptop",
    image: "/images/Laptop.avif",
    badge: 'new',
    rating: 4.5,
    price: "price_on_request",
    specs: ["Core i7 13th Gen", "16GB RAM", "512GB SSD", "Win 11 Pro"]
  },
  {
    id: "des-001",
    slug: "station-travail-lenovo-thinkstation-p620",
    name: "Station de Travail Graphique",
    description: "Puissance de calcul pour le rendu 3D.",
    category: "desktop",
    image: "/images/Desktop.avif",
    rating: 5,
    price: "price_on_request",
    specs: ["Ryzen Threadripper", "RTX 4070", "32GB RAM", "1TB SSD"]
  },
  {
    id: "net-001",
    slug: "switch-cisco-catalyst-9200",
    name: "Switch Cisco Catalyst 9200",
    description: "Gestion réseau avancée avec alimentation PoE.",
    category: "network",
    image: "/images/Network.avif",
    rating: 4,
    price: "price_on_request",
    specs: ["24 Ports PoE+", "4 SFP+", "Layer 3 Lite"]
  },
  {
    id: "prt-001",
    slug: "imprimante-hp-laserjet-pro-m428fdw",
    name: "Multifonction Laser Couleur",
    description: "Solution d'impression rapide pour groupes.",
    category: "printer",
    image: "/images/Printer.avif",
    rating: 4,
    price: "price_on_request",
    specs: ["40 ppm", "Recto-verso", "Scan vers Email"]
  },
  {
    id: "soft-001",
    slug: "microsoft-365-business-standard",
    name: "Licence Microsoft 365 Business",
    description: "La suite bureautique complète dans le cloud.",
    category: "software",
    image: "/images/Software.avif",
    rating: 5,
    price: "price_on_request",
    specs: ["Office Apps", "Exchange", "Teams", "OneDrive"]
  },
  {
    id: "rent-001",
    slug: "location-videoprojecteur-4k",
    name: "Location Vidéoprojecteur 4K",
    description: "Idéal pour conférences et événements.",
    category: "rental",
    image: "/images/Datashow.avif",
    isRental: true,
    rating: 4.5,
    price: "price_on_request",
    specs: ["5000 Lumens", "Résolution 4K UHD", "Écran inclus"]
  },
  {
    id: "rent-002",
    slug: "location-ecran-tactile-65",
    name: "Location Écran Tactile 65\"",
    description: "Animation interactive pour stands.",
    category: "rental",
    image: "/images/EcranInteractif.avif",
    isRental: true,
    rating: 5,
    price: "price_on_request",
    specs: ["4K UHD", "Multitouch 20 points", "Support à roulettes"]
  },
  {
    id: "lap-002",
    slug: "dell-latitude-5420-refurbished",
    name: "Dell Latitude 5420 (Reconditionné)",
    description: "PC professionnel robuste et fiable.",
    category: "laptop",
    image: "/images/Laptop.avif",
    badge: 'refurbished',
    rating: 4,
    price: "Promo -30%",
    specs: ["Core i5 11th Gen", "8GB RAM", "256GB SSD"]
  },
   {
    id: "srv-002",
    slug: "nas-synology-ds923",
    name: "Serveur Stockage NAS Pro",
    description: "Solution de sauvegarde centralisée PME.",
    category: "server",
    image: "/images/Server.avif",
    badge: 'promo',
    rating: 4.5,
    price: "Promo",
    specs: ["4 Baies", "RAID 0/1/5/10", "2x 10GbE Ready"]
  }
];

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: "1",
    client: "Groupe Industriel Marocain",
    sector: "Industrie",
    title: "Modernisation Data Center",
    challenge: "Obsolescence des serveurs et risques de sécurité élevés.",
    solution: "Déploiement d'une infrastructure hyperconvergée Dell EMC.",
    result: "0 minute d'arrêt en 12 mois.",
    image: "/images/Server.avif",
  },
  {
    id: "2",
    client: "Call Center International",
    sector: "Services",
    title: "Équipement 500 positions",
    challenge: "Croissance rapide nécessitant un déploiement urgent.",
    solution: "Fourniture de 500 PC HP ProDesk et casques Jabra.",
    result: "Livraison dans les délais.",
    image: "/images/CallC.avif",
  }
];

// Re-export constants properly populated
export const SERVICES = SERVICES_STRUCT;
export const PRODUCTS = PRODUCTS_STRUCT as Product[];
export const SECTORS = SECTORS_STRUCT;

// --- BLOG & KNOWLEDGE BASE STRUCTURE ---

export const BLOG_STRUCT = [
  {
    id: "b-1",
    slug: "zero-day-maroc-2025",
    image: "/images/CallC.avif",
    date: "12 Déc 2025",
    author: "Karim B.",
    category: "Cybersécurité"
  },
  {
    id: "b-2",
    slug: "wifi-7-entreprise-migration",
    image: "/images/Migration.avif",
    date: "28 Nov 2025",
    author: "Sarah L.",
    category: "Réseaux"
  },
  {
    id: "b-3",
    slug: "cloud-souverain-maroc-2025",
    image: "/images/Cloud-Souverain.avif",
    date: "15 Nov 2025",
    author: "Amine T.",
    category: "Cloud"
  },
  {
    id: "b-4",
    slug: "cybersecurite-pme-obligations-2025",
    image: "/images/Cybersecurite.avif",
    date: "02 Nov 2025",
    author: "Yassine B.",
    category: "Législation"
  },
  {
    id: "b-5",
    slug: "ia-generative-it-management",
    image: "/images/AiGenerative.avif",
    date: "20 Oct 2025",
    author: "Dr. Imane K.",
    category: "Innovation"
  },
  {
    id: "b-6",
    slug: "serveurs-efficacite-energetique-2025",
    image: "/images/ServerEnergetic.avif",
    date: "05 Oct 2025",
    author: "Omar E.",
    category: "Matériel"
  },
  {
    id: "b-7",
    slug: "materiel-reconditionne-maroc",
    image: "/images/MaterielReconditionnee.avif",
    date: "18 Sept 2025",
    author: "Nadia C.",
    category: "RSE"
  },
  {
    id: "b-8",
    slug: "blockchain-infrastructure-it",
    image: "/images/Blockchain.avif",
    date: "30 Août 2025",
    author: "Mehdi A.",
    category: "Technologie"
  }
];

export const KNOWLEDGE_STRUCT = [
  {
    id: "k-1",
    image: "/images/Stockage.avif",
    readTime: "8 min",
    category: "Stockage"
  },
  {
    id: "k-2",
    image: "/images/EnergieIT.avif",
    readTime: "6 min",
    category: "Énergie"
  },
  {
    id: "k-3",
    image: "/images/StockageHDD.avif",
    readTime: "5 min",
    category: "Stockage"
  },
  {
    id: "k-4",
    image: "/images/Virtualisation.avif",
    readTime: "7 min",
    category: "Virtualisation"
  },
  {
    id: "k-5",
    image: "/images/Network.avif",
    readTime: "5 min",
    category: "Réseaux"
  },
  {
    id: "k-6",
    image: "/images/Security.avif",
    readTime: "6 min",
    category: "Sécurité"
  },
  {
    id: "k-7",
    image: "/images/Architecture.avif",
    readTime: "7 min",
    category: "Architecture"
  },
  {
    id: "k-8",
    image: "/images/Logiciel.avif",
    readTime: "5 min",
    category: "Logiciels"
  }
];
