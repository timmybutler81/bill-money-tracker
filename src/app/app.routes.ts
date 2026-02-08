import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard.page';
import { TransactionPage } from './pages/transactions/transactions.page';
import { CategoriesPage } from './pages/categories/categories.page';
import { RecurringBillsPage } from './pages/recurring-bills/recurring-bills.page';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: Shell,
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'transactions', component: TransactionPage },
      { path: 'categories', component: CategoriesPage },
      { path: 'recurring-bills', component: RecurringBillsPage },
      { path: 'reports', component: Reports },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: '' },
];

export class AppRoutingModule {}
