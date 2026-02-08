import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

import { Transaction } from '../../model/Transaction';
import { Category } from '../../model/Category';
import { CategoryService } from '../../service/CategoryService';
import { TransactionService } from '../../service/TransactionService';

type PaymentMethodOption = { value: Transaction['paymentMethod']; label: string };

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatExpansionModule,
  ],
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.css'],
})
export class TransactionPage implements OnInit {
  transactions: Transaction[] = [];
  categories: Category[] = [];
  filteredTransactions: Transaction[] = [];

  incomeTotal = 0;
  expenseTotal = 0;
  netBalance = 0;

  filters = {
    startDate: '' as string,
    endDate: '' as string,
    categoryId: '' as string,
    search: '' as string,
  };

  paymentMethods: PaymentMethodOption[] = [
    { value: 'debit', label: 'Debit' },
    { value: 'credit', label: 'Credit' },
    { value: 'cash', label: 'Cash' },
  ];

  private readonly userId = 'TODO_FROM_AUTH';

  form = {
    date: this.todayIso(),
    amount: null as number | null,
    categoryId: '',
    paymentMethod: 'debit' as Transaction['paymentMethod'],
    isRecurringInstance: false,
    description: '',
  };

  constructor(
    private txService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.categories = this.categoryService.getSnapshot();
    this.ensureDefaultCategorySelected();

    this.categoryService.categories$.subscribe((cats) => {
      this.categories = cats;
      this.ensureDefaultCategorySelected();
      this.applyFiltersAndRecompute();
    });

    this.transactions = this.sortTransactions(this.normalizeDates(this.txService.getTransactions()));
    this.applyFiltersAndRecompute();

    this.txService.transactions$.subscribe((rows) => {
      this.transactions = this.sortTransactions(this.normalizeDates(rows));
      this.applyFiltersAndRecompute();
    });
  }

  onFiltersChanged(): void {
    this.applyFiltersAndRecompute();
  }

  clearFilters(): void {
    this.filters = { startDate: '', endDate: '', categoryId: '', search: '' };
    this.applyFiltersAndRecompute();
  }

  add(): void {
    if (!this.form.date) return this.toast('Date is required.');
    if (this.form.amount === null || Number(this.form.amount) <= 0) {
      return this.toast('Amount must be greater than 0.');
    }
    if (!this.form.categoryId) return this.toast('Category is required.');
    if (!this.form.paymentMethod) return this.toast('Payment method is required.');

    const tx: Transaction = {
      id: this.newId(),
      userId: this.userId,
      categoryId: this.form.categoryId,
      amount: Number(this.form.amount),
      date: this.form.date, // ISO YYYY-MM-DD
      description: this.form.description?.trim() || undefined,
      paymentMethod: this.form.paymentMethod,
      isRecurringInstance: this.form.isRecurringInstance,
      createdAt: new Date().toISOString(),
      createdBy: this.userId,
    };

    this.txService.addTransaction(tx);

    this.form.amount = null;
    this.form.description = '';
    this.form.isRecurringInstance = false;
  }

  delete(id: string): void {
    this.txService.deleteTransaction(id);
  }

  categoryName(categoryId: string): string {
    return this.categories.find((c) => c.id === categoryId)?.name ?? 'Unknown';
  }

  trackById(_: number, t: Transaction): string {
    return t.id;
  }

  total(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  formatMoney(n: number): string {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  private applyFiltersAndRecompute(): void {
    const start = this.filters.startDate?.trim() || '';
    const end = this.filters.endDate?.trim() || '';
    const categoryId = this.filters.categoryId?.trim() || '';
    const q = (this.filters.search ?? '').trim().toLowerCase();

    this.filteredTransactions = this.transactions.filter((t) => {
      if (start && t.date < start) return false;
      if (end && t.date > end) return false;

      if (categoryId && t.categoryId !== categoryId) return false;

      if (q) {
        const desc = (t.description ?? '').toLowerCase();
        const cat = this.categoryName(t.categoryId).toLowerCase();
        if (!desc.includes(q) && !cat.includes(q)) return false;
      }

      return true;
    });

    this.recomputePills();
  }

  private recomputePills(): void {
    const isIncome = (categoryId: string): boolean => {
      const cat = this.categories.find((c) => c.id === categoryId);
      return cat?.typeId === 'ct_income';
    };

    const base = this.filteredTransactions;

    this.incomeTotal = base
      .filter((t) => isIncome(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    this.expenseTotal = base
      .filter((t) => !isIncome(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    this.netBalance = this.incomeTotal - this.expenseTotal;
  }

  private normalizeDates(rows: Transaction[]): Transaction[] {
    return rows.map((t) => {
      const iso = this.toIsoDay(t.date);
      return iso ? { ...t, date: iso } : t;
    });
  }

  private toIsoDay(value: string): string {
    const v = (value ?? '').trim();
    if (!v) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    let m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const mm = m[1], dd = m[2], yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    m = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const mm = m[1], dd = m[2], yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    return '';
  }

  private sortTransactions(rows: Transaction[]): Transaction[] {
    return [...rows].sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;

      const ac = a.createdAt ?? '';
      const bc = b.createdAt ?? '';
      return bc.localeCompare(ac);
    });
  }

  private ensureDefaultCategorySelected(): void {
    if (!this.form.categoryId || !this.categories.some(c => c.id === this.form.categoryId)) {
      this.form.categoryId = this.categories[0]?.id ?? '';
    }
  }

  private newId(): string {
    return `tx_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  private todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toast(msg: string): void {
    alert(msg);
  }
}
