import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

function withPepper(password: string): string {
  const pepper = process.env.INVYRA_PASSWORD_PEPPER ?? "";
  return `${password}${pepper}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(withPepper(password), PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(withPepper(password), passwordHash);
}
