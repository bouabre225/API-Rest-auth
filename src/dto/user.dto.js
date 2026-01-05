export class UserDto {
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.emailVerifiedAt = user.emailVerifiedAt;
        this.twoFactorEnabledAt = user.twoFactorEnabledAt;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
        // Note: password and sensitive fields are intentionally excluded
    }
}
