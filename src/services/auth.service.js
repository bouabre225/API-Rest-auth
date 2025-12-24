import jwt from "jsonwebtoken";
import {authTokenDto} from "#dto/authToken.dto";

export class authService{
    static verifyAccessToken(token){
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        return new authTokenDto({
            userId: payload.userId,
            email: payload.email
        })
    }
}