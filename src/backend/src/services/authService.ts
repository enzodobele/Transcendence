import * as bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword; // On retourne uniquement le mot de passe haché
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};