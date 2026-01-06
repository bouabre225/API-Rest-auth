# Tests d'Intégration

## 📋 Vue d'ensemble

Cette suite de tests valide le bon fonctionnement de l'API REST d'authentification avec un focus sur la sécurité et les fonctionnalités clés.

## 🧪 Tests de Sécurité (CORS + Helmet)

### CORS Configuration (3 tests)
- ✅ **Access-Control-Allow-Origin header** : Vérifie que les requêtes cross-origin sont autorisées
- ✅ **Preflight OPTIONS requests** : Teste les requêtes préliminaires CORS
- ✅ **Credentials handling** : Valide la gestion des credentials

### Helmet Configuration (8 tests)
- ✅ **X-Content-Type-Options** : Protection contre le MIME type sniffing
- ✅ **X-Frame-Options** : Protection contre les attaques clickjacking
- ✅ **X-DNS-Prefetch-Control** : Contrôle du DNS prefetching
- ✅ **X-Download-Options** : Protection pour IE8+
- ✅ **X-Permitted-Cross-Domain-Policies** : Contrôle des politiques cross-domain
- ✅ **Referrer-Policy** : Gestion de la politique de référence
- ✅ **Strict-Transport-Security** : HSTS (en production)
- ✅ **X-Powered-By removed** : Masquage de l'information serveur

### Combined CORS + Helmet (2 tests)
- ✅ **API routes security** : Vérifie la présence des headers sur les routes API
- ✅ **Error responses security** : Vérifie les headers même sur les erreurs 404

## 🚀 Exécution des tests

```bash
# Tous les tests
npm test

# Tests de sécurité uniquement
npm test tests/integration/securityHeader.test.js

# Avec Jest
npm run test:jest

# Mode watch
npm run test:watch
```

## 📊 Résultats attendus

```
✔ Security Headers - CORS Configuration (3/3)
✔ Security Headers - Helmet Configuration (8/8)
✔ Security Headers - Combined CORS + Helmet (2/2)
```

## 🔒 Sécurité implémentée

### CORS (Cross-Origin Resource Sharing)
- Permet les requêtes depuis différentes origines
- Gère les preflight requests
- Configuration flexible pour production/développement

### Helmet
Collection de middlewares pour sécuriser Express :
- **Content Security Policy** : Prévention XSS
- **DNS Prefetch Control** : Contrôle des requêtes DNS
- **Frame Options** : Protection clickjacking
- **HSTS** : Force HTTPS en production
- **IE No Open** : Sécurité IE
- **No Sniff** : Prévention MIME sniffing
- **Referrer Policy** : Contrôle des informations de référence
- **XSS Filter** : Filtre XSS (navigateurs anciens)

## 📝 Notes

- Les tests utilisent `supertest` pour simuler les requêtes HTTP
- Les headers de sécurité sont vérifiés sur toutes les routes
- La configuration Helmet/CORS est centralisée dans `src/app.js`
