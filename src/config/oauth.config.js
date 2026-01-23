export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/oauth/google/callback',
  
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  
  scope: ['profile', 'email'].join(' '),
  
  // Générer l'URL d'autorisation
  getAuthorizationUrl(state = '') {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });
    
    return `${this.authorizationUrl}?${params.toString()}`;
  }
};
