export type UserRole =
  | "treasurer"
  | "president"
  | "secretary"
  | "community_member";

export type UserStatus = "pending" | "active" | "rejected" | "disabled";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  house: string | null;
  plot_no: string | null;
  role: UserRole;
  status: UserStatus;
  is_seed: boolean;
  created_at: string;
  approved_at: string | null;
};

export type FiscalYear = {
  id: number;
  label: string;
  start_year: number;
  start_date: string;
  end_date: string;
};

export type PaymentMethod = "cash" | "bank" | "upi" | "cheque" | "other";

export type Payment = {
  id: number;
  amount: string; // Decimal serialised as string
  paid_on: string;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  recorded_by_name: string | null;
  created_at: string;
};

export type MaintenanceBillRow = {
  bill_id: number;
  member_id: number;
  member_name: string;
  plot_no: string;
  house: string | null;
  mobile: string;
  fiscal_year_id: number;
  fiscal_year_label: string;
  payable_amount: string;
  received_amount: string;
  closing_balance: string;
  status: "Cleared" | "Pending";
  last_payment_on: string | null;
  last_payment_amount: string | null;
};

export type LedgerTotals = {
  total_payable: string;
  total_received: string;
  total_closing: string;
  cleared_count: number;
  pending_count: number;
  member_count: number;
};

export type MaintenanceLedger = {
  fiscal_year: FiscalYear;
  rows: MaintenanceBillRow[];
  totals: LedgerTotals;
};

export type BillDetail = {
  bill: MaintenanceBillRow;
  payments: Payment[];
};

export type Expense = {
  id: number;
  spent_on: string;
  category: string;
  description: string;
  amount: string;
  created_by_name: string | null;
  created_at: string;
};

export type ExpenseTotals = {
  total: string;
  by_category: Record<string, string>;
  count: number;
};

export type AuditLogEntry = {
  id: number;
  actor_id: number | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  summary: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "treasurer":
      return "Treasurer";
    case "president":
      return "President";
    case "secretary":
      return "Secretary";
    case "community_member":
      return "Community Member";
  }
}
