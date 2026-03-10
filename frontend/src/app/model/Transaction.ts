import { AuditFields } from './AuditFields';

export type PaymentMethod = 
| 'cash'
| 'debit'
| 'credit';

export interface Transaction extends AuditFields {
    id: string;
    userId: string;
    categoryId: string;
    amount: number;
    date: string;
    description?: string;
    isRecurringInstance: boolean
    paymentMethod: PaymentMethod;
}