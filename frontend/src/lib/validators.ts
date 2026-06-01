// Shared form validators. Each returns null when valid, or a user-facing
// error message string when invalid. Keep messages short and actionable.

const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOUSE_RE = /^[A-Za-z0-9][A-Za-z0-9 \-/]*$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

export function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

export function validateName(name: string): string | null {
  const v = name.trim();
  if (!v) return "Please enter your full name.";
  if (v.length < 2) return "Name must be at least 2 characters.";
  if (v.length > 60) return "Name is too long.";
  if (!NAME_RE.test(v)) return "Use letters, spaces, dots, hyphens, or apostrophes only.";
  return null;
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Please enter your email address.";
  if (v.length > 120) return "Email is too long.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address (e.g. you@example.com).";
  return null;
}

export function validateMobile(mobile: string): string | null {
  const v = mobile.trim();
  if (!v) return "Please enter your mobile number.";
  const digits = digitsOnly(v);
  if (digits.length !== 10) return "Mobile number must be exactly 10 digits.";
  if (!INDIAN_MOBILE_RE.test(digits)) return "Mobile number must start with 6, 7, 8, or 9.";
  return null;
}

export function validateHouse(house: string): string | null {
  const v = house.trim();
  if (!v) return "Please enter your house or villa number.";
  if (v.length < 2) return "House number must be at least 2 characters.";
  if (v.length > 12) return "House number is too long.";
  if (!HOUSE_RE.test(v)) return "Use letters, digits, spaces, dashes, or slashes only.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Please enter a password.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 64) return "Password is too long (max 64 characters).";
  if (/\s/.test(password)) return "Password cannot contain spaces.";
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Please re-enter your password.";
  if (password !== confirm) return "Passwords don't match.";
  return null;
}

// For sign-in / forgot-password: identifier must look like an email OR a 10-digit mobile.
export function validateLoginIdentifier(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your email or mobile number.";
  if (v.includes("@")) {
    if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
    return null;
  }
  const digits = digitsOnly(v);
  if (digits.length !== 10) return "Enter a valid email or a 10-digit mobile number.";
  if (!INDIAN_MOBILE_RE.test(digits)) return "Mobile number must start with 6, 7, 8, or 9.";
  return null;
}
