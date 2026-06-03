export type EntryType = 'income' | 'expenditure';

export type IncomeCategory =
  | 'daily_fees' 
  | 'book' 
  | 'receipt' 
  | 'other';

export type ExpenditureCategory =
  | 'salary' 
  | 'vehicle_rent' 
  | 'kseb_bill' 
  | 'gas' 
  | 'internet'
  | 'stationary' 
  | 'staff_ta' 
  | 'training' 
  | 'medical' 
  | 'building_rent'
  | 'kuri' 
  | 'trophy' 
  | 'annual_day' 
  | 'iame' 
  | 'other';

export interface AccountEntry {
  id: string;
  created_at: string;
  updated_at: string;
  type: EntryType;
  date: string;
  amount: number;
  bill_voucher_no?: string | null;
  notes?: string | null;

  // Income-specific fields
  income_category?: IncomeCategory | null;
  book_no?: string | null;
  receipt_no?: string | null;

  // Fee linkage
  student_id?: number | null;
  fee_type?: string | null;
  

  // Expenditure-specific fields
  expenditure_category?: ExpenditureCategory | null;
  staff_name?: string | null;
  vehicle_no?: string | null;

  is_deleted: boolean;
}

export type NewEntry = Omit<AccountEntry, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>;

export interface MonthlySummary {
  month: string;
  total_income: number;
  total_expenditure: number;
  balance: number;
}

export interface CategorySummary {
  type: EntryType;
  category: string;
  entry_count: number;
  total_amount: number;
  first_entry: string;
  last_entry: string;
}