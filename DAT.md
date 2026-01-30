# X‑Zone — Document d’Architecture Technique (DAT)

Date : 25 janvier 2026  
Version du document : 1.0.0 (référence : `info.version` dans `Backend/xzone-openapi.yaml`)  
Auteur : Non spécifié dans le dépôt (document produit par analyse statique du code)  
Équipe projet : Global Glimpse SARL (référence : `frontend/README.md`)  
Niveau de confidentialité : À renseigner (non spécifié dans le dépôt)

---

## 1. Historique et gestion du document

| Version | Date | Auteur | Description |
|-------|------|--------|-------------|
| 1.0.0 | 25/01/2026 | Non spécifié (généré) | Première version basée sur le dépôt (Backend + frontend). |

---

## 2. Résumé exécutif
1) Backoffice : UI Inertia/React servie par `Backend/` (rendu via routes web Laravel).
2) Site public : SPA React dans `frontend/`.

Les deux consomment (directement ou indirectement) les services du backend : DB, storage, queue, mail.

### 4.2 Principe de séparation des couches

- Couche Présentation (Backend) : contrôleurs HTTP, middlewares, validation (FormRequest), ressources JSON.
- Couche Métier : `Backend/app/Services`, `Backend/app/Actions`, `Backend/app/Domain`.
- Couche Accès aux données : modèles Eloquent, relations, scopes, migrations.

### 4.3 Protocoles et formats d’échange

- HTTP/HTTPS.
- JSON pour l’API (`Accept: application/json` côté client `frontend/utils/apiClient.ts`).
- Inertia (JSON + navigation côté client) pour le backoffice.
- Stockage fichiers : exposition via `/storage/*` (symlink `public/storage`).

### 4.4 Schéma logique des flux applicatifs (description textuelle)

Flux “site public” (SPA) :

1. Le navigateur charge la SPA `frontend/`.
2. La SPA appelle `/api/...` (via `fetch` et base URL `VITE_API_BASE_URL`, par défaut `/api`).
3. En dev, Vite proxifie `/api` et `/storage` vers `VITE_API_PROXY_TARGET` (Laravel).
4. Laravel traite la requête (routes, middlewares, validation, contrôleur), interagit avec la DB et/ou le storage.
5. Laravel renvoie JSON ; la SPA gère loading/erreurs et rend les vues.

Flux “backoffice” (Inertia) :

1. Le navigateur accède aux routes web Laravel.
2. Middlewares web (dont `EnsureAppIsConfigured`, `HandleInertiaRequests`, `SecurityHeaders`) exécutent.
3. Le contrôleur renvoie une réponse Inertia ; la UI React `Backend/resources/js` rend les pages.
4. Les rôles/permissions et paramètres partagés sont injectés via `HandleInertiaRequests`.

### 4.5 Principes d’architecture retenus

- Backend : architecture **Laravel MVC** (contrôleurs, modèles, requests, resources), enrichie par des services/actions.
- UI backoffice : pattern **Inertia** (rendu SPA piloté par le serveur, pages React).
- API : segmentation par contexte (public / client / v1 backoffice) + documentation (OpenAPI + doc dédiée v1).

---

## 5. Architecture Backend (détaillée)

### 5.1 Stack technique complète (référence `Backend/composer.json`)

- PHP `^8.2`.
- Laravel `^12.0`.
- ORM : Eloquent.
- Auth API : Laravel Sanctum.
- RBAC : Spatie Permission.
- Audit : Spatie Activity Log.
- PDF : `barryvdh/laravel-dompdf`.
- Exports : `maatwebsite/excel`.
- Images : `intervention/image`.

### 5.2 Organisation des dossiers (structure observée)

- `Backend/app/Http/Controllers/` : contrôleurs web et API.
- `Backend/app/Http/Controllers/Api/` : API publique.
- `Backend/app/Http/Controllers/Api/Client/` : API portail client.
- `Backend/app/Http/Controllers/Api/V1/` : API v1 backoffice.
- `Backend/app/Http/Middleware/` : middlewares (onboarding, sécurité headers, Inertia, portail client).
- `Backend/app/Models/` : modèles (relations, scopes, casts, soft deletes, audit).
- `Backend/app/Services/` : services métiers (ex : congés, promotions, compatibilités).
- `Backend/app/Actions/` : actions unitaires (ex : conversion devis → facture).
- `Backend/database/migrations/` : schéma DB.
- `Backend/resources/js/` : UI backoffice (Inertia + React) + SSR.

### 5.3 Description des couches

| Couche | Responsabilités | Exemples d’artefacts |
|---|---|---|
| Présentation | Routage, middlewares, validation, sérialisation, statuts HTTP | `routes/api.php`, `routes/web.php`, `app/Http/Middleware/*`, `app/Http/Requests/*`, `app/Http/Resources/*`, contrôleurs |
| Métier | Règles et cas d’usage, orchestration, intégrité | `app/Services/*`, `app/Actions/*`, `app/Domain/*` |
| Accès aux données | Modèles, relations, requêtes, migrations | `app/Models/*`, `database/migrations/*` |

### 5.4 Flux d’exécution d’une requête (exemple “création commande web”)

Endpoint : `POST /api/orders` (route dans `Backend/routes/api.php`, contrôleur `Backend/app/Http/Controllers/Api/WebOrderController.php`).

Chaîne d’exécution :

1. Router Laravel → contrôleur.
2. Validation via `StoreWebOrderRequest` (`$request->validated()`).
3. Chargement des produits + règles (refus des produits “prix sur devis”).
4. Transaction `DB::transaction` : création `WebOrder` + `WebOrderItem`, calcul HT/TVA/TTC, snapshot des champs produit.
5. Envoi emails en “best effort” (try/catch) ; log warning si échec.
6. Réponse JSON : `{ success: true, order: {...} }`.

### 5.5 Gestion des transactions

L’usage de `DB::transaction` est présent dans plusieurs flux critiques, notamment :

- commandes web (API),
- changements de statuts (backoffice),
- tickets, catégories/attributs,
- promotions / devis / factures,
- congés (services Leave).

Objectif : garantir l’atomicité des écritures multi-tables et maintenir la cohérence des agrégats (totaux, historiques, pivots).

### 5.6 Accès aux données et ORM

- Eloquent Models avec :
  - `SoftDeletes` (ex : `Product`).
  - `HasUuids` sur certaines entités (ex : `Product`).
  - relations `belongsTo`, `hasMany`, `belongsToMany`.
  - scopes (ex : `Product::visible()`) pour centraliser les règles de visibilité.
- Schéma DB maintenu via migrations (source de vérité).

### 5.7 Gestion des erreurs

- Gestion des 404 de modèles : `ModelNotFoundException` rendu en JSON (dans `Backend/bootstrap/app.php`) lorsque la requête attend du JSON ou cible `api/*`.
- Gestion d’erreurs applicatives via statuts HTTP explicites sur certains endpoints :
  - 401/403 pour login portail client,
  - 404 pour suivi commande introuvable,
  - 422 pour erreurs de validation ou contraintes métier (ex : produit introuvable / sur devis dans commande web).

### 5.8 Journalisation (logs)

- Logs techniques/applicatifs : utilisation de `Log::info|warning|error` dans plusieurs contrôleurs/services (ex : promotions, catégories, commandes web).
- Logs d’activité (audit) : `spatie/laravel-activitylog` activé sur des modèles (ex : `User`, `Product`).
- Logs de connexion : listeners `LogSuccessfulLogin` / `LogFailedLogin` alimentant la table de login logs.

> **Bonnes pratiques (implémentées)**
>
> - “Best effort” sur l’emailing commande web : la commande n’est pas rollback si l’envoi mail échoue, l’échec est journalisé.
> - Ajout de rate limiting nommé centralisé (cf. `AppServiceProvider`).

### 5.9 Sécurité Backend

#### 5.9.1 Authentification

- Backoffice (web) : routes d’auth standard (`Backend/routes/auth.php`) + middleware `auth` et `verified` sur `Backend/routes/web.php`.
- Portail client (API) : login `POST /api/client/login`, génération token Sanctum `createToken('client-portal')`.
- API v1 backoffice : `auth:sanctum`.

#### 5.9.2 Autorisations

- RBAC : Spatie Permission.
  - Sur web : middleware `permission:*`.
  - Sur API v1 : middleware `role:Admin|SuperAdmin`.
- Bypass `SuperAdmin` via `Gate::before` (`Backend/app/Providers/AuthServiceProvider.php`).

#### 5.9.3 Validation des entrées

- Validation Laravel via `FormRequest` (ex : `StoreWebOrderRequest`, `StoreProductReviewRequest`) et `Request::validate` (ex : suivi commande).

#### 5.9.4 Protection des données sensibles

- Cookies “baseline” durcissement : recommandé dans `Backend/docs/security-audit-2026-01-18.md` (ex : `SESSION_SECURE_COOKIE=true` en prod).
- Headers de sécurité : middleware `SecurityHeaders` (nosniff, X-Frame-Options, HSTS si HTTPS, Permissions-Policy, etc.).

> **Points de vigilance (issus du code)**
>
> - CSP non activée (choix explicite dans `SecurityHeaders`) : à évaluer en fonction des exigences sécurité.

### 5.10 API

#### 5.10.1 Convention de nommage

- Base : `/api`.
- Endpoints orientés ressources (produits, catégories, blog, etc.).
- Sous-espaces :
  - `client/*` pour le portail,
  - `v1/*` pour l’API backoffice.

#### 5.10.2 Versioning

- Versioning explicite : préfixe `/api/v1`.
- Conventions détaillées : `Backend/docs/api-v1.md`.

#### 5.10.3 Gestion des statuts HTTP

- 200 : réponses nominales (resources/JSON).
- 401/403 : authentification/autorisation (ex : login portail client).
- 404 : ressource introuvable (ex : suivi commande) + gestion centralisée `ModelNotFoundException`.
- 422 : validation/contraintes (ex : produit introuvable dans la commande, produit “sur devis”).

#### 5.10.4 Gestion des erreurs API

- Format minimal récurrent : `{ success: false, message: string }`.
- 404 “modèle introuvable” uniformisé pour `api/*`.
- OpenAPI : `Backend/xzone-openapi.yaml` décrit `ErrorResponse`.

---

## 6. Architecture Frontend (détaillée) — dossier `frontend/`

### 6.1 Stack technique (référence `frontend/package.json`)

- React 19.
- TypeScript.
- Vite.
- React Router.
- PDF : `jspdf`, `jspdf-autotable`.
- IA : `@google/genai`.
- Icons : `lucide-react`.

### 6.2 Organisation globale du code

- `frontend/index.tsx` : bootstrap React + providers.
- `frontend/App.tsx` : routing, lazy loading, layout.
- `frontend/pages/` : pages (Home, Shop, ProductDetail, Checkout, OrderTracking, etc.).
- `frontend/components/` : composants UI.
- `frontend/contexts/` : state global (chat, panier, langue).
- `frontend/utils/` : clients API, mappers, préfetching, génération PDF.

### 6.3 Architecture des composants

- Découpage par pages ; chargement différé via `React.lazy` et `Suspense`.
- Un layout conditionnel désactive header/footer sur la zone `/client-area/*`.

### 6.4 Gestion de l’état

- Context API :
  - `CartContext` persiste le panier en `localStorage`.
  - `ChatContext` stocke l’état d’ouverture et un “diagnosticContext”.

### 6.5 Routing

- `BrowserRouter`.
- Routes principales :
  - catalogue : `/shop`, `/produits`, détail `/produits/:id` et `/product/:id`,
  - panier/checkout : `/cart`, `/checkout`,
  - commande : `/order-success/:orderNumber`, `/order-tracking`,
  - contenu : `/blog`, `/blog/:slug`,
  - “client area” : `/client-area/*`.

### 6.6 Communication avec le Backend

- Client HTTP : `frontend/utils/apiClient.ts` (wrapper `fetch`).
  - Base URL : `VITE_API_BASE_URL` (par défaut `/api`).
  - Erreurs : exception `ApiError` avec `status`, `url`, `body`.
- API catalogue : `frontend/utils/apiCatalog.ts` (produits, recherche, catégories, avis).
- API commandes : `frontend/utils/apiOrders.ts` (création commande + tracking).

### 6.7 Gestion des erreurs et des chargements

- Pages gèrent explicitement :
  - états `isLoading`/`isSubmitting`,
  - affichage d’erreurs via message utilisateur,
  - fallbacks UI via `Suspense`.

### 6.8 Sécurité Frontend

- Persistance : seul le panier est persistant (`localStorage`).
- Auth portail client : non observée dans les fichiers analysés (absence d’injection systématique `Authorization: Bearer` dans `apiClient`).
- IA : `frontend/vite.config.ts` injecte `GEMINI_API_KEY` au code client.

> **Point de vigilance (issu du code)**
>
> - Une clé injectée au frontend doit être considérée comme exposée (risque de fuite/abus). Si le besoin est une clé secrète, le proxy doit être côté serveur.

### 6.9 Performance et bonnes pratiques

- Code splitting : lazy routes.
- Optimisation build : `frontend/vite.config.ts` définit `manualChunks` (react/ai/pdf/icons).
- Préfetching de routes : logique dédiée (ex : `prefetchCriticalRoutesOnIdle`).

---

## 7. Configuration et environnements

### 7.1 Variables d’environnement

Backend : `Backend/.env.example` (extraits structurants)

- Applicatif : `APP_ENV`, `APP_DEBUG`, `APP_URL`, `APP_LOCALE`.
- Logs : `LOG_CHANNEL`, `LOG_LEVEL`.
- DB : `DB_CONNECTION` (sqlite par défaut dans l’exemple).
- Session/cache/queue : `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`.

Frontend : `frontend/.env.example`

- `VITE_API_BASE_URL` (par défaut `/api`).
- `VITE_API_PROXY_TARGET` (cible proxy dev pour `/api` et `/storage`).

### 7.2 Séparation dev / test / recette / production

- Dev : `.env` basé sur `.env.example`.
- Test : `Backend/phpunit.xml` impose `APP_ENV=testing`, sqlite in-memory, queue sync, session array.
- Recette : non défini dans le dépôt.
- Prod : `Backend/docs/production.md` décrit prérequis, caches, migrations `--force`, permissions storage.

### 7.3 Paramètres critiques

- `APP_KEY` (obligatoire).
- `APP_DEBUG=false` en production.
- `APP_URL` correct (génération URLs et liens).
- DB : `DB_*`.
- Mail : requis si emailing opérationnel attendu (sinon mailer log possible).

### 7.4 Gestion des secrets

Le dépôt ne contient pas de mécanisme de coffre-fort (Vault/KMS) ni de politique de rotation. Les secrets sont attendus via variables d’environnement (`.env`) conformément aux pratiques Laravel.

---

## 8. Installation et mise en service

### 8.1 Prérequis techniques

- PHP >= 8.2 (recommandé 8.3 selon `Backend/docs/production.md`).
- Composer.
- Node.js >= 18.18 (contrainte dans `Backend/package.json`).
- SGBD : sqlite (dev) ou autre (prod) selon configuration.

### 8.2 Procédure d’installation Backend

Depuis `Backend/` :

1. `composer install`
2. `copy .env.example .env` puis renseigner `APP_KEY` via `php artisan key:generate`.
3. `php artisan migrate`
4. `npm install`

### 8.3 Procédure d’installation Frontend

Depuis `frontend/` :

1. `npm install`
2. Copier `.env.example` vers `.env.local` (ou équivalent) et ajuster `VITE_API_PROXY_TARGET`.

### 8.4 Lancement de l’application

- Backend (dev intégré) : `composer run dev` (serve + queue:listen + vite).
- Frontend SPA : `npm run dev` (dans `frontend/`).

### 8.5 Vérifications post‑installation

- Accès UI backoffice (route `/` redirige vers setup/login selon configuration).
- Endpoints API publics : `/api/products`, `/api/categories/tree`.
- Commande web : `/api/orders`.
- Suivi : `/api/orders/track`.
- Assets : `/storage/*` si `storage:link`.

---

## 9. Déploiement et exploitation

### 9.1 Stratégie de déploiement

Référence : `Backend/docs/production.md` et scripts :

- PowerShell : `Backend/scripts/deploy-prod.ps1`
- Bash : `Backend/scripts/deploy-prod.sh`

Les scripts couvrent : install dépendances, build Vite, caches Laravel ; options pour migrations et `storage:link` côté PowerShell.

### 9.2 Environnements

- Local : mode `local` des scripts.
- Production : mode `production` des scripts (`--no-dev`, `migrate --force`).

### 9.3 Rollback

Aucune stratégie de rollback automatisée n’est fournie dans le dépôt. Les scripts ne couvrent pas :

- rollback de migrations,
- versioning d’artefacts déployés,
- blue/green ou canary.

### 9.4 Supervision et monitoring

Non implémenté/documenté dans le dépôt.

### 9.5 Sauvegardes

Non implémenté/documenté dans le dépôt.

---

## 10. Sécurité et conformité

### 10.1 Bonnes pratiques appliquées (preuves dans le dépôt)

- Audit dépendances : `Backend/docs/security-audit-2026-01-18.md`.
- Rate limiting : `Backend/app/Providers/AppServiceProvider.php` + throttles dans `Backend/routes/api.php`.
- Headers de sécurité : `Backend/app/Http/Middleware/SecurityHeaders.php`.
- RBAC : Spatie Permission + bypass `SuperAdmin`.
- Validation : FormRequests + validation inline.

### 10.2 Risques identifiés (issus du code)

- Exposition potentielle de `GEMINI_API_KEY` au client (frontend build).
- CSP non activée (choix explicite).
- Frontend `frontend/` : absence observée d’intégration auth Sanctum (Bearer) alors que l’API portail client existe.

### 10.3 Mesures de mitigation (orientées mise en conformité, à valider)

- Déplacer les appels IA nécessitant secret côté backend, ou utiliser un proxy serveur.
- Évaluer une politique CSP compatible Inertia (mise en place progressive + reporting).
- Clarifier l’architecture “portail client” :
  - soit consommation directe de l’API Sanctum depuis un client dédié,
  - soit intégration au backoffice Inertia,
  - soit mise en place d’un BFF.

### 10.4 Conformité réglementaire

Non documentée dans le dépôt (RGPD, journaux légaux, conservation, etc.).

---

## 11. Performance et scalabilité

### 11.1 Points de charge

- Recherche produit (`/api/products/search`) identifiée comme coûteuse et protégée par un throttle dédié.
- Endpoints publics catalogue/catégories/blog protégés via throttling.

### 11.2 Limites identifiées

- Aucun mécanisme de cache applicatif explicite n’est décrit au niveau “feature” dans les fichiers analysés (en dehors des capacités Laravel via drivers).

### 11.3 Stratégies d’optimisation (existantes)

- Rate limiting centralisé.
- Queue disponible (script dev lance `queue:listen`).
- Build optimisé : chunks Vite côté `frontend/`.

### 11.4 Évolutivité

- Variables Redis présentes dans `.env.example` (capacité d’évolution vers cache/queue Redis).
- Structuration Services/Actions facilitant l’extraction de cas d’usage.

---

## 12. Maintenance et évolutions

### 12.1 Points sensibles du code

- Modèle “attributs” catalogue (approche EAV) : nécessite une discipline de migration/validation et une gestion de performance (relations et hydrations).
- Multiplicité de domaines (vente, stock, RH, helpdesk) : risque de couplage fonctionnel et complexité de tests.
- Synchronisation de champs snapshot (commande web) : cohérence des calculs HT/TVA/TTC et règles produits.

### 12.2 Bonnes pratiques de maintenance

- Maintenir la couverture tests Feature (Pest + sqlite in-memory).
- Consolider la normalisation des réponses d’erreur API si l’API devient un contrat inter‑SI.
- Documenter explicitement la stratégie de monitoring, sauvegarde, et rollback.

### 12.3 Stratégie d’évolution

- Continuer à isoler les cas d’usage en Services/Actions.
- Étendre l’API v1 selon les conventions `Backend/docs/api-v1.md`.

### 12.4 Dette technique identifiée (factuelle)

- Absence de mécanisme de rollback/supervision/sauvegarde dans le dépôt.
- Gestion du secret IA côté frontend.
- Recette non définie.

---

## 13. Annexes

### 13.1 Glossaire

- **Backoffice** : interface d’administration servie par Laravel via Inertia.
- **Portail client** : API dédiée aux comptes “client” (`portal_client=true`) protégée par Sanctum.
- **COD** : Cash On Delivery (paiement à la livraison), utilisé pour les commandes web.

### 13.2 Acronymes

- **DAT** : Document d’Architecture Technique.
- **RBAC** : Role-Based Access Control.
- **ORM** : Object-Relational Mapping.
- **SSR** : Server-Side Rendering.

### 13.3 Références techniques (dépôt)

- OpenAPI : `Backend/xzone-openapi.yaml`
- Conventions API v1 : `Backend/docs/api-v1.md`
- Déploiement production : `Backend/docs/production.md`
- Audit sécurité : `Backend/docs/security-audit-2026-01-18.md`
- Scripts déploiement : `Backend/scripts/deploy-prod.ps1`, `Backend/scripts/deploy-prod.sh`

### 13.4 Notes complémentaires

#### Export du DAT

Le dépôt inclut `scripts/export-dat.ps1` (à la racine) pour exporter ce fichier en HTML/DOCX/PDF via Pandoc.

#### Génération de captures (UI)

Le dépôt inclut `scripts/generate-screenshots.ps1` pour produire des captures dans `docs-assets/screenshots/`.

Limite opérationnelle constatée dans cette workspace : l'exécution de `php artisan` peut échouer si la version PHP locale est inférieure à celle requise par les dépendances Composer.
Dans ce cas, le script bascule automatiquement en **mode backoffice statique** :

- Génération de pages Inertia statiques à partir du build Vite du backoffice : `scripts/generate-backoffice-static-preview.mjs` (sortie : `Backend/public/dat-preview/`).
- Service HTTP statique via `php -S` sur `Backend/public/` (sans dépendre d'Artisan).
- Captures Puppeteer : `frontend/scripts/capture-screenshots.mjs` avec l'option `--backofficeStaticBase=...`.

### 13.5 Captures d’écran (preuves UI)

Les captures ci-dessous sont générées automatiquement (voir §13.4) dans `docs-assets/screenshots/`.

#### Site public (frontend)

![F01 — Accueil](docs-assets/screenshots/F01-home.png)
![F02 — Boutique / catalogue](docs-assets/screenshots/F02-shop.png)
![F03 — Détail produit](docs-assets/screenshots/F03-product-detail.png)
![F04 — Panier](docs-assets/screenshots/F04-cart.png)
![F05 — Checkout](docs-assets/screenshots/F05-checkout.png)
![F06 — Suivi de commande](docs-assets/screenshots/F06-order-tracking.png)
![F07 — Blog](docs-assets/screenshots/F07-blog.png)

#### Backoffice (Inertia)

![B01 — Login backoffice](docs-assets/screenshots/B01-login.png)
![B02 — Dashboard backoffice](docs-assets/screenshots/B02-dashboard.png)
![B03 — Gestion produits (index)](docs-assets/screenshots/B03-products-index.png)
![B04 — Gestion catégories (index)](docs-assets/screenshots/B04-categories-index.png)
![B05 — Gestion devis (index)](docs-assets/screenshots/B05-quotes-index.png)

### 8.3 Scalabilité

- Le backend est prêt pour :
  - exécution asynchrone via queue (`queue:listen` en dev script composer),
  - caching (variables `CACHE_STORE`, `REDIS_*` présentes dans `.env.example`).
- Les endpoints “coûteux” sont déjà throttlés (recherche).

---

## Annexes

### A. Références internes

- OpenAPI : `Backend/xzone-openapi.yaml`
- Conventions API v1 : `Backend/docs/api-v1.md`
- Procédure prod : `Backend/docs/production.md`
- Audit sécurité : `Backend/docs/security-audit-2026-01-18.md`

### B. Export du document (HTML / DOCX / PDF)

Le projet inclut un script PowerShell d’export : `scripts/export-dat.ps1`.

1) Depuis la racine du projet, lancer :

- `powershell -ExecutionPolicy Bypass -File .\scripts\export-dat.ps1`

2) Sorties générées (par défaut) dans `dist-docs/` :

- `DAT-X-Zone.html`
- `DAT-X-Zone.docx`
- `DAT-X-Zone.pdf` (si moteur LaTeX disponible)

Pré-requis :

- Pandoc (obligatoire)
- Pour PDF : moteur LaTeX (ex: MiKTeX)
