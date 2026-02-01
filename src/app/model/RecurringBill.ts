import { AuditFields } from './AuditFields';

export type BillFrequency = 
| 'weekly'
| 'biweekly'
| 'monthly';

export interface RecurringBill extends AuditFields {
    id: string;
    userId: string;
    categoryId: string;
    name: string;
    amount: number;
    frequency: BillFrequency;
    startDate: string;
    nextDueDate: string;
    active: boolean;
}