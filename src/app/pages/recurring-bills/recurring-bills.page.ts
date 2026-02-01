import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { BillFrequency, RecurringBill } from '../../model/RecurringBill';
import { Category } from '../../model/Category';
import { RecurringBillService } from '../../service/RecurringBillService';
import { CATEGORIES_MOCK } from '../../data/mock-categories';
import { MatExpansionModule } from '@angular/material/expansion';

type BillFrequencyOption = { value: RecurringBill['frequency']; label: string };

@Component({
  selector: 'app-recurring-bills-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
  ],
  templateUrl: './recurring-bills.page.html',
  styleUrls: ['./recurring-bills.page.css'],
})
export class RecurringBillsPage implements OnInit {

  bills: RecurringBill[] = [];
  categories: Category[] = CATEGORIES_MOCK;

  private readonly userId = 'TODO_FROM_AUTH';

  billFrequency: BillFrequencyOption[] = [
    { value: 'weekly', label: 'Weekly'},
    { value: 'biweekly', label: "Bi-Weekly"},
    { value: 'monthly', label: 'Monthly'}
  ];

  form = {
    name: '',
    amount: null as number | null,
    frequency: 'monthly' as BillFrequency,
    startDate: '',
    nextDueDate: '',
    active: false,
    categoryId: this.categories[0]?.id ?? '',
  }

  constructor(
    private billService: RecurringBillService
  ) {}

  ngOnInit(): void {
    this.billService.recurringBills$.subscribe((rows) => {
      this.bills = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  
      });
    }

  add(): void {
    if (!this.form.name.trim()) return this.toast('Name is required.');
    if (!this.form.amount) return this.toast('Amount is required.');
    if (!this.form.frequency) return this.toast('Frequency is required');
    if (!this.form.startDate) return this.toast('Start Date is required.');
    if (!this.form.nextDueDate) return this.toast('Next Due Date is required.');
    if (!this.form.categoryId) return this.toast('Category type is required.');
    
    const newRecurringBill: RecurringBill = {
      id: this.newId(),
      userId: this.userId,
      name: this.form.name.trim(),
      amount: this.form.amount,
      frequency: this.form.frequency,
      startDate: this.form.startDate,
      nextDueDate: this.form.nextDueDate,
      active: this.form.active,
      categoryId: this.form.categoryId,
      createdAt: new Date().toISOString(),
      createdBy: this.userId,
    };

    this.billService.add(newRecurringBill);

    this.form.name = '';
    this.form.amount = null;
    this.form.frequency = 'monthly' as BillFrequency;
    this.form.startDate = this.todayIso();
    this.form.nextDueDate = this.todayIso();
    this.form.active = false;
    this.form.categoryId = this.categories[0]?.id ?? '';

  }

  delete(id: string): void {
    this.billService.delete(id);
  }

  categoryName(categoryId: string): string {
    return this.categories.find(t => t.id === categoryId)?.name ?? 'Unknown';
  }

  trackById(_: number, bill: RecurringBill): string {
    return bill.id;
  }

  private newId(): string {
    return `rb_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  monthlyTotal(): number {
  return this.bills.reduce((sum, b) => sum + b.amount, 0);
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
