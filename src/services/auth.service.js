const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
const { ConflictException } = require("../lib/exceptions");

const registerUser = async ({ email, password, firstName, lastName }) => {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new ConflictException("L'email est déjà utilisée.");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
        },
    });

    //Ne pas retourner le mot de passe
    const { password: _, ...safeUser } = user;
    return safeUser;
};

module.exports = { registerUser };

