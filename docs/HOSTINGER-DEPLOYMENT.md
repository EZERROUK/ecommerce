# 🚀 Guide de Déploiement Hostinger - X-Zone Ecommerce

Ce guide te permettra de déployer ton projet **de A à Z** sur Hostinger (hébergement partagé avec hPanel).

---

## 📋 Architecture de déploiement

```
TONDOMAINE.com (domaine principal)
├── www.TONDOMAINE.com     → Frontend React (site vitrine)
└── panel.TONDOMAINE.com   → Backend Laravel (backoffice + API)
```

---

## 🔧 Étape 1 : Préparation locale

### 1.1 Build du projet

Exécute le script de build en local :

```powershell
cd "c:\laragon-6.0\www\X-Zone ecommerce"
.\scripts\build-production.ps1
```

Cela va créer :
- `frontend/dist/` → fichiers statiques du frontend
- Backend optimisé avec assets compilés

### 1.2 Mise à jour des fichiers .env

Modifie les fichiers suivants avec ton vrai domaine :

**Backend/.env.production** :
```env
APP_URL=https://panel.tondomaine.com
DB_DATABASE=u123456789_xzone
DB_USERNAME=u123456789_xzone
DB_PASSWORD=TonMotDePasse
SANCTUM_STATEFUL_DOMAINS=tondomaine.com,www.tondomaine.com,panel.tondomaine.com
SESSION_DOMAIN=.tondomaine.com
```

**frontend/.env.production** :
```env
VITE_API_BASE_URL=https://panel.tondomaine.com/api
VITE_STORAGE_BASE_URL=https://panel.tondomaine.com/storage
```

---

## 🌐 Étape 2 : Configuration Hostinger (hPanel)

### 2.1 Créer le sous-domaine pour le Backend

1. Connecte-toi à **hPanel** → https://hpanel.hostinger.com
2. Va dans **Domains** → **Subdomains**
3. Crée le sous-domaine : `panel.tondomaine.com`
4. Note le chemin du dossier créé (ex: `public_html/panel`)

### 2.2 Créer la base de données MySQL

1. Va dans **Databases** → **MySQL Databases**
2. Crée une nouvelle base de données :
   - **Database name** : `xzone` (Hostinger ajoutera un préfixe, ex: `u123456789_xzone`)
   - **Username** : `xzone` (même préfixe)
   - **Password** : Génère un mot de passe fort et note-le !

3. Note ces informations :
   ```
   Host: localhost
   Database: u123456789_xzone
   Username: u123456789_xzone
   Password: ********
   ```

### 2.3 Configurer la version PHP

1. Va dans **Advanced** → **PHP Configuration**
2. Sélectionne **PHP 8.2** ou supérieur
3. Active les extensions nécessaires :
   - `pdo_mysql`
   - `mbstring`
   - `openssl`
   - `tokenizer`
   - `xml`
   - `ctype`
   - `json`
   - `bcmath`
   - `fileinfo`
   - `gd` ou `imagick`

---

## 📤 Étape 3 : Upload des fichiers

### 3.1 Upload du Backend (panel.tondomaine.com)

**Via File Manager hPanel :**

1. Va dans **Files** → **File Manager**
2. Navigue vers `public_html/panel/`
3. **Upload tous les fichiers du dossier `Backend/`** sauf :
   - `node_modules/`
   - `.git/`
   - `storage/logs/*` (garde le dossier vide)
   - `tests/`
   
4. **IMPORTANT** : Le contenu de `Backend/public/` doit être à la racine de `public_html/panel/`

**Structure sur le serveur :**
```
public_html/
└── panel/
    ├── index.php          ← depuis Backend/public/
    ├── .htaccess          ← depuis Backend/public/
    ├── build/             ← depuis Backend/public/build/
    ├── storage/           ← lien symbolique (créer plus tard)
    └── ...autres fichiers public
    
    # Les fichiers Laravel vont dans un dossier parent
    # OU utiliser la méthode du lien symbolique
```

**Méthode recommandée pour Hostinger (hébergement partagé) :**

Comme tu n'as pas accès SSH complet, utilise cette structure :

```
public_html/
└── panel/                    ← sous-domaine panel.tondomaine.com
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── lang/
    ├── resources/
    ├── routes/
    ├── storage/
    ├── vendor/
    ├── .env                  ← copie de .env.production avec tes vraies valeurs
    ├── artisan
    ├── composer.json
    └── public/               ← ⚠️ C'est ici que le domaine doit pointer
        ├── index.php
        ├── .htaccess
        ├── build/
        └── storage → ../storage/app/public (lien symbolique)
```

**Pour que le sous-domaine pointe vers `/public` :**

1. Dans hPanel, va dans **Domains** → **Subdomains**
2. Modifie `panel.tondomaine.com`
3. Change le **Document Root** vers : `public_html/panel/public`

### 3.2 Upload du Frontend (www.tondomaine.com)

1. Va dans `public_html/` (racine du domaine principal)
2. **Supprime les fichiers par défaut** (index.html de Hostinger)
3. **Upload tout le contenu de `frontend/dist/`** :
   - `index.html`
   - `assets/`
   - `.htaccess`
   - autres fichiers statiques

---

## ⚙️ Étape 4 : Configuration sur le serveur

### 4.1 Créer le fichier .env du Backend

1. Dans File Manager, va dans `public_html/panel/`
2. Crée un nouveau fichier `.env`
3. Copie le contenu de `.env.production` et remplace :
   - `TONDOMAINE.com` → ton vrai domaine
   - Les infos de base de données
   - Génère une nouvelle `APP_KEY` (voir étape suivante)

### 4.2 Générer la clé d'application

**Option A - Via le navigateur (recommandé pour hébergement partagé) :**

Crée temporairement ce fichier `public_html/panel/public/generate-key.php` :

```php
<?php
require __DIR__.'/../vendor/autoload.php';

$key = 'base64:'.base64_encode(random_bytes(32));
echo "Ta nouvelle APP_KEY : <br><br>";
echo "<code>$key</code>";
echo "<br><br>Copie cette clé dans ton fichier .env, puis SUPPRIME ce fichier !";
```

1. Visite `https://panel.tondomaine.com/generate-key.php`
2. Copie la clé générée
3. Colle-la dans `.env` : `APP_KEY=base64:...`
4. **SUPPRIME le fichier `generate-key.php`** ⚠️

### 4.3 Exécuter les migrations et seeds

Crée le fichier `public_html/panel/public/setup.php` :

```php
<?php
require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<pre>";

// Migrations
echo "=== MIGRATIONS ===\n";
$kernel->call('migrate', ['--force' => true]);
echo $kernel->output();

// Seeders
echo "\n=== SEEDERS ===\n";
$kernel->call('db:seed', ['--force' => true]);
echo $kernel->output();

// Storage link
echo "\n=== STORAGE LINK ===\n";
$kernel->call('storage:link', ['--force' => true]);
echo $kernel->output();

// Cache
echo "\n=== CACHE ===\n";
$kernel->call('config:cache');
$kernel->call('route:cache');
$kernel->call('view:cache');
echo "Caches générés!\n";

echo "\n=== TERMINÉ ===\n";
echo "SUPPRIME CE FICHIER MAINTENANT !";
echo "</pre>";
```

1. Visite `https://panel.tondomaine.com/setup.php`
2. Vérifie que tout s'exécute sans erreur
3. **SUPPRIME le fichier `setup.php`** ⚠️

### 4.4 Créer le lien symbolique storage (si pas fait)

Si `storage:link` ne fonctionne pas, crée manuellement :

1. Dans File Manager, va dans `public_html/panel/public/`
2. Le dossier `storage` doit être un lien vers `../storage/app/public`

**Alternative** : Modifie `config/filesystems.php` pour utiliser un chemin absolu.

---

## ✅ Étape 5 : Vérifications finales

### 5.1 Tester le Backend

1. Visite `https://panel.tondomaine.com`
2. Tu devrais voir la page de login ou setup
3. Connecte-toi avec les credentials des seeds (si configurés)

### 5.2 Tester le Frontend

1. Visite `https://www.tondomaine.com`
2. Le site vitrine doit s'afficher
3. Vérifie que les appels API fonctionnent (produits, catégories)

### 5.3 Tester l'API

```
https://panel.tondomaine.com/api/v1/products
https://panel.tondomaine.com/api/v1/categories
```

---

## 🔒 Étape 6 : Sécurisation

### 6.1 Activer SSL (Let's Encrypt)

1. hPanel → **Security** → **SSL**
2. Active SSL pour :
   - `tondomaine.com`
   - `www.tondomaine.com`
   - `panel.tondomaine.com`
3. Active **Force HTTPS**

### 6.2 Fichiers à ne JAMAIS exposer

Vérifie que ces fichiers ne sont PAS accessibles :
- `https://panel.tondomaine.com/.env` → doit donner 403/404
- `https://panel.tondomaine.com/artisan` → doit donner 403/404

### 6.3 Supprimer les fichiers de setup

⚠️ **IMPORTANT** : Supprime ces fichiers après installation :
- `public/generate-key.php`
- `public/setup.php`

---

## 🔄 Mises à jour futures

Pour les prochaines mises à jour :

1. Build en local : `.\scripts\build-production.ps1`
2. Upload les fichiers modifiés via File Manager
3. Si migrations : crée temporairement `setup.php` avec seulement `migrate`
4. Vide les caches : crée `clear-cache.php` temporairement

---

## 🆘 Dépannage

### Erreur 500
- Vérifie les logs : `storage/logs/laravel.log`
- Vérifie les permissions des dossiers `storage/` et `bootstrap/cache/` (755)
- Vérifie que `.env` existe et est correct

### Page blanche
- Active `APP_DEBUG=true` temporairement
- Vérifie la version PHP (8.2+ requis)

### CORS errors
- Vérifie `config/cors.php`
- Vérifie `SANCTUM_STATEFUL_DOMAINS` dans `.env`

### Images non affichées
- Vérifie le lien symbolique `public/storage`
- Vérifie `VITE_STORAGE_BASE_URL` dans le frontend

---

## 📞 Support

Si tu as des problèmes :
1. Vérifie les logs Laravel : `storage/logs/laravel.log`
2. Vérifie la console navigateur (F12) pour les erreurs JS
3. Contacte le support Hostinger pour les problèmes serveur
