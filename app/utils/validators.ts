export function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export function validatePassword(password: string) {
  return password.length >= 6;
}
