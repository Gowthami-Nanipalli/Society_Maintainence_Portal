export type Account = {
  name: string;
  email: string;
  mobile: string;
  house: string;
  role: string;
  password: string;
  amountDue: number;
  lastPaidAmount: number;
  lastPaidOn: string | null;
};

const STORAGE_KEY = "cm.accounts.v2";

const DEFAULT_CYCLE_AMOUNT = 3000;

const SEED_ACCOUNTS: Account[] = [
  {
    name: "R. Sharma",
    email: "sharma@cardmaster.in",
    mobile: "9876543210",
    house: "A-101",
    role: "Community Member",
    password: "demo123",
    amountDue: 3000,
    lastPaidAmount: 3000,
    lastPaidOn: "2026-04-04",
  },
  {
    name: "S. Reddy",
    email: "reddy@cardmaster.in",
    mobile: "9876543211",
    house: "B-204",
    role: "Secretary",
    password: "demo123",
    amountDue: 1500,
    lastPaidAmount: 1500,
    lastPaidOn: "2026-05-12",
  },
  {
    name: "A. Khan",
    email: "khan@cardmaster.in",
    mobile: "9876543212",
    house: "C-310",
    role: "Community Member",
    password: "demo123",
    amountDue: 3000,
    lastPaidAmount: 0,
    lastPaidOn: null,
  },
  {
    name: "P. Mehta",
    email: "mehta@cardmaster.in",
    mobile: "9876543213",
    house: "D-012",
    role: "President",
    password: "demo123",
    amountDue: 0,
    lastPaidAmount: 3000,
    lastPaidOn: "2026-05-02",
  },
  {
    name: "L. Iyer",
    email: "iyer@cardmaster.in",
    mobile: "9876543214",
    house: "A-105",
    role: "Community Member",
    password: "demo123",
    amountDue: 3000,
    lastPaidAmount: 0,
    lastPaidOn: null,
  },
  {
    name: "T. Nair",
    email: "treasurer@cardmaster.in",
    mobile: "9876543215",
    house: "B-118",
    role: "Treasurer",
    password: "demo123",
    amountDue: 0,
    lastPaidAmount: 3000,
    lastPaidOn: "2026-05-08",
  },
];

function normalizeMobile(v: string) {
  return v.replace(/\D/g, "").slice(-10);
}

function read(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing: Account[] = Array.isArray(parsed) ? (parsed as Account[]) : [];

    const emails = new Set(existing.map((a) => a.email.toLowerCase()));
    const missingSeeds = SEED_ACCOUNTS.filter((s) => !emails.has(s.email.toLowerCase()));
    if (missingSeeds.length === 0) return existing;

    const merged = [...existing, ...missingSeeds];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return [...SEED_ACCOUNTS];
  }
}

function write(accounts: Account[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function getAccounts(): Account[] {
  return read();
}

export type AddAccountResult =
  | { ok: true; account: Account }
  | { ok: false; reason: "email-taken" | "mobile-taken" };

export function addAccount(input: {
  name: string;
  email: string;
  mobile: string;
  house: string;
  role: string;
  password: string;
}): AddAccountResult {
  const accounts = read();
  const email = input.email.trim().toLowerCase();
  const mobile = normalizeMobile(input.mobile);

  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, reason: "email-taken" };
  }
  if (accounts.some((a) => normalizeMobile(a.mobile) === mobile)) {
    return { ok: false, reason: "mobile-taken" };
  }

  const account: Account = {
    ...input,
    email,
    mobile,
    amountDue: DEFAULT_CYCLE_AMOUNT,
    lastPaidAmount: 0,
    lastPaidOn: null,
  };
  write([...accounts, account]);
  return { ok: true, account };
}

export function findAccount(identifier: string, password: string): Account | null {
  const accounts = read();
  const raw = identifier.trim().toLowerCase();
  const isEmail = raw.includes("@");
  const mobile = normalizeMobile(raw);

  return (
    accounts.find((a) => {
      if (a.password !== password) return false;
      if (isEmail) return a.email.toLowerCase() === raw;
      return normalizeMobile(a.mobile) === mobile;
    }) ?? null
  );
}

export type UpdateAccountResult =
  | { ok: true; account: Account }
  | { ok: false; reason: "not-found" | "mobile-taken" };

export function updateAccount(
  currentEmail: string,
  updates: { name: string; mobile: string; house: string }
): UpdateAccountResult {
  const accounts = read();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === currentEmail.toLowerCase()
  );
  if (idx === -1) return { ok: false, reason: "not-found" };

  const newMobile = normalizeMobile(updates.mobile);
  const conflict = accounts.some(
    (a, i) => i !== idx && normalizeMobile(a.mobile) === newMobile
  );
  if (conflict) return { ok: false, reason: "mobile-taken" };

  const updated: Account = {
    ...accounts[idx],
    name: updates.name.trim(),
    mobile: newMobile,
    house: updates.house.trim(),
  };
  const next = [...accounts];
  next[idx] = updated;
  write(next);
  return { ok: true, account: updated };
}

export function recordPayment(email: string, amount: number, paidOn: string): Account | null {
  const accounts = read();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return null;
  const target = accounts[idx];
  const newDue = Math.max(0, target.amountDue - amount);
  const updated: Account = {
    ...target,
    amountDue: newDue,
    lastPaidAmount: amount,
    lastPaidOn: paidOn,
  };
  const next = [...accounts];
  next[idx] = updated;
  write(next);
  return updated;
}
