import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';

import { Transaction } from '../../model/Transaction';
import { RecurringBill } from '../../model/RecurringBill';
import { Category } from '../../model/Category';

import { TransactionService } from '../../service/TransactionService';
import { RecurringBillService } from '../../service/RecurringBillService';
import { CategoryService } from '../../service/CategoryService';

type SpendingRow = { categoryId: string; categoryName: string; amount: number };
type IncomeRow = { categoryId: string; categoryName: string; amount: number };

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,

    NgChartsModule,
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.css'],
})
export class ReportsPage implements OnInit {

  /**
   * Income classification:
   * - If categoryId is explicitly listed as income => income
   * - Else if category.typeId matches INCOME_TYPE_ID => income
   * Everything else => expense (including rent, even if recurring instance)
   */
  private readonly INCOME_TYPE_ID = 'income';
  private readonly INCOME_CATEGORY_IDS = new Set<string>(['cat_paycheck']);

  rangeForm: FormGroup;

  spendingCols = ['category', 'amount'];
  incomeCols = ['category', 'amount'];

  topSpendingCategories: SpendingRow[] = [];
  topIncomeCategories: IncomeRow[] = [];

  spendingTotal = 0;
  incomeTotal = 0;

  cashflowSummary = {
    actualIncome: 0,
    actualSpending: 0,
    projectedRecurring: 0,
    net: 0,
  };

  cashflowChartData: any;
  cashflowChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    }
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private recurringBillService: RecurringBillService,
    private categoryService: CategoryService,
  ) {
    this.rangeForm = this.fb.group({
      start: [null],
      end: [null],
    });
  }

  ngOnInit(): void {
    // Keep default current month
    this.setThisMonth();

    const transactions$ = this.transactionService.getAll$();
    const recurringBills$ = this.recurringBillService.getAll$();
    const categories$ = this.categoryService.getAll$();

    const range$ = this.rangeForm.valueChanges.pipe(
      startWith(this.rangeForm.value),
      map(v => ({
        start: v.start ? this.parseLocalDate(v.start) : null,
        end: v.end ? this.parseLocalDate(v.end) : null,
      }))
    );

    combineLatest([transactions$, recurringBills$, categories$, range$]).pipe(
      map(([txns, bills, cats, range]) => {
        if (!range.start || !range.end) return null;

        const categoryById = new Map<string, Category>((cats ?? []).map(c => [c.id, c]));

        // Date-only keys avoid timezone surprises with 'YYYY-MM-DD'
        const startKey = this.toDateKey(range.start);
        const endKey = this.toDateKey(range.end);

        const inRangeTxns = (txns ?? []).filter(t => {
          const key = this.toDateKey(t.date);
          return key >= startKey && key <= endKey;
        });

        const isIncomeTxn = (t: Transaction) => {
          if (this.INCOME_CATEGORY_IDS.has(t.categoryId)) return true;
          const cat = categoryById.get(t.categoryId);
          return cat?.typeId === this.INCOME_TYPE_ID;
        };

        /**
         * ✅ REQUIREMENT:
         * - rent should be included in expenses and cash flow (even if isRecurringInstance = true)
         * - but not income
         *
         * So: DO NOT filter out isRecurringInstance for spending.
         */
        const incomeTxns = inRangeTxns.filter(isIncomeTxn);
        const spendingTxns = inRangeTxns.filter(t => !isIncomeTxn(t));

        const actualIncome = incomeTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
        const actualSpending = spendingTxns.reduce((s, t) => s + Number(t.amount || 0), 0);

        // Top Spending Categories
        const spendByCat = this.sumByKey(spendingTxns, t => t.categoryId, t => Number(t.amount || 0));
        const topSpending = this.toSortedRows(spendByCat).map(r => ({
          categoryId: r.key,
          categoryName: categoryById.get(r.key)?.name ?? 'Unknown',
          amount: r.amount
        }));

        // Top Income
        const incomeByCat = this.sumByKey(incomeTxns, t => t.categoryId, t => Number(t.amount || 0));
        const topIncome = this.toSortedRows(incomeByCat).map(r => ({
          categoryId: r.key,
          categoryName: categoryById.get(r.key)?.name ?? 'Income',
          amount: r.amount
        }));

        /**
         * Cashflow projection:
         * We include projected recurring bills, BUT we must not double-count bills that already have a posted
         * transaction marked isRecurringInstance within the date range.
         */
        const projectedAll = this.projectRecurringBills(bills ?? [], range.start, range.end);

        const postedRecurringKeySet = new Set<string>(
          inRangeTxns
            .filter(t => t.isRecurringInstance)
            .map(t => `${t.categoryId}|${this.toDateKey(t.date)}`)
        );

        const projectedNoDups = projectedAll.filter(p => {
          const k = `${p.categoryId}|${this.toDateKey(p.date)}`;
          return !postedRecurringKeySet.has(k);
        });

        const projectedTotal = projectedNoDups.reduce((s, p) => s + p.amount, 0);

        const net = actualIncome - actualSpending - projectedTotal;

        const chart = this.buildCashflowChart(range.start, range.end, incomeTxns, spendingTxns, projectedNoDups);

        return {
          topSpending,
          topIncome,
          actualIncome,
          actualSpending,
          projectedTotal,
          net,
          chart
        };
      })
    ).subscribe(result => {
      if (!result) return;

      this.topSpendingCategories = result.topSpending.slice(0, 10);
      this.topIncomeCategories = result.topIncome.slice(0, 10);

      this.incomeTotal = result.actualIncome;
      this.spendingTotal = result.actualSpending;

      this.cashflowSummary = {
        actualIncome: result.actualIncome,
        actualSpending: result.actualSpending,
        projectedRecurring: result.projectedTotal,
        net: result.net
      };

      this.cashflowChartData = result.chart;
    });
  }

  setThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.rangeForm.patchValue({ start, end }, { emitEvent: true });
  }

  setLastMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    this.rangeForm.patchValue({ start, end }, { emitEvent: true });
  }

  // -------------------------
  // Date parsing (timezone-safe)
  // -------------------------

  private parseLocalDate(value: any): Date {
    // datepicker gives Date; keep it
    if (value instanceof Date) return value;

    // handle 'YYYY-MM-DD'
    if (typeof value === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const da = Number(m[3]);
        return new Date(y, mo, da);
      }
      return new Date(value);
    }

    // fallback
    return new Date(value);
  }

  private toDateKey(value: string | Date): number {
    const d = this.parseLocalDate(value);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // -------------------------
  // Aggregations
  // -------------------------

  private sumByKey<T>(
    items: T[],
    keyFn: (t: T) => string,
    valFn: (t: T) => number
  ): Record<string, number> {
    return items.reduce((acc, item) => {
      const k = keyFn(item);
      acc[k] = (acc[k] || 0) + valFn(item);
      return acc;
    }, {} as Record<string, number>);
  }

  private toSortedRows(mapObj: Record<string, number>): { key: string; amount: number }[] {
    const rows = Object.entries(mapObj).map(([key, amount]) => ({ key, amount }));
    rows.sort((a, b) => b.amount - a.amount);
    return rows;
  }

  // -------------------------
  // Recurring bills projection
  // -------------------------

  private projectRecurringBills(bills: RecurringBill[], start: Date, end: Date) {
    const out: { billId: string; name: string; date: Date; amount: number; categoryId: string }[] = [];

    const startKey = this.toDateKey(start);
    const endKey = this.toDateKey(end);

    for (const bill of bills) {
      if (!bill.active) continue;

      // Use local parsing for nextDueDate too
      let due = this.parseLocalDate(bill.nextDueDate);

      // Advance until within range
      while (this.toDateKey(due) < startKey) due = this.addFrequency(due, bill.frequency);

      // Add all occurrences within range
      while (this.toDateKey(due) <= endKey) {
        out.push({
          billId: bill.id,
          name: bill.name,
          date: new Date(due),
          amount: Number(bill.amount || 0),
          categoryId: bill.categoryId
        });

        due = this.addFrequency(due, bill.frequency);
      }
    }

    return out;
  }

  private addFrequency(date: Date, freq: RecurringBill['frequency']): Date {
    const d = new Date(date);
    switch (freq) {
      case 'weekly':
        d.setDate(d.getDate() + 7);
        return d;
      case 'biweekly':
        d.setDate(d.getDate() + 14);
        return d;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        return d;
      default:
        return d;
    }
  }

  // -------------------------
  // Chart
  // -------------------------

  private buildCashflowChart(
    start: Date,
    end: Date,
    incomeTxns: Transaction[],
    spendingTxns: Transaction[],
    projectedBills: { date: Date; amount: number }[]
  ) {
    const labels: string[] = [];
    const dayKeys: number[] = [];

    // Build inclusive list of date keys
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= endLocal) {
      labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
      dayKeys.push(this.toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const incomeDaily = new Array(dayKeys.length).fill(0);
    const spendDaily = new Array(dayKeys.length).fill(0);
    const recurringDaily = new Array(dayKeys.length).fill(0);

    const indexByKey = new Map<number, number>();
    dayKeys.forEach((k, i) => indexByKey.set(k, i));

    for (const t of incomeTxns) {
      const idx = indexByKey.get(this.toDateKey(t.date));
      if (idx !== undefined) incomeDaily[idx] += Number(t.amount || 0);
    }

    for (const t of spendingTxns) {
      const idx = indexByKey.get(this.toDateKey(t.date));
      if (idx !== undefined) spendDaily[idx] += Number(t.amount || 0);
    }

    for (const b of projectedBills) {
      const idx = indexByKey.get(this.toDateKey(b.date));
      if (idx !== undefined) recurringDaily[idx] += Number(b.amount || 0);
    }

    const netDaily = dayKeys.map((_, i) => incomeDaily[i] - spendDaily[i] - recurringDaily[i]);

    return {
      labels,
      datasets: [
        { label: 'Income (Actual)', data: incomeDaily, tension: 0.2 },
        { label: 'Spending (Actual)', data: spendDaily, tension: 0.2 },
        { label: 'Recurring Bills (Projected)', data: recurringDaily, tension: 0.2 },
        { label: 'Net', data: netDaily, tension: 0.2 }
      ]
    };
  }
}
