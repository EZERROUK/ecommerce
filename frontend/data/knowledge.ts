
export const knowledgeBase = [
  {
    id: "k-1",
    slug: "raid-2025-nouveaux-niveaux",
    title: "RAID 2025 : comprendre le rôle des nouveaux niveaux RAID-Z, RAID 60 et leurs usages",
    readingTime: "8 min",
    image: "/images/1139.avif",
    summary: "Le RAID matériel classique laisse place au RAID logiciel (ZFS) et aux configurations hybrides. Guide technique pour choisir la bonne redondance en 2025.",
    content: `
      <h3>Introduction</h3>
      <p>La gestion du stockage a radicalement évolué. Avec l'augmentation de la taille des disques (22TB et plus en 2025), les temps de reconstruction d'un RAID 5 classique sont devenus dangereux (plusieurs jours), augmentant le risque d'une deuxième panne fatale. Voici les standards actuels.</p>

      <h3>La fin du RAID 5 pour les gros volumes</h3>
      <p>En 2025, le RAID 5 est déconseillé pour les disques de plus de 4TB. Le risque d'erreur de lecture irrécupérable (URE) lors de la reconstruction est statistiquement trop élevé. Le <strong>RAID 6</strong> (double parité) est le minimum vital pour les NAS d'entreprise utilisant des disques mécaniques.</p>

      <h3>L'avènement du RAID-Z (ZFS)</h3>
      <p>Le ZFS n'est pas seulement un système de fichiers, c'est un gestionnaire de volume logique. Contrairement au RAID matériel, il connaît les données.</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>RAID-Z1 :</strong> Similaire au RAID 5, mais sans le problème du "write hole" (perte de données lors d'une coupure de courant pendant l'écriture).</li>
        <li><strong>RAID-Z2 :</strong> Similaire au RAID 6, permet la perte de 2 disques. Standard actuel pour le stockage de sauvegarde.</li>
        <li><strong>Self-Healing :</strong> ZFS détecte et corrige silencieusement la corruption de données (bit rot) grâce aux sommes de contrôle (checksums), ce que les cartes RAID matérielles ne font pas toujours.</li>
      </ul>

      <h3>RAID 10 et RAID 60 : La performance</h3>
      <p>Pour les bases de données et la virtualisation nécessitant des IOPS élevées :</p>
      <ul>
        <li><strong>RAID 10 (Miroir + Stripe) :</strong> La meilleure performance en écriture et la reconstruction la plus rapide. C'est le choix roi pour les bases de données SQL critiques, malgré la perte de 50% d'espace.</li>
        <li><strong>RAID 60 :</strong> Combine la sécurité du RAID 6 et la vitesse du Striping (RAID 0). Idéal pour les serveurs de fichiers très volumineux (> 100TB).</li>
      </ul>

      <h3>Conclusion</h3>
      <p>En 2025, préférez le RAID logiciel (ZFS/Linux MD) pour la flexibilité et l'intégrité des données, ou le RAID matériel avec cache Flash pour la performance pure brute.</p>
    `
  },
  {
    id: "k-2",
    slug: "dimensionner-onduleur-ups-2025",
    title: "Comment dimensionner un Onduleur (UPS) pour un parc informatique moderne",
    readingTime: "6 min",
    image: "/images/ups.avif",
    summary: "VA vs Watts, autonomie, topologie Line-Interactive vs On-Line : ne faites plus l'erreur de sous-dimensionner votre protection électrique.",
    content: `
      <h3>Introduction</h3>
      <p>Un onduleur (UPS) mal dimensionné est pire que pas d'onduleur : il donne un faux sentiment de sécurité mais lâchera instantanément lors d'une charge de pointe. Voici comment calculer vos besoins.</p>

      <h3>1. Comprendre la différence VA vs Watts</h3>
      <p>Les fabricants affichent souvent les Volt-Ampères (VA) en gros, mais c'est la puissance en Watts (W) qui compte vraiment. Le ratio est le facteur de puissance (pf).</p>
      <p><em>Formule : Watts = VA x pf</em></p>
      <p>En 2025, les alimentations modernes (PFC Actif) ont un pf proche de 0.9 ou 1. Mais attention aux onduleurs entrée de gamme qui ont un pf de 0.6. Un onduleur de 1000VA bas de gamme ne fournit que 600W !</p>

      <h3>2. Calculer la consommation réelle</h3>
      <p>N'utilisez pas la puissance inscrite sur le bloc d'alimentation (ex: 750W). C'est la capacité max, pas la conso réelle. Utilisez un wattmètre ou estimez :</p>
      <ul class="list-disc pl-5 mb-4">
        <li>Serveur PME standard : 150W - 300W en charge moyenne.</li>
        <li>PC de bureau + écran : 100W - 150W.</li>
        <li>Switch réseau 24/48 ports PoE : Attention, peut monter à 400W-800W selon les appareils connectés !</li>
      </ul>
      <p><strong>Règle d'or :</strong> La charge totale ne doit pas dépasser 70% de la capacité maximale de l'onduleur.</p>

      <h3>3. Choisir la technologie</h3>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Off-Line :</strong> À éviter pour les pros. Temps de bascule trop long pour les serveurs sensibles.</li>
        <li><strong>Line-Interactive :</strong> Le standard pour les racks réseau et serveurs PME. Lisse les variations de tension (AVR) sans passer sur batterie.</li>
        <li><strong>On-Line (Double Conversion) :</strong> Le courant est régénéré en permanence. Indispensable pour les équipements critiques, médicaux, ou si le réseau électrique local est très instable (groupes électrogènes).</li>
      </ul>
    `
  },
  {
    id: "k-3",
    slug: "hdd-ssd-nvme-stockage-2025",
    title: "HDD vs SSD vs NVMe 2025 : quel stockage choisir pour vos serveurs ?",
    readingTime: "5 min",
    image: "/images/StockageHDD.avif",
    summary: "Le disque dur mécanique est-il mort ? Le NVMe est-il trop cher ? Comparatif des performances, de l'endurance et du coût au Go.",
    content: `
      <h3>Le paysage du stockage en 2025</h3>
      <p>La hiérarchie du stockage est désormais claire. Le HDD n'est pas mort, il s'est spécialisé.</p>

      <h3>1. NVMe (Gen4 et Gen5) : La performance absolue</h3>
      <p>C'est le standard pour le disque système (OS) et les bases de données "chaudes".</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Débits :</strong> 7000 à 12000 Mo/s.</li>
        <li><strong>Latence :</strong> < 0.05 ms.</li>
        <li><strong>Usage :</strong> Virtualisation, ERP, SQL, caches.</li>
      </ul>

      <h3>2. SSD SATA (Enterprise) : Le compromis</h3>
      <p>Limités par l'interface SATA (600 Mo/s), ils restent pertinents pour le stockage "Tiède" ou pour remplacer les HDD dans d'anciens serveurs sans slots M.2/U.2. Attention à l'endurance (DWPD - Drive Writes Per Day). En serveur, ne prenez jamais de SSD grand public (QLC), ils mourront en quelques mois.</p>

      <h3>3. HDD (Disque Mécanique) : Le roi du volume</h3>
      <p>Avec des capacités atteignant 26TB ou 30TB, le HDD offre un coût au To imbattable (5 à 10 fois moins cher que le SSD).</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Usage :</strong> Archivage, Sauvegardes, Vidéosurveillance (NVR), File Servers froids.</li>
        <li><strong>Performance :</strong> Faible en aléatoire. Correcte en séquentiel (gros fichiers).</li>
      </ul>

      <h3>Le Tiering (Stockage Hybride)</h3>
      <p>La bonne pratique en 2025 n'est pas de choisir, mais de combiner. Les solutions modernes (Synology, Windows Server, vSAN) font du "Tiering" automatique : les données souvent utilisées bougent seules vers le NVMe, les vieilles données descendent vers les HDD.</p>
    `
  },
  {
    id: "k-4",
    slug: "virtualisation-comparatif-2025",
    title: "Virtualisation Serveur : VMware, Proxmox, Hyper-V — comparatif 2025",
    readingTime: "7 min",
    image: "/images/Server.avif",
    summary: "Suite au rachat de VMware et au changement de modèle de licence, le marché a été bouleversé. Qui est le nouveau roi de la virtualisation pour les PME ?",
    content: `
      <h3>Le séisme VMware</h3>
      <p>Depuis le rachat par Broadcom, la fin des licences perpétuelles et l'augmentation des coûts ont poussé de nombreuses PME marocaines à revoir leur stratégie. VMware ESXi/vSphere reste le leader technique incontesté pour les très grands comptes, mais l'alternative est devenue nécessaire pour les autres.</p>

      <h3>Proxmox VE : Le challenger Open Source</h3>
      <p>C'est le grand gagnant de 2024-2025.</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Avantages :</strong> Gratuit (open source), support payant abordable, sauvegarde intégrée (Proxmox Backup Server), supporte nativement les Conteneurs LXC en plus des VM.</li>
        <li><strong>Inconvénients :</strong> Écosystème tiers moins riche (Veeam commence à peine à le supporter officiellement).</li>
        <li><strong>Cible :</strong> PME, ETI, Homelab, Éducation.</li>
      </ul>

      <h3>Microsoft Hyper-V : La continuité</h3>
      <p>Si vous êtes un environnement 100% Windows, Hyper-V reste un choix solide, souvent "gratuit" car inclus dans Windows Server Standard/Datacenter.</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Avantages :</strong> Intégration Active Directory parfaite, support Azure hybride excellent.</li>
        <li><strong>Inconvénients :</strong> Gestion un peu vieillissante via SCVMM, moins performant sous Linux que KVM/Proxmox.</li>
      </ul>

      <h3>Verdict 2025</h3>
      <p>Pour une nouvelle infrastructure PME sans héritage lourd, <strong>Proxmox</strong> offre le meilleur ROI. Pour les grandes infrastructures avec budgets conséquents, VMware reste le standard de fiabilité.</p>
    `
  },
  {
    id: "k-5",
    slug: "switch-l2-vs-l3-guide",
    title: "Switchs L2 vs L3 : quelles différences et comment choisir ?",
    readingTime: "5 min",
    image: "/images/Network.avif",
    summary: "Comprendre la couche OSI pour optimiser votre réseau. Quand avez-vous réellement besoin de routage inter-VLAN au niveau du switch ?",
    content: `
      <h3>Définitions simples</h3>
      <p><strong>Layer 2 (L2) :</strong> Le switch travaille avec les adresses MAC. Il commute les paquets au sein d'un même réseau (même sous-réseau IP). Il ne sait pas envoyer des données d'un VLAN à un autre.</p>
      <p><strong>Layer 3 (L3) :</strong> Le switch comprend les adresses IP. Il peut faire du routage. C'est un hybride entre un switch rapide et un routeur.</p>

      <h3>Le problème du "Router on a stick"</h3>
      <p>Dans une architecture classique L2, si un PC du VLAN Compta veut parler à l'imprimante du VLAN Direction, le trafic doit remonter jusqu'au routeur/firewall, être traité, puis redescendre vers le switch. Cela surcharge le lien vers le routeur (goulot d'étranglement).</p>

      <h3>La solution L3</h3>
      <p>Avec un switch L3 en cœur de réseau, le routage inter-VLAN se fait à la vitesse du câble (wire speed), directement dans le switch. Le routeur/firewall ne gère plus que le trafic qui sort vers Internet.</p>

      <h3>Quand choisir un L3 ?</h3>
      <ul class="list-disc pl-5 mb-4">
        <li>Si vous avez plus de 3 VLANs actifs avec beaucoup de trafic entre eux (ex: VLAN Utilisateurs vers VLAN Serveurs).</li>
        <li>Si votre lien vers le firewall sature.</li>
        <li>Pour les cœurs de réseau de campus ou d'immeubles.</li>
      </ul>
      <p>Pour un petit réseau plat ou avec peu de trafic inter-VLAN, un switch L2 manageable (L2+) suffit largement et coûte moins cher.</p>
    `
  },
  {
    id: "k-6",
    slug: "segmentation-reseau-securite-2025",
    title: "Sécurité réseau : comment implémenter une segmentation efficace en 2025 ?",
    readingTime: "6 min",
    image: "/images/csca.avif",
    summary: "Le réseau plat est mort. Découvrez comment diviser pour mieux régner et empêcher la propagation latérale des ransomwares.",
    content: `
      <h3>Le danger du réseau plat</h3>
      <p>Dans un réseau "plat", une fois qu'un hacker ou un virus a compromis un ordinateur (ex: celui de la réception), il a un accès direct à tous les autres équipements : serveurs, imprimantes, caméras, PC du directeur. La segmentation est le pare-feu interne.</p>

      <h3>Niveau 1 : La segmentation par VLAN (Macro-segmentation)</h3>
      <p>C'est la base. Séparez vos équipements par fonction :</p>
      <ul>
        <li>VLAN Utilisateurs</li>
        <li>VLAN Serveurs</li>
        <li>VLAN IoT/Caméras (très vulnérables, à isoler absolument !)</li>
        <li>VLAN Invités (accès Internet uniquement)</li>
        <li>VLAN Management (pour l'administration des switchs, accès très restreint)</li>
      </ul>

      <h3>Niveau 2 : Les ACLs (Listes de Contrôle d'Accès)</h3>
      <p>Créer des VLANs ne suffit pas si le routage est ouvert. Vous devez appliquer des règles : "Le VLAN Caméras ne peut parler qu'au serveur NVR, pas à Internet, pas aux PC".</p>

      <h3>Niveau 3 : Micro-segmentation (Zero Trust)</h3>
      <p>En 2025, on va plus loin. Même deux PC dans le même VLAN ne devraient pas forcément se parler. La micro-segmentation (souvent via des agents logiciels ou des switchs intelligents) permet de bloquer les communications Est-Ouest inutiles. Si le PC A est infecté, il ne peut pas scanner le PC B voisin.</p>

      <h3>Bonnes pratiques</h3>
      <p>Commencez par isoler l'IoT et les sauvegardes. Ce sont les vecteurs d'attaque et les cibles prioritaires des ransomwares.</p>
    `
  },
  {
    id: "k-7",
    slug: "haute-disponibilite-architecture",
    title: "Haute Disponibilité (HA) : architectures et bonnes pratiques 2025",
    readingTime: "7 min",
    image: "/images/247.webp",
    summary: "Éliminer les SPOF (Single Point of Failure). Cluster, Load Balancing, VRRP : comment assurer la continuité de service.",
    content: `
      <h3>La règle des 9 (SLA)</h3>
      <p>La haute disponibilité se mesure en temps d'arrêt tolérable. 99.9% = 8h d'arrêt/an. 99.99% = 52 min/an. Chaque "9" supplémentaire coûte exponentiellement plus cher.</p>

      <h3>Identifier les SPOF</h3>
      <p>Un Single Point of Failure est un élément dont la panne arrête tout le système. Exemple classique : vous avez 2 serveurs en cluster, mais ils sont branchés sur le même switch ou le même onduleur. Si le switch lâche, le cluster ne sert à rien.</p>

      <h3>Architectures HA courantes en PME</h3>
      <p><strong>1. Virtualisation (Cluster à 2 ou 3 nœuds) :</strong> Si un serveur physique tombe, les VM redémarrent automatiquement sur l'autre (HA VMware/Proxmox). Nécessite un stockage partagé (SAN/NAS) qui devient lui-même un SPOF s'il n'est pas redondé.</p>
      
      <p><strong>2. Réseau (Stacking et LACP) :</strong> Utiliser deux switchs en "stack" (vus comme un seul). Relier les serveurs avec 2 câbles (LACP), un vers chaque switch. Si un câble ou un switch casse, le lien tient.</p>
      
      <p><strong>3. Firewall (Actif/Passif) :</strong> Deux firewalls. Le premier gère le trafic. S'il ne répond plus (heartbeat perdu), le second prend le relais instantanément et récupère l'adresse IP virtuelle (VIP).</p>

      <h3>Le facteur humain</h3>
      <p>Attention : 60% des pannes sont dues à des erreurs humaines ou des mises à jour ratées. La redondance matérielle ne protège pas contre une mauvaise configuration poussée sur les deux équipements simultanément.</p>
    `
  },
  {
    id: "k-8",
    slug: "optimisation-licences-microsoft-365",
    title: "Les licences Microsoft 365 en 2025 : comment optimiser les coûts ?",
    readingTime: "5 min",
    image: "/images/licence.avif",
    summary: "Business Basic, Standard, Premium ? NCE ? Guide pour ne payer que ce que vous utilisez vraiment.",
    content: `
      <h3>Le maquis des licences</h3>
      <p>Microsoft change régulièrement ses noms et ses tarifs. En 2025, pour une PME (< 300 utilisateurs), le choix se résume souvent à trois plans :</p>
      <ul class="list-disc pl-5 mb-4">
        <li><strong>Business Basic :</strong> Web apps + Exchange (Mail) + Teams + SharePoint. Pas d'Office bureau. Idéal pour les "Frontline workers" ou ceux qui n'ont besoin que du mail sur mobile.</li>
        <li><strong>Business Standard :</strong> Le classique. Ajoute les applications Word/Excel/Outlook installables sur PC/Mac.</li>
        <li><strong>Business Premium :</strong> Le "Game Changer". Ajoute Intune (gestion de parc), Defender for Business (antivirus avancé), et Azure AD P1 (sécurité conditionnelle).</li>
      </ul>

      <h3>L'erreur classique : Standard + Sécurité Tierce</h3>
      <p>Beaucoup d'entreprises prennent du "Standard" et paient à côté un antivirus cher + un outil de MDM. Souvent, passer en "Premium" coûte moins cher que "Standard + Antivirus + MDM" et offre une meilleure intégration.</p>

      <h3>Optimisation NCE (New Commerce Experience)</h3>
      <p>Microsoft pousse l'engagement annuel (-20% de prix). L'astuce ?</p>
      <p>Engagez 80% de vos licences en annuel (socle stable d'employés) et gardez 20% en mensuel (flexible) pour gérer les stagiaires, les CDD ou les pics d'activité. Vous optimisez le coût tout en gardant de la souplesse.</p>
      
      <h3>Comptes de service</h3>
      <p>Ne payez pas une licence complète pour une "boîte générique" (ex: contact@societe.com). Convertissez-la en "Boîte partagée" (Shared Mailbox), c'est gratuit et ne nécessite pas de licence (tant qu'elle ne dépasse pas 50Go et n'a pas besoin de login direct).</p>
    `
  }
];
