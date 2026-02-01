import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

import { Transaction } from '../../model/Transaction';
import { Category } from '../../model/Category';
import { TransactionService } from '../../service/TransactionService';
import { CATEGORIES_MOCK } from '../../data/mock-categories';

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
  ],
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.css'],
})
export class TransactionPage implements OnInit {
  transactions: Transaction[] = [];
  categories: Category[] = CATEGORIES_MOCK;

  paymentMethods: PaymentMethodOption[] = [
    { value: 'debit', label: 'Debit' },
    { value: 'credit', label: 'Credit' },
    { value: 'cash', label: 'Cash' },
  ];

  private readonly userId = 'TODO_FROM_AUTH';

  form = {
    date: this.todayIso(),
    amount: null as number | null,
    categoryId: this.categories[0]?.id ?? '',
    paymentMethod: 'debit' as Transaction['paymentMethod'],
    isRecurringInstance: false,
    description: '',
  };

  constructor(private txService: TransactionService) {}

  ngOnInit(): void {
    this.txService.transactions$.subscribe((rows) => {
      this.transactions = [...rows].sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;

        const ac = a.createdAt ?? '';
        const bc = b.createdAt ?? '';
        return bc.localeCompare(ac);
      });
    });
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
      date: this.form.date,
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
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
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
