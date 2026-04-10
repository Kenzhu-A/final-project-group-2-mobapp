export const Validators = {
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
  isStrongPassword: (password: string) => {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters.' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Needs an uppercase letter.' };
    if (!/[0-9]/.test(password)) return { isValid: false, message: 'Needs a number.' };
    return { isValid: true, message: 'Valid' };
  },
  isRequired: (value: string) => value.trim().length > 0,
};