import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category } from '../model/Category';
import { CATEGORIES_MOCK } from '../data/mock-categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoriesSubject = new BehaviorSubject<Category[]>([...CATEGORIES_MOCK]);

  categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  getAll$(): Observable<Category[]> {
    return this.categories$;
  }
  
  getSnapshot(): Category[] {
    return this.categoriesSubject.value;
  }

  add(category: Category): void {
    const next = [category, ...this.categoriesSubject.value];
    this.categoriesSubject.next(next);
  }

  delete(id: string): void {
    const next = this.categoriesSubject.value.filter(c => c.id !== id);
    this.categoriesSubject.next(next);
  }
}
