import { api } from "./api";
import type { Expense, ExpenseTotals } from "./types";

export type ExpenseInput = {
  spent_on: string;
  category: string;
  description: string;
  amount: number;
};

export function fetchExpenses(): Promise<Expense[]> {
  return api.get<Expense[]>("/api/expenses");
}

export function fetchExpenseTotals(): Promise<ExpenseTotals> {
  return api.get<ExpenseTotals>("/api/expenses/totals");
}

export function fetchExpenseCategories(): Promise<string[]> {
  return api.get<string[]>("/api/expenses/categories");
}

export function addExpense(input: ExpenseInput): Promise<Expense> {
  return api.post<Expense>("/api/expenses", input);
}

export function deleteExpense(id: number): Promise<void> {
  return api.delete<void>(`/api/expenses/${id}`);
}
