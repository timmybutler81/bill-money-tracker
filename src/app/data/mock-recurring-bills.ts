import { RecurringBill } from '../model/RecurringBill';
import { MOCK_USER_ID } from './mock-context';

export const RECURRING_BILLS_MOCK: RecurringBill[] = [
  {
    id: 'rb_2001',
    userId: MOCK_USER_ID,
    categoryId: 'cat_utilities',
    name: 'Electric',
    amount: 160.0,
    frequency: 'monthly',
    startDate: '2025-12-01',
    nextDueDate: '2026-02-10',
    active: true,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'rb_2002',
    userId: MOCK_USER_ID,
    categoryId: 'cat_rent',
    name: 'Rent',
    amount: 2100.0,
    frequency: 'monthly',
    startDate: '2025-01-01',
    nextDueDate: '2026-02-01',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];
