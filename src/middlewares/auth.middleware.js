import {authService} from "#services/auth.service";

export function authMiddleware(req, res, next){
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(401).send('No Token');
    }

    const [, token] = authHeader.split(' ');
    try {
        req.user =  authService.verifyAccessToken(token);
        next();
    }catch {
        return res.status(401).send('Invalid Token')
    }
}