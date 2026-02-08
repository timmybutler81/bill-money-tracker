import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  registerables,
} from 'chart.js';

import { Transaction } from '../../model/Transaction';
import { Category } from '../../model/Category';
import { RecurringBill } from '../../model/RecurringBill';

import { TransactionService } from '../../service/TransactionService';
import { RecurringBillService } from '../../service/RecurringBillService';
import { CategoryService } from '../../service/CategoryService';

type CashflowRow = { date: string; income: number; expense: number; net: number };
type CategorySpendRow = { categoryId: string; categoryName: string; amount: number };

// Required for Chart.js v3/v4
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
})
export class Dashboard implements OnInit {
  @ViewChild('spendChart') spendChart?: BaseChartDirective;
  @ViewChild('cashflowChart') cashflowChart?: BaseChartDirective;

  categories: Category[] = [];
  transactions: Transaction[] = [];
  recurringBills: RecurringBill[] = [];

  // KPI pills
  incomeTotal = 0;
  expenseTotal = 0;
  netBalance = 0;
  upcomingBillsTotal = 0;

  // Source report data
  topSpendingCategories: CategorySpendRow[] = [];
  cashflowLast14Days: CashflowRow[] = [];

  // Recent Transactions preview
  recentTransactions: Transaction[] = [];

  // Charts
  spendChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }],
  };

  spendChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true },
    },
  };

  cashflowChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Net' }],
  };

  cashflowChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { autoSkip: true, maxRotation: 0 }, grid: { display: false } },
      y: { beginAtZero: true },
    },
    elements: {
      point: { radius: 2 },
      line: { tension: 0.25 },
    },
  };

  constructor(
    private txService: TransactionService,
    private billService: RecurringBillService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Categories (source of truth)
    this.categories = this.categoryService.getSnapshot();
    this.categoryService.categories$.subscribe((cats) => {
      this.categories = cats;
      this.recompute();
    });

    // Initial render
    this.transactions = this.sortTransactions(this.txService.getTransactions());
    this.recentTransactions = this.transactions.slice(0, 10);
    this.recurringBills = this.billService.getSnapshot();
    this.recompute();

    // Live updates
    this.txService.transactions$.subscribe((rows) => {
      this.transactions = this.sortTransactions(rows);
      this.recentTransactions = this.transactions.slice(0, 10);
      this.recompute();
    });

    this.billService.recurringBills$.subscribe((bills) => {
      this.recurringBills = bills;
      this.recompute();
    });
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

  categoryName(categoryId: string): string {
    return this.categories.find((c) => c.id === categoryId)?.name ?? 'Unknown';
  }

  formatMoney(n: number): string {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  private recompute(): void {
    const isIncome = (categoryId: string): boolean => {
      const cat = this.categories.find((c) => c.id === categoryId);
      return cat?.typeId === 'ct_income';
    };

    // Include recurring instances by default (matches “what happened”)
    const baseTx = this.transactions;

    this.incomeTotal = baseTx
      .filter((t) => isIncome(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    this.expenseTotal = baseTx
      .filter((t) => !isIncome(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    this.netBalance = this.incomeTotal - this.expenseTotal;

    this.upcomingBillsTotal = this.computeUpcomingBillsTotal(30);

    this.topSpendingCategories = this.computeTopSpendingCategories(5, isIncome, baseTx);

    this.cashflowLast14Days = this.computeCashflow(14, isIncome, baseTx);

    this.buildCharts();
  }

  private buildCharts(): void {
    // Donut: top spending categories
    this.spendChartData = {
      labels: this.topSpendingCategories.map((x) => x.categoryName),
      datasets: [{ data: this.topSpendingCategories.map((x) => x.amount) }],
    };

    // Line: net cashflow, chronological left->right
    const chronological = [...this.cashflowLast14Days].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    this.cashflowChartData = {
      labels: chronological.map((x) => x.date),
      datasets: [{ data: chronological.map((x) => x.net), label: 'Net' }],
    };

    // Force repaint (helps when only labels change)
    queueMicrotask(() => {
      this.spendChart?.update();
      this.cashflowChart?.update();
    });
  }

  private computeUpcomingBillsTotal(daysAhead: number): number {
    const now = this.startOfDay(new Date());
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return this.recurringBills
      .filter((b) => b.active)
      .filter((b) => {
        const due = this.parseIsoDay(b.nextDueDate);
        return due >= now && due <= cutoff;
      })
      .reduce((sum, b) => sum + b.amount, 0);
  }

  private computeTopSpendingCategories(
    topN: number,
    isIncome: (categoryId: string) => boolean,
    txs: Transaction[]
  ): CategorySpendRow[] {
    const totals = new Map<string, number>();

    for (const t of txs) {
      if (isIncome(t.categoryId)) continue;
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }

    return [...totals.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: this.categoryName(categoryId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
  }

  private computeCashflow(
    daysBack: number,
    isIncome: (categoryId: string) => boolean,
    txs: Transaction[]
  ): CashflowRow[] {
    const today = this.startOfDay(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - (daysBack - 1));

    const buckets = new Map<string, CashflowRow>();
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = this.isoDay(d);
      buckets.set(iso, { date: iso, income: 0, expense: 0, net: 0 });
    }

    for (const t of txs) {
      const row = buckets.get(t.date);
      if (!row) continue;

      if (isIncome(t.categoryId)) row.income += t.amount;
      else row.expense += t.amount;

      row.net = row.income - row.expense;
    }

    // newest-first (we re-sort for the chart)
    return [...buckets.values()].sort((a, b) => b.date.localeCompare(a.date));
  }

  private parseIsoDay(iso: string): Date {
    return this.startOfDay(new Date(`${iso}T00:00:00`));
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private isoDay(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
