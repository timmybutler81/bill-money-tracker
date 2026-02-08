import { Transaction } from '../model/Transaction';
import { MOCK_USER_ID } from './mock-context';

export const TRANSACTIONS_MOCK: Transaction[] = [
  {
    id: 'tx_1001',
    userId: MOCK_USER_ID,
    categoryId: 'cat_groceries',
    amount: 42.17,
    date: '2026-01-01',
    description: 'Grocery run',
    paymentMethod: 'debit',
    isRecurringInstance: false,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: 'tx_1002',
    userId: MOCK_USER_ID,
    categoryId: 'cat_gas',
    amount: 18.5,
    date: '2026-02-01',
    description: 'Fill up',
    paymentMethod: 'credit',
    isRecurringInstance: false,
    createdAt: '2026-02-01T14:00:00Z',
  },
  {
    id: 'tx_1003',
    userId: MOCK_USER_ID,
    categoryId: 'cat_paycheck',
    amount: 1250.0,
    date: '2026-01-30',
    description: 'Direct deposit',
    paymentMethod: 'cash',
    isRecurringInstance: false,
    createdAt: '2026-01-30T09:00:00Z',
  },
  {
    id: 'tx_1004',
    userId: MOCK_USER_ID,
    categoryId: 'cat_rent',
    amount: 2100.0,
    date: '2026-01-28',
    description: 'Monthly rent',
    paymentMethod: 'cash',
    isRecurringInstance: true,
    createdAt: '2026-01-28T08:00:00Z',
  },
];
