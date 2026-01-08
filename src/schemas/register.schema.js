import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom entier est requis'),
  lastName: z.string().min(2, 'Le nom entier est requis'),
});
