export type Expense = {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
};

const STORAGE_KEY = "cm.expenses.v1";

const SEED_EXPENSES: Expense[] = [
  { id: 1, date: "2026-05-20", category: "Security", description: "Guard agency — May", amount: 12000 },
  { id: 2, date: "2026-05-15", category: "Electricity", description: "Common area + lift power", amount: 6500 },
  { id: 3, date: "2026-05-10", category: "Housekeeping", description: "Monthly housekeeping staff", amount: 8000 },
  { id: 4, date: "2026-04-28", category: "Plumbing", description: "B-wing leak repair", amount: 3200 },
  { id: 5, date: "2026-03-30", category: "Gardening", description: "Garden upkeep", amount: 2500 },
];

export const EXPENSE_CATEGORIES = [
  "Security",
  "Electricity",
  "Housekeeping",
  "Plumbing",
  "Gardening",
  "Repairs",
  "Water",
  "Other",
];

function read(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EXPENSES));
      return [...SEED_EXPENSES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Expense[]) : [...SEED_EXPENSES];
  } catch {
    return [...SEED_EXPENSES];
  }
}

function write(rows: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function getExpenses(): Expense[] {
  return read();
}

export function addExpense(input: {
  date: string;
  category: string;
  description: string;
  amount: number;
}): Expense {
  const rows = read();
  const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const entry: Expense = {
    id: nextId,
    date: input.date,
    category: input.category.trim(),
    description: input.description.trim(),
    amount: input.amount,
  };
  const next = [entry, ...rows];
  write(next);
  return entry;
}

export function deleteExpense(id: number): boolean {
  const rows = read();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  write(next);
  return true;
}

export function totalExpenses(rows?: Expense[]): number {
  return (rows ?? read()).reduce((sum, r) => sum + r.amount, 0);
}

export function expensesByCategory(rows?: Expense[]): Record<string, number> {
  const data = rows ?? read();
  const map: Record<string, number> = {};
  for (const r of data) {
    map[r.category] = (map[r.category] || 0) + r.amount;
  }
  return map;
}
