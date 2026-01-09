import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { TokenService } from '../src/services/token.service.js';

describe('Token Service - Jp (Tokens & Sessions)', () => {
  const TEST_USER_ID = 'test-user-uuid-123';
  let testToken = null;
  
  describe('Création et validation de tokens', () => {
    it('devrait générer un token unique', () => {
      const token1 = TokenService.generateToken();
      const token2 = TokenService.generateToken();
      
      assert.ok(token1);
      assert.ok(token2);
      assert.notStrictEqual(token1, token2);
      assert.strictEqual(typeof token1, 'string');
      assert.strictEqual(token1.length, 80); // 40 bytes en hex
    });
    
    it('devrait créer un refresh token pour un utilisateur', async () => {
      const refreshToken = await TokenService.createRefreshToken(TEST_USER_ID, {
        device: 'iPhone 13',
        userAgent: 'Mozilla/5.0 Test',
        ipAddress: '192.168.1.1'
      });
      
      assert.ok(refreshToken);
      assert.ok(refreshToken.token);
      assert.strictEqual(refreshToken.userId, TEST_USER_ID);
      assert.ok(refreshToken.expiresAt > new Date());
      
      testToken = refreshToken.token;
    });
    
    it('devrait vérifier un token valide', async () => {
      const verification = await TokenService.verifyToken(testToken);
      
      assert.strictEqual(verification.valid, true);
      assert.ok(verification.user);
      assert.strictEqual(verification.user.id, TEST_USER_ID);
    });
    
    it('devrait rejeter un token invalide', async () => {
      const verification = await TokenService.verifyToken('token-invalide-123');
      
      assert.strictEqual(verification.valid, false);
      assert.ok(verification.reason);
    });
  });
  
  describe('Gestion des sessions', () => {
    it('devrait lister les sessions actives', async () => {
      const sessions = await TokenService.getUserSessions(TEST_USER_ID);
      
      assert.ok(Array.isArray(sessions));
      assert.ok(sessions.length >= 1);
      
      const session = sessions[0];
      assert.ok(session.id);
      assert.ok(session.tokenPreview.includes('...'));
      assert.ok(session.device);
      assert.ok(session.createdAt);
    });
    
    it('devrait révoquer une session', async () => {
      // Crée une session à révoquer
      const newToken = await TokenService.createRefreshToken(TEST_USER_ID, {
        device: 'Test Device'
      });
      
      const sessionsBefore = await TokenService.getUserSessions(TEST_USER_ID);
      const initialCount = sessionsBefore.length;
      
      // Révoque la session
      const result = await TokenService.revokeToken(newToken.id);
      assert.strictEqual(result.success, true);
      
      const sessionsAfter = await TokenService.getUserSessions(TEST_USER_ID);
      assert.ok(sessionsAfter.length < initialCount);
    });
    
    it('devrait révoquer toutes les sessions sauf une', async () => {
      // Crée plusieurs sessions
      await TokenService.createRefreshToken(TEST_USER_ID, { device: 'Device 1' });
      await TokenService.createRefreshToken(TEST_USER_ID, { device: 'Device 2' });
      const keepToken = await TokenService.createRefreshToken(TEST_USER_ID, { device: 'Device à garder' });
      
      const sessionsBefore = await TokenService.getUserSessions(TEST_USER_ID);
      const initialCount = sessionsBefore.length;
      
      // Révoque toutes sauf une
      const result = await TokenService.revokeAllUserTokens(TEST_USER_ID, keepToken.id);
      assert.strictEqual(result.success, true);
      assert.ok(result.count > 0);
      
      const sessionsAfter = await TokenService.getUserSessions(TEST_USER_ID);
      assert.strictEqual(sessionsAfter.length, 1); // Une seule session gardée
    });
  });
});