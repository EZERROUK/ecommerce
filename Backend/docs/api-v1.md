# API Back-office v1

Cette API sert à exposer les données du backend à un front (admin/back-office / application externe).

## Auth
- Middleware: `auth:sanctum`
- Autorisation: `role:Admin|SuperAdmin`

## Conventions
- Pagination: `?page=1&per_page=20` (borné à 100)
- Recherche: `?search=...` (selon ressource)
- Tri: `?sort=field` ou `?sort=-field`
- Includes (relations): `?with=relation1,relation2` (whitelist côté controller)

Réponses listes: JSON Resource collection Laravel + `meta/links` Laravel, avec `success=true` ajouté.

## Endpoints
Base: `/api/v1`

## Référentiels

### Marques
- `GET /brands`
- `GET /brands/{id}`

### Devises
- `GET /currencies`
- `GET /currencies/{code}`

### Taux TVA
- `GET /tax-rates`
- `GET /tax-rates/{id}`

### Clients
- `GET /clients`
  - filtres: `search`, `is_active`
- `GET /clients/{id}`

### Fournisseurs
- `GET /providers`
  - filtres: `search`, `is_active`
- `GET /providers/{id}`

### Catégories
- `GET /categories`
  - filtres: `search`, `is_active`, `visibility`, `parent_id`
- `GET /categories/{id}`

### Produits
- `GET /products`
  - filtres: `search`, `is_active`, `category_id`, `visibility`
  - includes: `category`, `brand`, `documents`
- `GET /products/{id}`
  - includes: `category`, `brand`, `documents`, `images`, `variants`, `attributeValues`

### Variantes produit
- `GET /product-variants`
  - filtres: `parent_product_id`, `is_active`, `search`
  - includes: `parentProduct`, `images`
- `GET /product-variants/{id}`

### Images produit
- `GET /product-images`
  - filtres: `product_id`
- `GET /product-images/{id}`

### Historique prix
- `GET /price-histories`
  - filtres: `product_id`, `currency_code`
  - includes: `product`, `currency`
- `GET /price-histories/{id}`

### Promotions
- `GET /promotions`
  - filtres: `search`, `is_active`, `type`
  - includes: `actions`, `codes`, `products`, `categories`
- `GET /promotions/{id}`

### Codes promo
- `GET /promotion-codes`
  - filtres: `promotion_id`, `is_active`, `search`
  - includes: `promotion`
- `GET /promotion-codes/{id}`

### Devis
- `GET /quotes`
  - filtres: `search`, `status`, `client_id`
  - includes: `items`, `client`, `user`, `statusHistories`
- `GET /quotes/{id}`

### Factures
- `GET /invoices`
  - filtres: `search`, `status`, `client_id`
  - includes: `lines`, `client`, `currency`, `statusHistories`
- `GET /invoices/{id}`

### Commandes
- `GET /orders`
  - filtres: `search`, `status`, `client_id`
  - includes: `items`, `client`, `user`, `quote`
- `GET /orders/{id}`

### Stock
- `GET /stock-movements`
  - filtres: `product_id`, `provider_id`, `type`
  - includes: `product`, `provider`, `user`, `movementReason`, `currency`
- `GET /stock-movements/{id}`

### Raisons mouvements stock
- `GET /stock-movement-reasons`
  - filtres: `search`, `type`, `is_active`
- `GET /stock-movement-reasons/{id}`

### Pièces jointes mouvements stock
- `GET /stock-movement-attachments`
  - filtres: `stock_movement_id`
- `GET /stock-movement-attachments/{id}`

## RH

### Départements
- `GET /departments`
  - includes: `head`
- `GET /departments/{id}`

### Employés
- `GET /employees`
  - filtres: `department_id`, `manager_id`, `is_manager`, `status`, `search`
  - includes: `department`, `manager`, `user`
- `GET /employees/{id}`

### Types de congés
- `GET /leave-types`
  - filtres: `is_active`, `search`
- `GET /leave-types/{id}`

### Soldes congés
- `GET /leave-balances`
  - filtres: `employee_id`, `leave_type_id`, `year`
  - includes: `employee`, `leaveType`
- `GET /leave-balances/{id}`

### Demandes congés
- `GET /leave-requests`
  - filtres: `employee_id`, `leave_type_id`, `status`
  - includes: `employee`, `leaveType`, `managerEmployee`, `managerUser`, `hrUser`, `actions`
- `GET /leave-requests/{id}`

### Jours fériés
- `GET /holidays`
  - filtres: `search`, `year`, `is_recurring`
- `GET /holidays/{id}`

## Notes
- Les `Resources` ont été réalignées avec les champs réels des modèles (ex: `quote_number`, `order_number`, `invoice.number`).
- Si tu veux du CRUD complet (POST/PUT/DELETE) pour certaines entités, on peut ajouter des `FormRequest` + policies par ressource.
