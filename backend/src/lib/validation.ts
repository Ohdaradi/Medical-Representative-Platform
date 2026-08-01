export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 10) errors.push('Password must be at least 10 characters long.');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter.');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter.');
  if (!/\d/.test(password)) errors.push('Password must contain at least one number.');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character.');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRequired(fields: Record<string, unknown>, names: string[]): string | null {
  for (const name of names) {
    if (fields[name] === undefined || fields[name] === null || fields[name] === '') {
      return `${name} is required.`;
    }
  }
  return null;
}

export function validateNumericRange(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'number') return false;
  return value >= min && value <= max;
}
