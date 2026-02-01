// app/service/TransactionService.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction } from '../model/Transaction';
import { TRANSACTIONS_MOCK } from '../data/mock-transactions';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly transactionsSubject = new BehaviorSubject<Transaction[]>(
    [...TRANSACTIONS_MOCK]
  );

  /** Observable stream for components to subscribe to */
  transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  /** Snapshot getter (sometimes handy) */
  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  addTransaction(tx: Transaction): void {
    const next = [tx, ...this.transactionsSubject.value];
    this.transactionsSubject.next(next);
  }

  deleteTransaction(id: string): void {
    const next = this.transactionsSubject.value.filter(t => t.id !== id);
    this.transactionsSubject.next(next);
  }
}
