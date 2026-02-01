import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { Category } from '../model/Category';
import { CATEGORIES_MOCK } from '../data/mock-categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoriesSubject = new BehaviorSubject<Category[]>([...CATEGORIES_MOCK]);

  categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  getSnapshot(): Category[] {
    return this.categoriesSubject.value;
  }

  // TODO #3: implement add(category: Category): void
  add(category: Category): void {
    const next = [category, ...this.categoriesSubject.value];
    this.categoriesSubject.next(next);
  }

  // TODO #4: implement delete(id: string): void
  delete(id: string): void {
    const next = this.categoriesSubject.value.filter(c => c.id !== id);
    this.categoriesSubject.next(next);
  }
}
