import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Transactions } from './pages/transactions/transactions';
import { Categories } from './pages/categories/categories';
import { RecurringBills } from './pages/recurring-bills/recurring-bills';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: Shell,
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'transactions', component: Transactions },
      { path: 'categories', component: Categories },
      { path: 'recurring-bills', component: RecurringBills },
      { path: 'reports', component: Reports },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: '' },
];

export class AppRoutingModule {}
