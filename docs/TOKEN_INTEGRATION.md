# Intégration Service Tokens & Sessions
**Jp - Gestion des Tokens & Sessions**

## Fonctionnalités implémentées

### 1. Refresh Tokens (Whitelist)
- Création de refresh tokens sécurisés (duree : 7 jours)
- Validation via whitelist (base de données)
- Vérification d'expiration et de révocation

### 2. Gestion des Sessions
- Listing des sessions actives par utilisateur
- Révocation individuelle de sessions
- Révocation de toutes les sessions sauf la courante
- Métadonnées des sessions (device, IP, user-agent)

### 3. Endpoints REST
- POST /auth/refresh - Rafraîchir access token
- GET /auth/sessions - Lister sessions actives
- DELETE /auth/sessions/:id - Révoquer une session
- DELETE /auth/sessions/others - Révoquer autres sessions


## 🔌 Intégration pour vous les autres membres

### Pour Personne 2 (Authentification Core) :

**Après un login réussi :**
```javascript
import { TokenService } from '#services/token.service';

// Créer un refresh token
const refreshToken = await TokenService.createRefreshToken(
  user.id,
  {
    device: req.headers['user-agent'],
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
);

// Renvoyer au client
res.json({
  accessToken: 'votre_jwt_ici',
  refreshToken: refreshToken.token,
  expiresIn: 900
});


### SUITE
**Après un login réussi :**

javascript
// Révoquer toutes les sessions existantes
await TokenService.revokeAllUserTokens(userId);
Pour Personne 1 (Blacklist) :
Coordination pour la révocation :

javascript
// Quand un utilisateur se déconnecte :
// 1. Personne 3 révoque le refresh token
await TokenService.revokeToken(refreshTokenId);

// 2. Personne 1 blacklist l'access token associé
await BlacklistService.add(accessToken);
📊 Modèle de données RefreshToken
prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  revokedAt DateTime?  // null = non révoqué
  createdAt DateTime  @default(now())
}



### Tests disponibles



# Exécuter les tests
node --test tests/token.test.js

Configuration requise
Variables d'environnement :

fichier env :
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="votre_secret_pour_les_jwt"

Dépendances :
npm install @prisma/client crypto


Points dintégration critiques
Login → Appeler TokenService.createRefreshToken()
Logout → Appeler TokenService.revokeToken() + blacklist
Refresh token → Appeler TokenService.verifyToken()
Changement password → Appeler TokenService.revokeAllUserTokens()


### .env (ajoutez ca la dans env chez vous si y a pas ca)
fichier env :
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="votre_super_secret_jwt_minimum_32_caracteres"