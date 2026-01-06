# API-Rest-auth

API REST d'authentification complète avec NodeJS + Express

## 📋 Description

Cette API fournit un système d'authentification complet avec :
- Inscription et connexion d'utilisateurs
- Authentification JWT (Access Token + Refresh Token)
- Gestion de profil utilisateur
- Validation des données avec Zod
- Base de données SQLite avec Prisma ORM
- Sécurité avec Helmet et CORS
- Tests d'intégration

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Générer le client Prisma
npm run db:generate

# Initialiser la base de données
npm run db:push
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_secret_jwt_key_minimum_32_characters_long"
CORS_ORIGIN="*"
```

## 🏃 Démarrage

```bash
# Développement avec rechargement automatique
npm run dev

# Production
npm start

# Tests
npm test

# Interface Prisma Studio
npm run db:studio
```

## 📚 Endpoints API

### Authentification

#### POST /api/users/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/users/login
Connexion d'un utilisateur existant.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Profil Utilisateur (Authentifié)

#### GET /api/users/me
Récupérer le profil de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /api/users/me
Mettre à jour le profil utilisateur.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

#### POST /api/users/logout
Déconnexion de l'utilisateur.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🗄️ Structure du Projet

```
src/
├── controllers/       # Contrôleurs (logique de routage)
├── services/         # Logique métier
├── middlewares/      # Middlewares (auth, validation, erreurs)
├── routes/           # Définition des routes
├── dto/              # Data Transfer Objects
├── schemas/          # Schémas de validation Zod
├── lib/              # Utilitaires (JWT, password, logger, etc.)
├── app.js            # Configuration Express
└── index.js          # Point d'entrée

prisma/
└── schema.prisma     # Schéma de base de données

tests/
└── integration/      # Tests d'intégration
```

## 🔒 Sécurité

- Mots de passe hashés avec Argon2
- Tokens JWT avec la bibliothèque Jose
- Headers de sécurité avec Helmet
- CORS configuré
- Validation des données avec Zod
- Gestion des erreurs centralisée

## 🧪 Tests

```bash
npm test
```

Les tests incluent :
- Tests d'authentification (register, login)
- Tests du middleware d'authentification
- Tests de validation des données
- Tests des headers de sécurité
- Tests de gestion d'erreurs

## 📦 Technologies Utilisées

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM pour base de données
- **SQLite** - Base de données
- **Jose** - Gestion JWT
- **Argon2** - Hashage de mots de passe
- **Zod** - Validation de schémas
- **Helmet** - Sécurité HTTP
- **Pino** - Logger
- **Supertest** - Tests d'intégration

## 👨‍💻 Auteur

Développé dans le cadre d'un TP NodeJS sur l'authentification REST API.

## 📝 License

ISC
