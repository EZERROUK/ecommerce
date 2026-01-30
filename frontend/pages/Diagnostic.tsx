import React, { useState, useMemo, useEffect } from 'react';
import { 
  Server, Shield, Monitor, ArrowRight, Activity, 
  CheckCircle, AlertTriangle, FileText, Loader2, 
  HelpCircle, ChevronRight, ClipboardCheck, 
  Download, Network, Database, Lock, Layers,
  Cpu, HardDrive, Wifi, Settings, AlertOctagon,
  MessageCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useChat } from '../contexts/ChatContext';
import { generateDiagnosticPDF } from '../utils/pdfGenerator';

// --- TYPES DU MOTEUR D'AUDIT PROFESSIONNEL ---

type AuditType = 'infra' | 'server' | 'network';

interface RiskAnalysis {
  level: 'Critique' | 'Majeur' | 'Modéré' | 'Faible'; // Terminologie ISO
  risk: string; // Description détaillée (Paragraphe)
  cause: string;
  impact: string; // Disponibilité / Intégrité / Confidentialité
  recommendation: {
    term: 'Immédiat' | 'Court terme' | 'Moyen terme' | 'Long terme';
    action: string;
  };
}

interface Option {
  id: string;
  label: string;
  score: number; // 0 à 10
  analysis?: RiskAnalysis;
}

interface Question {
  id: string;
  category: string; // Pour les sous-scores (ex: "Obsolescence", "Sécurité", "Process")
  question: string;
  context?: string; // Aide contextuelle (Norme associée)
  options: Option[];
}

interface AuditModule {
  id: AuditType;
  title: string;
  subtitle: string;
  icon: any;
  standard: string; // Référence norme (ex: ITIL v4, ISO 27001)
  questions: Question[];
}

// --- BASE DE DONNÉES D'AUDIT EXPERT (ISO/ITIL) ---

const AUDIT_MODULES: AuditModule[] = [
  {
    id: 'infra',
    title: "Audit Parc Informatique",
    subtitle: "Cycle de vie, homogénéité et conformité du poste de travail.",
    icon: Monitor,
    standard: "ITIL v4 & ISO 27001 (A.8)",
    questions: [
      // THÈME : GESTION DE PARC & INVENTAIRE
      {
        id: 'inf_inv',
        category: "Gouvernance & Inventaire",
        question: "Comment est géré l'inventaire de votre parc informatique ?",
        options: [
          { id: 'glpi', label: "Outil automatisé (GLPI, Lansweeper) avec agent", score: 10 },
          { id: 'excel', label: "Fichier Excel mis à jour manuellement", score: 5, analysis: { level: 'Modéré', risk: "La gestion manuelle de l'inventaire rend impossible le suivi dynamique des actifs. Cette absence de visibilité en temps réel empêche d'identifier les équipements obsolètes ou non conformes, exposant l'organisation à des achats redondants et une incapacité à maîtriser le budget IT.", cause: "Processus manuel faillible", impact: "Perte de traçabilité des actifs", recommendation: { term: 'Moyen terme', action: "Déployer une solution d'inventaire automatisé" } } },
          { id: 'none', label: "Aucun inventaire formalisé", score: 0, analysis: { level: 'Majeur', risk: "L'absence totale d'inventaire constitue une faille majeure de gouvernance. Elle favorise le Shadow IT, rend impossible la gestion du cycle de vie et expose l'entreprise au vol de matériel non détecté, rendant le SI impossible à sécuriser efficacement.", cause: "Absence de suivi", impact: "Perte de contrôle financière et technique", recommendation: { term: 'Court terme', action: "Réaliser un inventaire physique complet immédiat" } } }
        ]
      },
      {
        id: 'inf_hom',
        category: "Gouvernance & Inventaire",
        question: "Quel est le niveau d'homogénéité du parc (Marques/Modèles) ?",
        options: [
          { id: 'high', label: "Standardisé (1 ou 2 gammes pro max)", score: 10 },
          { id: 'med', label: "Mixte (Plusieurs marques, gammes pro et grand public)", score: 5, analysis: { level: 'Faible', risk: "La diversité des modèles complexifie la maintenance et la gestion des pilotes. Bien que modéré, ce risque augmente les coûts de support (TCO) et allonge les délais de remise en service en cas de panne matérielle.", cause: "Achats au coup par coup", impact: "Coûts de support accrus", recommendation: { term: 'Long terme', action: "Définir un catalogue standardisé" } } },
          { id: 'low', label: "Hétérogène (Parc disparate non maîtrisé)", score: 0, analysis: { level: 'Modéré', risk: "Une forte hétérogénéité du parc empêche l'industrialisation des déploiements (Masterisation) et multiplie les incompatibilités logicielles. Cette fragmentation mobilise excessivement les ressources support pour des incidents évitables.", cause: "Absence de politique d'achat", impact: "Instabilité technique chronique", recommendation: { term: 'Moyen terme', action: "Lisser le parc lors des renouvellements" } } }
        ]
      },
      // THÈME : CYCLE DE VIE
      {
        id: 'inf_age',
        category: "Cycle de vie",
        question: "Quelle est la moyenne d'âge des postes de travail ?",
        options: [
          { id: 'sub3', label: "Inférieure à 3 ans (Sous garantie constructeur)", score: 10 },
          { id: '3to5', label: "Entre 3 et 5 ans", score: 6, analysis: { level: 'Modéré', risk: "Le vieillissement des composants (disques, batteries) au-delà de 3 ans entraîne une baisse mécanique de la performance. Cela se traduit par une perte de productivité des collaborateurs et une augmentation progressive du volume de tickets d'incidents.", cause: "Vieillissement naturel", impact: "Baisse de productivité utilisateur", recommendation: { term: 'Moyen terme', action: "Planifier le renouvellement des postes > 4 ans" } } },
          { id: 'plus5', label: "Supérieure à 5 ans", score: 0, analysis: { level: 'Critique', risk: "Le maintien en production de postes de plus de 5 ans induit un risque élevé de défaillance matérielle hors garantie. Cette obsolescence technique rend les postes incompatibles avec les standards de sécurité actuels et les applications métiers modernes.", cause: "Absence d'investissement", impact: "Arrêt de production et failles sécurité", recommendation: { term: 'Court terme', action: "Remplacer en priorité les postes critiques" } } }
        ]
      },
      {
        id: 'inf_os',
        category: "Cycle de vie",
        question: "État des Systèmes d'Exploitation (OS)",
        context: "Fin de support Windows 10 : Octobre 2025",
        options: [
          { id: 'w11', label: "Windows 11 Pro / Enterprise uniformisé", score: 10 },
          { id: 'w10', label: "Windows 10 Pro (Migration non planifiée)", score: 5, analysis: { level: 'Majeur', risk: "L'approche de la fin de support de Windows 10 (Octobre 2025) constitue une dette technique critique. Sans plan de migration, le parc se retrouvera privé de correctifs de sécurité, exposé aux nouvelles vulnérabilités.", cause: "Cycle de vie logiciel", impact: "Non-conformité et sécurité future", recommendation: { term: 'Moyen terme', action: "Auditer l'éligibilité TPM 2.0 du parc" } } },
          { id: 'w7', label: "Présence de Windows 7 / 8 / XP", score: 0, analysis: { level: 'Critique', risk: "L'utilisation de systèmes d'exploitation en fin de vie (EOL) prive le parc des correctifs de sécurité critiques. Cette situation offre une porte d'entrée triviale pour les ransomwares, compromettant l'intégrité de tout le réseau.", cause: "Obsolescence grave", impact: "Vulnérabilité critique immédiate", recommendation: { term: 'Court terme', action: "Isoler ou migrer ces postes immédiatement" } } }
        ]
      },
      // THÈME : SÉCURITÉ DU POSTE
      {
        id: 'inf_av',
        category: "Sécurité Endpoint",
        question: "Protection antivirale des postes",
        options: [
          { id: 'edr', label: "Solution EDR/XDR managée (SentinelOne, CrowdStrike, Defender for Endpoint)", score: 10 },
          { id: 'av_pro', label: "Antivirus Pro classique centralisé", score: 7 },
          { id: 'av_free', label: "Antivirus gratuit ou intégré non supervisé", score: 2, analysis: { level: 'Critique', risk: "Les antivirus grand public sont incapables de détecter les menaces comportementales avancées (sans fichier). L'absence de supervision centralisée prive la DSI de la réactivité nécessaire pour isoler une machine infectée.", cause: "Outil inadapté", impact: "Incapacité de détection et réponse", recommendation: { term: 'Court terme', action: "Déployer une solution EDR supervisée" } } }
        ]
      },
      {
        id: 'inf_crypt',
        category: "Sécurité Endpoint",
        question: "Chiffrement des disques (Laptops)",
        context: "Norme ISO 27001 A.8.2.1",
        options: [
          { id: 'all', label: "Oui, BitLocker/FileVault activé sur tous les portables", score: 10 },
          { id: 'partial', label: "Partiel / À la demande de l'utilisateur", score: 4, analysis: { level: 'Majeur', risk: "Laisser le choix du chiffrement à l'utilisateur garantit des failles. En cas de vol d'un ordinateur non chiffré, l'accès aux données confidentielles est immédiat, entraînant des risques juridiques (CNDP|Loi 09-08) et d'image majeurs.", cause: "Absence de politique GPO", impact: "Fuite de données confidentielles", recommendation: { term: 'Court terme', action: "Activer le chiffrement via GPO/MDM" } } },
          { id: 'none', label: "Non chiffré", score: 0, analysis: { level: 'Critique', risk: "L'absence totale de chiffrement sur les postes nomades expose l'entreprise à une fuite de données certaine en cas de perte physique du matériel. Les données sont accessibles en clair par n'importe quel tiers malveillant.", cause: "Négligence sécurité", impact: "Perte de confidentialité totale", recommendation: { term: 'Court terme', action: "Chiffrement immédiat des VIP et nomades" } } }
        ]
      },
      {
        id: 'inf_adm',
        category: "Sécurité Endpoint",
        question: "Gestion des droits administrateur",
        options: [
          { id: 'user', label: "Utilisateurs en droits limités (Standard)", score: 10 },
          { id: 'admin', label: "Utilisateurs administrateurs de leur poste", score: 0, analysis: { level: 'Critique', risk: "Accorder les droits d'administration locale aux utilisateurs augmente drastiquement la surface d'attaque. Cela permet l'installation de logiciels non autorisés (Shadow IT) et facilite l'exécution de malwares avec des privilèges élevés.", cause: "Mauvaise pratique", impact: "Compromission système facilitée", recommendation: { term: 'Court terme', action: "Retirer les droits d'administration locaux" } } }
        ]
      },
      // THÈME : MCO & SUPPORT
      {
        id: 'inf_patch',
        category: "Maintien en Condition Opérationnelle",
        question: "Gestion des correctifs (Patch Management)",
        options: [
          { id: 'auto_sup', label: "Automatisée et supervisée (WSUS, Intune, RMM)", score: 10 },
          { id: 'auto_unsup', label: "Windows Update automatique (Non supervisé)", score: 5, analysis: { level: 'Modéré', risk: "Sans supervision des mises à jour, les échecs d'installation passent inaperçus. Le parc devient hétérogène en termes de sécurité, laissant certaines machines vulnérables sans que la DSI en soit informée.", cause: "Manque de reporting", impact: "Vulnérabilités non détectées", recommendation: { term: 'Moyen terme', action: "Mettre en place un outil RMM" } } },
          { id: 'manual', label: "Manuel / Désactivé", score: 0, analysis: { level: 'Critique', risk: "L'absence de gestion des correctifs laisse subsister des vulnérabilités connues (CVE) sur le parc. C'est le vecteur d'attaque le plus courant, permettant l'exploitation de failles systèmes pour prendre le contrôle du réseau.", cause: "Défaut de maintenance", impact: "Exploitation active des failles", recommendation: { term: 'Court terme', action: "Réactiver les mises à jour automatiques" } } }
        ]
      },
      {
        id: 'inf_ticket',
        category: "Support Utilisateur",
        question: "Traçabilité des incidents (Ticketing)",
        options: [
          { id: 'tool', label: "Outil de ticketing dédié (ITSM)", score: 10 },
          { id: 'mail', label: "Demandes par email / téléphone sans suivi", score: 3, analysis: { level: 'Faible', risk: "La gestion informelle des incidents entraîne une perte d'information et l'absence d'historique. Cela empêche l'analyse récurrente des pannes et dégrade la qualité de service perçue par les utilisateurs.", cause: "Processus artisanal", impact: "Qualité de service dégradée", recommendation: { term: 'Moyen terme', action: "Formaliser le processus de support" } } }
        ]
      },
      {
        id: 'inf_master',
        category: "Déploiement",
        question: "Méthode de préparation des postes",
        options: [
          { id: 'autopilot', label: "Déploiement moderne (Autopilot / MDM / Imaging)", score: 10 },
          { id: 'manual', label: "Installation manuelle poste par poste", score: 2, analysis: { level: 'Faible', risk: "L'installation manuelle est chronophage et source d'erreurs humaines. Elle aboutit à des configurations non standardisées, compliquant le support futur et augmentant le temps de mise à disposition pour les nouveaux arrivants.", cause: "Absence d'industrialisation", impact: "Coûts d'intégration élevés", recommendation: { term: 'Long terme', action: "Industrialiser le déploiement" } } }
        ]
      },
      // Complément pour atteindre 15 questions (Exemples simplifiés ici pour le code)
      { id: 'inf_usb', category: 'Sécurité Endpoint', question: 'Contrôle des ports USB', options: [{id:'blocked', label:'Bloqués/Filtrés', score:10}, {id:'open', label:'Ouverts', score:0, analysis:{level:'Majeur', risk:'L\'accès libre aux ports USB permet l\'exfiltration massive de données ou l\'introduction de malwares via des périphériques infectés. C\'est un vecteur d\'attaque physique souvent négligé mais dévastateur.', cause:'Accès libre', impact:'Intégrité et Confidentialité', recommendation:{term:'Moyen terme', action:'Restreindre via GPO'}}}] },
      { id: 'inf_screen', category: 'Sécurité Endpoint', question: 'Verrouillage de session automatique', options: [{id:'yes', label:'Oui (<5 min)', score:10}, {id:'no', label:'Non', score:0, analysis:{level:'Modéré', risk:'Une session laissée ouverte en l\'absence de l\'utilisateur permet un accès physique immédiat aux données et applications métiers. C\'est une violation basique des règles d\'hygiène informatique.', cause:'Configuration par défaut', impact:'Confidentialité compromise', recommendation:{term:'Court terme', action:'Configurer veille GPO'}}}] },
      { id: 'inf_shadow', category: 'Gouvernance', question: 'Politique d\'installation de logiciels', options: [{id:'whitelist', label:'Liste blanche / Store Entreprise', score:10}, {id:'free', label:'Libre', score:0, analysis:{level:'Majeur', risk:'Laisser les utilisateurs installer leurs propres logiciels favorise le Shadow IT et l\'introduction de binaires malveillants ou non licenciés, exposant l\'entreprise à des risques légaux et de sécurité.', cause:'Liberté totale', impact:'Intégrité du système', recommendation:{term:'Moyen terme', action:'Restreindre les installations'}}}] },
      { id: 'inf_backup_post', category: 'MCO', question: 'Sauvegarde des données locales (Postes VIP)', options: [{id:'cloud', label:'OneDrive/Cloud Sync', score:10}, {id:'none', label:'Aucune (Tout en local)', score:0, analysis:{level:'Majeur', risk:'Le stockage local unique de données critiques (sans synchronisation Cloud/Serveur) signifie leur perte définitive en cas de panne de disque, vol ou ransomware sur le poste utilisateur.', cause:'Stockage local unique', impact:'Perte de données métier', recommendation:{term:'Court terme', action:'Activer synchro cloud'}}}] },
      { id: 'inf_mobility', category: 'Usage', question: 'Gestion des périphériques mobiles (MDM)', options: [{id:'yes', label:'MDM Actif', score:10}, {id:'no', label:'Non géré', score:2, analysis:{level:'Modéré', risk:'L\'absence de gestion des terminaux mobiles (Smartphones/Tablettes) accédant aux données de l\'entreprise rend impossible l\'effacement à distance en cas de perte, compromettant la confidentialité des accès.', cause:'Absence outil', impact:'Confidentialité mobile', recommendation:{term:'Long terme', action:'Étude solution MDM'}}}] }
    ]
  },
  {
    id: 'server',
    title: "Audit Serveurs & Virtualisation",
    subtitle: "Architecture, résilience et conformité du datacenter.",
    icon: Server,
    standard: "ISO 22301 & Best Practices",
    questions: [
      {
        id: 'srv_phys',
        category: "Architecture Matérielle",
        question: "État de la garantie constructeur des serveurs physiques",
        options: [
          { id: 'active', label: "Garantie J+1 active sur tous les nœuds", score: 10 },
          { id: 'partial', label: "Partielle ou délai J+5", score: 5, analysis: { level: 'Majeur', risk: "Un contrat de support standard (J+5) ou partiel est incompatible avec les exigences de production. En cas de panne critique (Carte mère, Alimentation), l'entreprise subira un arrêt d'activité de plusieurs jours en attendant les pièces.", cause: "Contrat inadapté", impact: "Arrêt de production prolongé", recommendation: { term: 'Court terme', action: "Upgrade garantie ou stock pièces critiques" } } },
          { id: 'none', label: "Hors garantie / Fin de vie", score: 0, analysis: { level: 'Critique', risk: "L'exploitation de matériel en fin de vie (EOL) sans garantie constructeur est un pari risqué. L'indisponibilité des pièces de rechange sur le marché peut transformer un incident matériel mineur en perte définitive de service.", cause: "Matériel EOL", impact: "Perte définitive de service", recommendation: { term: 'Court terme', action: "Remplacer le matériel critique" } } }
        ]
      },
      {
        id: 'srv_virt',
        category: "Virtualisation",
        question: "Architecture de virtualisation",
        options: [
          { id: 'cluster', label: "Cluster Haute Disponibilité (2+ Nœuds + Stockage partagé)", score: 10 },
          { id: 'standalone', label: "Serveurs autonomes (Pas de HA)", score: 4, analysis: { level: 'Majeur', risk: "L'architecture basée sur des serveurs autonomes constitue un point de défaillance unique (SPOF). En cas de panne de l'hôte physique, l'ensemble des services hébergés subit une interruption totale jusqu'à réparation manuelle.", cause: "Architecture simple", impact: "Disponibilité non garantie", recommendation: { term: 'Moyen terme', action: "Étudier passage en cluster (HCI ou SAN)" } } },
          { id: 'none', label: "Pas de virtualisation (Bare Metal)", score: 2, analysis: { level: 'Critique', risk: "L'absence de virtualisation (OS directement sur le matériel) rend l'infrastructure rigide. La restauration en cas de crash est complexe et lente (réinstallation complète), entraînant un RTO (Recovery Time Objective) très élevé.", cause: "Technologie Legacy", impact: "Restauration complexe", recommendation: { term: 'Moyen terme', action: "Virtualiser l'infrastructure (P2V)" } } }
        ]
      },
      {
        id: 'srv_os',
        category: "Système & Sécurité",
        question: "Obsolescence des OS Serveurs",
        context: "Fin de support Windows Server 2012 R2 : Passée",
        options: [
          { id: 'recent', label: "Windows Server 2019 / 2022 / Linux LTS à jour", score: 10 },
          { id: 'eol_soon', label: "Windows Server 2016 (Fin de vie proche)", score: 5, analysis: { level: 'Modéré', risk: "L'approche de la fin de vie des OS serveurs nécessite une anticipation. Ne pas planifier la migration expose à court terme le système d'information à des problèmes de compatibilité et de sécurité.", cause: "Cycle de vie", impact: "Dette technique", recommendation: { term: 'Moyen terme', action: "Planifier migration vers 2022" } } },
          { id: 'eol', label: "Windows 2008 / 2012 ou Linux EOL", score: 0, analysis: { level: 'Critique', risk: "L'hébergement de services sur des OS obsolètes et non maintenus expose le cœur du SI à des vulnérabilités critiques connues. C'est une non-conformité majeure qui facilite la compromission totale du réseau.", cause: "Obsolescence grave", impact: "Sécurité compromise", recommendation: { term: 'Court terme', action: "Migration ou isolation stricte (In-place upgrade)" } } }
        ]
      },
      {
        id: 'srv_back_tech',
        category: "Sauvegarde & PRA",
        question: "Technologie de sauvegarde",
        options: [
          { id: 'veeam', label: "Solution image (Veeam, Datto) avec vérification", score: 10 },
          { id: 'file', label: "Copie de fichiers (Robocopy, Script)", score: 2, analysis: { level: 'Majeur', risk: "Une sauvegarde basée sur la simple copie de fichiers ne permet pas de restaurer un système complet (OS + Config). En cas de crash, la réinstallation manuelle de tout l'environnement entraînera un arrêt d'activité de plusieurs jours.", cause: "Outil inadapté", impact: "RTO très élevé", recommendation: { term: 'Court terme', action: "Mettre en place une sauvegarde image" } } },
          { id: 'none', label: "Aucune sauvegarde automatisée", score: 0, analysis: { level: 'Critique', risk: "L'absence de sauvegarde automatisée place l'entreprise en danger de mort numérique. Toute panne matérielle, erreur humaine ou cyberattaque entraînera une perte définitive et irréversible des données métiers.", cause: "Absence de processus", impact: "Faillite potentielle", recommendation: { term: 'Immédiat', action: "Déployer une sauvegarde urgente" } } }
        ]
      },
      {
        id: 'srv_back_rule',
        category: "Sauvegarde & PRA",
        question: "Respect de la règle 3-2-1",
        options: [
          { id: 'yes', label: "Oui (3 copies, 2 supports, 1 hors site)", score: 10 },
          { id: 'partial', label: "Non, sauvegarde uniquement sur site", score: 3, analysis: { level: 'Critique', risk: "Conserver les sauvegardes uniquement sur le site de production rend l'entreprise vulnérable aux sinistres physiques (incendie, inondation, vol) et aux ransomwares qui chiffrent souvent les backups locaux accessibles.", cause: "Pas d'externalisation", impact: "Perte totale sur sinistre majeur", recommendation: { term: 'Court terme', action: "Ajouter une copie Cloud ou disque dur externe rotatif" } } }
        ]
      },
      {
        id: 'srv_ad',
        category: "Annuaire & Identité",
        question: "Redondance Active Directory",
        options: [
          { id: 'multi', label: "Au moins 2 Contrôleurs de Domaine (DC)", score: 10 },
          { id: 'single', label: "Contrôleur de Domaine unique", score: 0, analysis: { level: 'Critique', risk: "Le Contrôleur de Domaine unique est un SPOF critique. Sa perte entraîne l'arrêt immédiat de toutes les authentifications : plus d'ouverture de session, plus d'accès aux fichiers, plus de messagerie. L'activité s'arrête totalement.", cause: "SPOF AD", impact: "Arrêt complet du SI", recommendation: { term: 'Court terme', action: "Installer un second DC (même en VM)" } } }
        ]
      },
      // ... 9 autres questions pour Serveurs (Simplifiées pour l'exemple code) ...
      { id: 'srv_raid', category: 'Stockage', question: 'Redondance Disques (RAID)', options: [{id:'raid', label:'RAID 1/5/6/10 avec HotSpare', score:10}, {id:'no', label:'RAID 0 ou Disque simple', score:0, analysis:{level:'Critique', risk:'L\'absence de redondance disque (RAID) signifie qu\'une simple panne de disque dur entraîne la perte immédiate de toutes les données du serveur et l\'arrêt du service. C\'est une configuration inacceptable en production.', cause:'Config performance sans sécurité', impact:'Perte de données sur panne disque', recommendation:{term:'Court terme', action:'Migrer vers RAID sécurisé'}}}] },
      { id: 'srv_env', category: 'Environnement', question: 'Environnement physique (Salle Serveur)', options: [{id:'pro', label:'Climatisée, Ondulée, Sécurisée', score:10}, {id:'bad', label:'Bureau ouvert, poussière, sans clim', score:0, analysis:{level:'Majeur', risk:'Un environnement physique inadapté (chaleur, poussière, accès libre) réduit drastiquement la durée de vie du matériel et augmente les risques de pannes aléatoires et d\'actes de malveillance interne.', cause:'Environnement inadapté', impact:'Fiabilité réduite', recommendation:{term:'Moyen terme', action:'Mettre en baie fermée ventilée'}}}] },
      { id: 'srv_ups', category: 'Environnement', question: 'Protection électrique (Onduleur)', options: [{id:'smart', label:'Onduleur piloté (Shutdown auto)', score:10}, {id:'dumb', label:'Onduleur non connecté / Aucun', score:2, analysis:{level:'Majeur', risk:'Un onduleur non piloté ne protège pas contre l\'arrêt brutal lors d\'une coupure longue. L\'arrêt non propre des serveurs corrompt les bases de données et les systèmes de fichiers, nécessitant des interventions lourdes de réparation.', cause:'Protection électrique incomplète', impact:'Corruption de données', recommendation:{term:'Court terme', action:'Connecter USB/Réseau onduleur'}}}] },
      { id: 'srv_mon', category: 'Exploitation', question: 'Supervision (Monitoring)', options: [{id:'yes', label:'Alertes proactives (Disque, RAM, CPU)', score:10}, {id:'no', label:'Pas de supervision', score:2, analysis:{level:'Modéré', risk:'Sans outils de supervision, la DSI navigue à l\'aveugle. Les pannes (disque plein, service arrêté) ne sont découvertes que lorsque les utilisateurs sont bloqués, entraînant une réactivité médiocre et des arrêts de service évitables.', cause:'Absence outils', impact:'Exploitation réactive', recommendation:{term:'Moyen terme', action:'Installer sonde monitoring'}}}] },
      { id: 'srv_update', category: 'Sécurité', question: 'Mises à jour Firmware/Bios', options: [{id:'reg', label:'Régulières (1-2 fois/an)', score:10}, {id:'never', label:'Jamais', score:5, analysis:{level:'Faible', risk:'Négliger les mises à jour firmware expose le matériel à des bugs de stabilité connus et à des failles de sécurité bas niveau. Cela réduit la fiabilité globale de l\'infrastructure serveur.', cause:'Oubli maintenance', impact:'Stabilité et Sécurité', recommendation:{term:'Long terme', action:'Mise à jour annuelle'}}} ]},
      { id: 'srv_admin', category: 'Sécurité', question: 'Séparation des comptes Admins', options: [{id:'yes', label:'Compte admin dédié différent du compte user', score:10}, {id:'no', label:'Usage compte admin pour bureautique', score:0, analysis:{level:'Critique', risk:'Utiliser un compte Administrateur de Domaine pour des tâches bureautiques quotidiennes est une faute grave. Si ce compte est compromis (phishing), l\'attaquant obtient instantanément le contrôle total de toute l\'infrastructure.', cause:'Mauvaise pratique', impact:'Compromission totale du domaine', recommendation:{term:'Immédiat', action:'Créer comptes nominatifs dédiés'}}}] },
      { id: 'srv_pra', category: 'Sauvegarde & PRA', question: 'Test de restauration', options: [{id:'yes', label:'Réalisé au moins 1 fois/an', score:10}, {id:'no', label:'Jamais testé', score:0, analysis:{level:'Critique', risk:'Une sauvegarde jamais testée est une sauvegarde inexistante. En l\'absence de tests réguliers, il est probable que les données soient corrompues ou incomplètes, ce qui ne sera découvert qu\'au moment du sinistre, trop tard.', cause:'Négligence', impact:'Fausse sécurité', recommendation:{term:'Court terme', action:'Organiser un test de restauration'}}}] },
      { id: 'srv_access', category: 'Sécurité', question: 'Accès physique au serveur', options: [{id:'lock', label:'Local fermé à clé', score:10}, {id:'open', label:'Libre accès', score:0, analysis:{level:'Majeur', risk:'L\'accès physique libre aux serveurs permet le vol de disques, le branchement de périphériques malveillants ou l\'extinction accidentelle. La sécurité physique est la première couche de la sécurité informatique.', cause:'Pas de contrôle', impact:'Intégrité physique', recommendation:{term:'Immédiat', action:'Verrouiller l\'accès'}}}] },
      { id: 'srv_doc', category: 'Exploitation', question: 'Documentation technique', options: [{id:'ok', label:'À jour (Schémas, IPs, Passwords)', score:10}, {id:'none', label:'Inexistante ou obsolète', score:2, analysis:{level:'Faible', risk:'L\'absence de documentation technique crée une dépendance critique envers les personnes. En cas de départ du référent technique, la reprise en main de l\'infrastructure devient complexe et risquée.', cause:'Manque de temps', impact:'Maintenabilité réduite', recommendation:{term:'Moyen terme', action:'Rédiger dossier architecture'}}}] }
    ]
  },
  {
    id: 'network',
    title: "Audit Réseau & Sécurité",
    subtitle: "Connectivité, segmentation et protection périmétrique.",
    icon: Network,
    standard: "ISO 27001 (A.13) & NIST",
    questions: [
      {
        id: 'net_firewall',
        category: "Sécurité Périmétrique",
        question: "Type de protection périmétrique (Firewall)",
        options: [
          { id: 'ngfw', label: "Firewall Next-Gen (Fortinet, Sophos, Palo Alto) avec licence active", score: 10 },
          { id: 'router', label: "Routeur Opérateur (Box) simple", score: 0, analysis: { level: 'Critique', risk: "L'utilisation d'un routeur standard comme unique barrière de sécurité est insuffisante. Dépourvu d'inspection approfondie (IPS) et de filtrage, il laisse passer les attaques applicatives et ne permet pas de contrôler les flux, exposant le réseau interne.", cause: "Matériel grand public", impact: "Intrusions non filtrées", recommendation: { term: 'Court terme', action: "Installer un Firewall UTM professionnel" } } },
          { id: 'expired', label: "Firewall pro mais licence expirée", score: 4, analysis: { level: 'Majeur', risk: "Un firewall sans licence active ne reçoit plus de mises à jour de signatures. Il devient aveugle face aux nouvelles menaces et virus, réduisant son efficacité à celle d'un simple routeur de filtrage de ports.", cause: "Non renouvellement", impact: "Filtres de sécurité inefficaces", recommendation: { term: 'Immédiat', action: "Renouveler les licences de sécurité" } } }
        ]
      },
      {
        id: 'net_seg',
        category: "Architecture",
        question: "Segmentation réseau (VLANs)",
        options: [
          { id: 'seg', label: "Oui (Séparation Serveurs / Utilisateurs / Voix / Invités)", score: 10 },
          { id: 'flat', label: "Réseau plat (Tout le monde voit tout le monde)", score: 2, analysis: { level: 'Majeur', risk: "Une architecture réseau plate permet la propagation latérale immédiate d'une attaque (virus, ransomware) à l'ensemble du parc. Un incident sur un poste non critique peut ainsi impacter directement les serveurs de production.", cause: "Architecture basique", impact: "Contamination rapide du parc", recommendation: { term: 'Moyen terme', action: "Segmenter par VLANs (Servers, Users, Guest)" } } }
        ]
      },
      {
        id: 'net_vpn',
        category: "Accès Distants",
        question: "Sécurisation des accès distants (Télétravail)",
        options: [
          { id: 'vpn_mfa', label: "VPN SSL/IPsec avec MFA (Double facteur)", score: 10 },
          { id: 'vpn_simple', label: "VPN Simple (Login/Mdp)", score: 6, analysis: { level: 'Modéré', risk: "L'authentification VPN par simple mot de passe est vulnérable au vol d'identifiants (Phishing). En cas de compromission, un attaquant obtient un accès légitime au réseau interne de l'entreprise.", cause: "Authentification faible", impact: "Intrusion réseau", recommendation: { term: 'Court terme', action: "Activer le MFA sur le VPN" } } },
          { id: 'rdp', label: "Ports RDP (3389) ouverts sur Internet", score: 0, analysis: { level: 'Critique', risk: "Exposer le RDP directement sur Internet est une pratique extrêmement dangereuse. C'est la cible privilégiée des attaques par force brute et le vecteur principal d'entrée des ransomwares dans les entreprises.", cause: "Mauvaise configuration", impact: "Compromission quasi-certaine", recommendation: { term: 'Immédiat', action: "Fermer les ports et passer par VPN" } } }
        ]
      },
      {
        id: 'net_wifi',
        category: "Sans-fil",
        question: "Sécurité du réseau Wi-Fi",
        options: [
          { id: 'wpa3_ent', label: "WPA2/3 Enterprise (Auth individuelle) ou Segments séparés", score: 10 },
          { id: 'psk', label: "WPA2 Personnel (Clé partagée unique)", score: 5, analysis: { level: 'Modéré', risk: "L'usage d'une clé Wi-Fi unique partagée complique la révocation des accès (ex: départ d'employé). Si la clé fuite, le réseau est compromis sans moyen simple de le sécuriser à nouveau sans reconfigurer tous les appareils.", cause: "Configuration simple", impact: "Accès non autorisé persistant", recommendation: { term: 'Moyen terme', action: "Changer la clé régulièrement ou passer en 802.1X" } } },
          { id: 'open', label: "Réseau ouvert ou WEP", score: 0, analysis: { level: 'Critique', risk: "L'utilisation de protocoles obsolètes (WEP) ou d'un réseau ouvert permet à n'importe quel tiers à proximité d'intercepter les communications et de pénétrer le réseau local. La confidentialité des données n'est pas assurée.", cause: "Obsolescence", impact: "Interception de données", recommendation: { term: 'Immédiat', action: "Sécuriser le Wi-Fi (WPA2 min)" } } }
        ]
      },
      {
        id: 'net_guest',
        category: "Sans-fil",
        question: "Wi-Fi Invités",
        options: [
          { id: 'isolated', label: "Isolé totalement du réseau interne (VLAN dédié)", score: 10 },
          { id: 'bridge', label: "Même réseau que les serveurs", score: 0, analysis: { level: 'Critique', risk: "L'absence d'isolation pour le Wi-Fi Invités permet à des tiers d'accéder directement aux ressources internes sensibles. Un appareil visiteur infecté peut scanner et attaquer le réseau de l'entreprise sans obstacle.", cause: "Mauvaise segmentation", impact: "Fuite de données et infection", recommendation: { term: 'Immédiat', action: "Isoler le trafic invités" } } }
        ]
      },
      // ... 10 autres questions Réseau
      { id: 'net_switch', category: 'Architecture', question: 'Redondance Cœur de Réseau', options: [{id:'stack', label:'Stack/Cluster de switchs', score:10}, {id:'single', label:'Switch unique', score:4, analysis:{level:'Majeur', risk:'Un cœur de réseau non redondé représente un SPOF critique. La panne de cet équipement central coupe toutes les communications inter-services et l\'accès aux serveurs, paralysant totalement l\'activité de l\'entreprise.', cause:'Economie budget', impact:'SPOF Réseau', recommendation:{term:'Moyen terme', action:'Doubler le cœur de réseau'}}}] },
      { id: 'net_log', category: 'Supervision', question: 'Gestion des logs (Traçabilité)', options: [{id:'syslog', label:'Centralisés (Syslog/SIEM)', score:10}, {id:'local', label:'Logs locaux uniquement', score:5, analysis:{level:'Modéré', risk:'En cas d\'incident de sécurité, l\'absence de logs centralisés rend l\'investigation (Forensic) quasi impossible, surtout si l\'attaquant a effacé les traces locales. La traçabilité est essentielle pour comprendre et endiguer une attaque.', cause:'Pas de centralisation', impact:'Investigation impossible', recommendation:{term:'Moyen terme', action:'Centraliser les logs critiques'}}}] },
      { id: 'net_admin', category: 'Sécurité', question: 'Accès administration équipements', options: [{id:'ssh', label:'SSH/HTTPS uniquement', score:10}, {id:'telnet', label:'Telnet/HTTP activé', score:0, analysis:{level:'Critique', risk:'L\'utilisation de protocoles non chiffrés (Telnet/HTTP) pour l\'administration permet la récupération des mots de passe administrateur en clair par simple écoute réseau (Sniffing). C\'est une faille de sécurité majeure.', cause:'Config par défaut', impact:'Vol identifiants admin', recommendation:{term:'Immédiat', action:'Désactiver Telnet/HTTP'}}}] },
      { id: 'net_doc', category: 'Documentation', question: 'Schéma réseau', options: [{id:'up', label:'À jour et détaillé', score:10}, {id:'old', label:'Obsolète ou inexistant', score:2, analysis:{level:'Faible', risk:'Sans schéma réseau à jour, le diagnostic en cas de panne est considérablement ralenti (MTTR élevé). Les techniciens perdent un temps précieux à comprendre l\'architecture avant de pouvoir intervenir.', cause:'Manque de temps', impact:'Dépannage ralenti', recommendation:{term:'Long terme', action:'Mettre à jour le schéma réseau'}}}] },
      { id: 'net_phys', category: 'Physique', question: 'Câblage et Brassage', options: [{id:'clean', label:'Ordonné, repéré, catégorie 6/6A', score:10}, {id:'mess', label:'Vrac, câbles non repérés, cat 5e', score:4, analysis:{level:'Faible', risk:'Un brassage désordonné ("Plat de spaghettis") augmente le risque d\'erreurs de manipulation (débranchement accidentel) et rend les interventions physiques pénibles et risquées.', cause:'Négligence', impact:'Erreurs opérationnelles', recommendation:{term:'Long terme', action:'Refaire le brassage proprement'}}}] },
      { id: 'net_redundancy', category: 'Disponibilité', question: 'Lien Internet', options: [{id:'dual', label:'Double lien (Fibre + 4G/Backup)', score:10}, {id:'single', label:'Lien unique', score:2, analysis:{level:'Majeur', risk:'Pour une entreprise dépendante du Cloud ou des emails, un lien Internet unique est un risque majeur. Une coupure opérateur (fréquente lors de travaux BTP) entraîne un arrêt total de la production.', cause:'Coût', impact:'Disponibilité Internet', recommendation:{term:'Court terme', action:'Ajouter un lien de secours'}}}] },
      { id: 'net_ids', category: 'Sécurité Périmétrique', question: 'Inspection IPS/IDS', options: [{id:'on', label:'Activé et bloquant', score:10}, {id:'off', label:'Désactivé', score:5, analysis:{level:'Modéré', risk:'Avoir un firewall sans activer les fonctions d\'inspection (IPS) revient à avoir un portier aveugle. Les attaques exploitant des failles applicatives passeront au travers des règles simples de filtrage de ports.', cause:'Performance ou Config', impact:'Sécurité applicative réduite', recommendation:{term:'Moyen terme', action:'Activer IPS sur flux critiques'}}}] },
      { id: 'net_iot', category: 'Sécurité', question: 'Isolation IoT (Imprimantes, Caméras)', options: [{id:'iso', label:'Réseau étanche', score:10}, {id:'mix', label:'Mélangé aux PC/Serveurs', score:0, analysis:{level:'Majeur', risk:'Les équipements IoT (imprimantes, caméras) sont rarement mis à jour et très vulnérables. S\'ils sont sur le même réseau que les serveurs, ils servent de point de pivot idéal pour les attaquants.', cause:'Facilité', impact:'Point d\'entrée vulnérable', recommendation:{term:'Court terme', action:'Isoler les équipements IoT'}}}] },
      { id: 'net_scan', category: 'Audit', question: 'Scan de vulnérabilité récurrent', options: [{id:'yes', label:'Trimestriel/Annuel', score:10}, {id:'no', label:'Jamais', score:2, analysis:{level:'Modéré', risk:'Sans scan de vulnérabilité régulier, l\'entreprise ignore ses faiblesses. De nouvelles failles sont découvertes chaque jour; ne pas les vérifier laisse le SI exposé à des attaques automatisées.', cause:'Pas de process', impact:'Sécurité réactive', recommendation:{term:'Moyen terme', action:'Planifier un scan récurrent'}}}] },
      { id: 'net_nac', category: 'Sécurité', question: 'Contrôle d\'accès réseau (NAC)', options: [{id:'yes', label:'Filtrage MAC / 802.1X', score:10}, {id:'no', label:'Tout appareil branché a accès', score:3, analysis:{level:'Modéré', risk:'L\'absence de contrôle d\'accès réseau (NAC) permet à n\'importe qui (visiteur, stagiaire, malveillant) de brancher un équipement sur une prise murale et d\'accéder au réseau interne sans authentification.', cause:'Complexité', impact:'Intrusion physique', recommendation:{term:'Long terme', action:'Sécuriser les ports switchs'}}}] }
    ]
  }
];

// --- COMPOSANTS UI ---

const ScoreGauge: React.FC<{ score: number; label: string; size?: 'sm' | 'lg' }> = ({ score, label, size = 'sm' }) => {
  const radius = size === 'lg' ? 56 : 28;
  const stroke = size === 'lg' ? 12 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = 'text-red-600';
  if (score >= 80) color = 'text-green-600';
  else if (score >= 50) color = 'text-orange-500';

  return (
    <div className="flex flex-col items-center group cursor-default">
      <div className={`relative ${size === 'lg' ? 'w-36 h-36' : 'w-20 h-20'} flex items-center justify-center`}>
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="#e5e7eb" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-lg'} text-gray-800`}>{Math.round(score)}</span>
        </div>
      </div>
      <span className={`mt-2 font-medium text-gray-600 text-center ${size === 'lg' ? 'text-base' : 'text-[10px] uppercase tracking-wide'}`}>{label}</span>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

export const Diagnostic: React.FC = () => {
  const { t } = useLanguage();
  const { triggerOpenWithContext } = useChat();
  
  // State Machine
  const [step, setStep] = useState<'menu' | 'audit' | 'analyzing' | 'report'>('menu');
  const [currentModuleId, setCurrentModuleId] = useState<AuditType | null>(null);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'risks' | 'actions'>('synthesis');
  
  // Question Flow
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  
  // Loader
  const [progress, setProgress] = useState(0);

  const activeModule = useMemo(() => 
    AUDIT_MODULES.find(m => m.id === currentModuleId), 
  [currentModuleId]);

  // --- ACTIONS ---

  const startModule = (id: AuditType) => {
    setCurrentModuleId(id);
    setQIndex(0);
    setAnswers({});
    setStep('audit');
  };

  const handleAnswer = (option: Option) => {
    if (!activeModule || !activeModule.questions) return;
    
    const currentQ = activeModule.questions[qIndex];
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));

    if (qIndex < activeModule.questions.length - 1) {
      // Petit délai pour l'UX
      setTimeout(() => setQIndex(prev => prev + 1), 200);
    } else {
      startAnalysis();
    }
  };

  const startAnalysis = () => {
    setStep('analyzing');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('report'), 500);
          return 100;
        }
        return prev + 5; // Rapide
      });
    }, 50);
  };

  // --- MOTEUR DE RAPPORT ---

  const report = useMemo(() => {
    if (step !== 'report' || !activeModule) return null;

    let totalScore = 0;
    let maxTotalScore = 0;
    const risks: RiskAnalysis[] = [];
    const categoryScores: Record<string, { current: number; max: number }> = {};

    activeModule.questions.forEach(q => {
      const ans = answers[q.id];
      if (ans) {
        // Global Score
        totalScore += ans.score;
        maxTotalScore += 10; // Max score per question is always 10

        // Sub Scores
        if (!categoryScores[q.category]) categoryScores[q.category] = { current: 0, max: 0 };
        categoryScores[q.category].current += ans.score;
        categoryScores[q.category].max += 10;

        // Risks
        if (ans.analysis) risks.push(ans.analysis);
      }
    });

    const finalScore = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
    
    // Sort risks by severity
    const severityWeight = { 'Critique': 4, 'Majeur': 3, 'Modéré': 2, 'Faible': 1 };
    risks.sort((a, b) => severityWeight[b.level] - severityWeight[a.level]);

    // Calculate sub-scores percentage
    const subScores = Object.entries(categoryScores).map(([label, scores]) => ({
      label,
      score: Math.round((scores.current / scores.max) * 100),
      state: scores.current / scores.max >= 0.8 ? 'excellent' : scores.current / scores.max >= 0.5 ? 'average' : 'poor'
    }));

    // Maturity Level
    let maturity = "Initial";
    if (finalScore >= 90) maturity = "Optimisé";
    else if (finalScore >= 70) maturity = "Maîtrisé";
    else if (finalScore >= 50) maturity = "Défini";
    else if (finalScore >= 30) maturity = "Reproductible";

    return { 
        score: finalScore, 
        maturity, 
        risks, 
        subScores,
        moduleTitle: activeModule.title,
        standard: activeModule.standard
    };
  }, [step, answers, activeModule]);

  // --- PDF GENERATION ---
  const handleDownloadPDF = () => {
    if (!report || !activeModule) return;
    
    // Mapping pour le générateur PDF générique
    const pdfRisks = report.risks.map(r => ({
        level: r.level,
        risk: r.risk,
        impact: r.impact,
        action: r.recommendation.action,
        effort: r.recommendation.term,
        category: "Risque identifié"
    }));

    const pdfData = {
        type: 'AUDIT' as const,
        reference: `AUDIT-${activeModule.id.toUpperCase()}-${new Date().getFullYear()}`,
        date: new Date().toLocaleDateString('fr-MA'),
        client: { name: "Interne / Client", address: "X-Zone Diagnostic" },
        items: [],
        
        auditTitle: activeModule.title,
        auditScore: report.score,
        auditMaturity: report.maturity,
        auditRisks: pdfRisks,
        auditSubScores: report.subScores.map(s => ({ ...s, state: s.state === 'excellent' || s.state === 'good' ? 'Bon' : 'À revoir' })),
        auditSynthesis: `Audit de maturité basé sur le référentiel ${activeModule.standard}. Le score global est de ${report.score}/100, correspondant à un niveau de maturité "${report.maturity}". ${report.risks.length} risques ont été identifiés nécessitant un plan d'action.`
    };

    generateDiagnosticPDF(pdfData);
  };

  const openExpertChat = () => {
    if(!report) return;
    const context = `
      CONTEXTE: Je suis un DSI ou Dirigeant consultant un rapport d'audit ${report.moduleTitle}.
      SCORE: ${report.score}/100 (Niveau ${report.maturity})
      RISQUES MAJEURS IDENTIFIÉS:
      ${report.risks.slice(0, 5).map(r => `- [${r.level}] ${r.risk} : ${r.recommendation.action}`).join('\n')}
      
      Agis comme un consultant senior X-Zone. Aide-moi à prioriser ces actions et explique-moi les risques si je ne fais rien. Sois professionnel, factuel et concis.
    `;
    triggerOpenWithContext(context);
  };

  return (
    <div className="bg-gray-50 font-sans text-corporate-text">
      <SEO title="Plateforme d'Audit IT - X-Zone" description="Outil de diagnostic professionnel d'infrastructure informatique." />

      {/* HEADER PRO */}
      <div className="bg-white border-b border-gray-200 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-corporate-blue p-2 rounded text-white">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Espace Audit & Conformité</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">X-Zone Technologie</p>
              </div>
            </div>
            {step !== 'menu' && (
              <Button variant="white" size="sm" className="text-gray-600 border-gray-300 py-1.5 text-xs" onClick={() => setStep('menu')}>
                Changer d'audit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">

        {/* STEP 1: MODULE SELECTION */}
        {step === 'menu' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez le périmètre d'audit</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm">
                Nos référentiels sont basés sur les standards ISO 27001, ISO 22301 et ITIL v4.
                Choisissez un module pour débuter l'évaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AUDIT_MODULES.map((module) => (
                <div 
                  key={module.id}
                  onClick={() => startModule(module.id)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-corporate-blue cursor-pointer transition-all group flex flex-col h-full"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 text-gray-600 group-hover:bg-blue-50 group-hover:text-corporate-blue transition-colors">
                    <module.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{module.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 flex-1 leading-relaxed">
                    {module.subtitle}
                  </p>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">{module.standard}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-corporate-blue transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: QUESTIONNAIRE */}
        {step === 'audit' && activeModule && activeModule.questions && activeModule.questions[qIndex] && (
          <div className="max-w-3xl mx-auto w-full animate-fade-in">
            <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
               <span>Question {qIndex + 1} sur {activeModule.questions.length}</span>
               <span className="font-semibold text-corporate-blue">{activeModule.questions[qIndex]?.category}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
              <div className="bg-corporate-blue h-1.5 rounded-full transition-all duration-300" style={{ width: `${((qIndex + 1) / activeModule.questions.length) * 100}%` }}></div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 md:p-10">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug">
                {activeModule.questions[qIndex]?.question}
              </h2>
              
              {activeModule.questions[qIndex]?.context && (
                <div className="mb-8 flex items-start text-sm text-blue-800 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <HelpCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {activeModule.questions[qIndex]?.context}
                </div>
              )}

              <div className="space-y-3">
                {activeModule.questions[qIndex]?.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-5 rounded-lg border border-gray-200 hover:border-corporate-blue hover:bg-gray-50 transition-all flex items-start group"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-4 flex-shrink-0 mt-0.5 group-hover:border-corporate-blue flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-corporate-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ANALYZING */}
        {step === 'analyzing' && (
          <div className="max-w-lg mx-auto w-full bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center animate-fade-in">
            <Loader2 className="w-10 h-10 mx-auto mb-6 animate-spin text-corporate-blue" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analyse de conformité en cours</h2>
            
            {/* ADDED PERCENTAGE HERE */}
            <div className="text-4xl font-bold text-corporate-blue my-4 font-heading transition-all duration-300">
              {progress}%
            </div>

            <p className="text-gray-500 text-sm mb-8">Consolidation des réponses et calcul des scores...</p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-corporate-blue transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* STEP 4: RAPPORT */}
        {step === 'report' && report && (
          <div className="animate-fade-in-up space-y-8 w-full">
            
            {/* Header Rapport */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
               <div>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Rapport d'audit</span>
                   <h2 className="text-3xl font-bold text-gray-900 mb-2">{report.moduleTitle}</h2>
                   <p className="text-gray-500 text-sm flex items-center">
                       <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Audit clôturé le {new Date().toLocaleDateString()}
                   </p>
               </div>
               <div className="flex items-center gap-8">
                   <div className="text-right hidden md:block">
                       <p className="text-sm text-gray-500 mb-1">Score Global</p>
                       <p className={`text-2xl font-bold ${report.score >= 80 ? 'text-green-600' : report.score >= 50 ? 'text-orange-500' : 'text-red-600'}`}>{report.score}/100</p>
                   </div>
                   <ScoreGauge score={report.score} label="Maturité" size="lg" />
               </div>
            </div>

            {/* Navigation Rapport */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('synthesis')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'synthesis' ? 'border-corporate-blue text-corporate-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Synthèse & Scores
                </button>
                <button 
                    onClick={() => setActiveTab('risks')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'risks' ? 'border-corporate-blue text-corporate-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Risques ({report.risks.length})
                </button>
                <button 
                    onClick={() => setActiveTab('actions')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'actions' ? 'border-corporate-blue text-corporate-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Plan d'Action
                </button>
            </div>

            {/* Contenu Rapport */}
            <div className="min-h-[400px]">
                
                {/* TAB 1: SYNTHÈSE */}
                {activeTab === 'synthesis' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6">Performance par Domaine</h3>
                            <div className="space-y-6">
                                {report.subScores.map((sub, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">{sub.label}</span>
                                            <span className="text-sm font-bold text-gray-900">{sub.score}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${sub.score >= 80 ? 'bg-green-500' : sub.score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} 
                                                style={{ width: `${sub.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-3 flex items-center"><Activity className="w-5 h-5 mr-2" /> Analyse de Maturité</h3>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Votre niveau de maturité est qualifié de <strong>"{report.maturity}"</strong>. 
                                    {report.score < 50 
                                        ? " Des écarts majeurs par rapport aux standards du marché sont constatés, exposant le système d'information à des risques critiques de disponibilité et de sécurité." 
                                        : report.score < 80 
                                        ? " Les fondamentaux sont présents mais des processus clés (MCO, Sécurité) manquent d'automatisation ou de contrôle, créant des zones de risque." 
                                        : " L'infrastructure est robuste et alignée sur les meilleures pratiques. L'effort doit porter sur l'amélioration continue."}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Répartition des Risques</h3>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                        <span className="block text-2xl font-bold text-red-600">{report.risks.filter(r => r.level === 'Critique').length}</span>
                                        <span className="text-xs text-red-800 uppercase font-semibold">Critiques</span>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <span className="block text-2xl font-bold text-orange-600">{report.risks.filter(r => r.level === 'Majeur').length}</span>
                                        <span className="text-xs text-orange-800 uppercase font-semibold">Majeurs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: RISQUES */}
                {activeTab === 'risks' && (
                    <div className="space-y-4 animate-fade-in">
                        {report.risks.map((risk, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                    risk.level === 'Critique' ? 'bg-red-100 text-red-600' :
                                    risk.level === 'Majeur' ? 'bg-orange-100 text-orange-600' :
                                    'bg-yellow-100 text-yellow-600'
                                }`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            risk.level === 'Critique' ? 'bg-red-100 text-red-800' :
                                            risk.level === 'Majeur' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>{risk.level}</span>
                                        <h4 className="font-bold text-gray-900 text-sm">Analyse du Risque</h4>
                                    </div>
                                    
                                    {/* DESCRIPTION DÉTAILLÉE DU RISQUE (PARAGRAPHE) */}
                                    <div className="text-gray-800 text-sm leading-relaxed text-justify mb-4">
                                        {risk.risk}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div className="text-sm">
                                            <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Cause Probable</span>
                                            <p className="text-gray-700">{risk.cause}</p>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Impact Métier</span>
                                            <p className="text-gray-700">{risk.impact}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {report.risks.length === 0 && (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                <p>Aucun risque majeur identifié.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: ACTIONS */}
                {activeTab === 'actions' && (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Priorité</th>
                                        <th className="px-6 py-4">Action Recommandée</th>
                                        <th className="px-6 py-4">Échéance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.risks.map((risk, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    risk.level === 'Critique' ? 'bg-red-500' :
                                                    risk.level === 'Majeur' ? 'bg-orange-500' :
                                                    'bg-yellow-500'
                                                }`}></div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{risk.recommendation.action}</td>
                                            <td className="px-6 py-4 text-gray-500">{risk.recommendation.term}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-8 flex justify-center">
                            <Button onClick={openExpertChat} className="mr-4">
                                <MessageCircle className="w-4 h-4 mr-2" /> Discuter avec un expert
                            </Button>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="flex flex-col items-center mt-12 border-t border-gray-200 pt-8 space-y-4">
               <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadPDF}>
                   <Download className="w-4 h-4 mr-2" /> Télécharger le Rapport Officiel (PDF)
               </Button>
               <button onClick={() => setStep('menu')} className="text-gray-500 hover:text-corporate-blue text-sm font-medium flex items-center transition-colors">
                   <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Retour au catalogue des audits
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};