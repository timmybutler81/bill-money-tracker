import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { RecurringBill } from '../model/RecurringBill';
import { RECURRING_BILLS_MOCK } from '../data/mock-recurring-bills';

@Injectable({ providedIn: 'root' })
export class RecurringBillService {
    private readonly billsSubject = new BehaviorSubject<RecurringBill[]>(...[RECURRING_BILLS_MOCK]);

    recurringBills$: Observable<RecurringBill[]> = this.billsSubject.asObservable();

    getSnapshot(): RecurringBill[] {
       return this.billsSubject.value;
    }

    add(bill: RecurringBill): void {
        const next = [bill, ...this.billsSubject.value];
        this.billsSubject.next(next);
    }

    delete(id: string): void {
        const next = this.billsSubject.value.filter(b => b.id !== id);
        this.billsSubject.next(next);
    }
}
