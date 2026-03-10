import { Category } from '../model/Category';
import { MOCK_USER_ID } from './mock-context';

export const CATEGORIES_MOCK: Category[] = [
  { id: 'cat_groceries', userId: MOCK_USER_ID, name: 'Groceries', alias: 'food', typeId: 'ct_expense' },
  { id: 'cat_dining', userId: MOCK_USER_ID, name: 'Dining', alias: 'restaurants', typeId: 'ct_expense' },
  { id: 'cat_gas', userId: MOCK_USER_ID, name: 'Gas', alias: 'fuel', typeId: 'ct_expense' },
  { id: 'cat_rent', userId: MOCK_USER_ID, name: 'Rent', alias: 'housing', typeId: 'ct_expense' },
  { id: 'cat_utilities', userId: MOCK_USER_ID, name: 'Utilities', alias: 'bills', typeId: 'ct_expense' },
  { id: 'cat_paycheck', userId: MOCK_USER_ID, name: 'Paycheck', alias: 'salary', typeId: 'ct_income' },
];
