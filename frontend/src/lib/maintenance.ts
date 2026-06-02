import { api } from "./api";
import type {
  BillDetail,
  FiscalYear,
  MaintenanceLedger,
  PaymentMethod,
} from "./types";

export type RecordPaymentInput = {
  bill_id: number;
  amount: number;
  paid_on: string; // ISO date
  method?: PaymentMethod;
  reference?: string | null;
  note?: string | null;
};

export function fetchLedger(fyStartYear?: number): Promise<MaintenanceLedger> {
  const qs = fyStartYear ? `?fy_start_year=${fyStartYear}` : "";
  return api.get<MaintenanceLedger>(`/api/maintenance/ledger${qs}`);
}

export function fetchFiscalYears(): Promise<FiscalYear[]> {
  return api.get<FiscalYear[]>("/api/maintenance/fiscal-years");
}

export function fetchBillDetail(billId: number): Promise<BillDetail> {
  return api.get<BillDetail>(`/api/maintenance/bills/${billId}`);
}

export function recordPayment(input: RecordPaymentInput): Promise<BillDetail> {
  return api.post<BillDetail>("/api/maintenance/payments", {
    ...input,
    method: input.method ?? "bank",
  });
}

export type AssignMaintenanceInput = {
  bill_ids: number[];
  amount: number;
  from_date: string; // ISO date
  to_date: string;
};

export type AssignMaintenanceResult = {
  updated_count: number;
  fiscal_year: FiscalYear;
  rows: MaintenanceLedger["rows"];
  totals: MaintenanceLedger["totals"];
};

export function assignMaintenance(
  input: AssignMaintenanceInput
): Promise<AssignMaintenanceResult> {
  return api.post<AssignMaintenanceResult>("/api/maintenance/assign", input);
}
