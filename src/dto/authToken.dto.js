export class AuthTokenDto {
    constructor({userId, email}) {
        this.userId = userId;
        this.email = email;
    }
}