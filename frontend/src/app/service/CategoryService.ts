import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, CreateCategoryInput } from '../model/Category';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  private readonly categoriesSubject = new BehaviorSubject<Category[]>([]);

  readonly categories$ = this.categoriesSubject.asObservable();

  fetchAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  load(): void {
    this.fetchAll().subscribe({
      next: (data: Category[]) => {
        this.categoriesSubject.next(data);
      },
      error: (err: unknown) => {
        console.error('Failed to load categories', err);
      },
    });
  }

  getAll$(): Observable<Category[]> {
    return this.categories$;
  }

  getSnapshot(): Category[] {
    return this.categoriesSubject.value;
  }

  setCategories(categories: Category[]): void {
    this.categoriesSubject.next(categories);
  }

  add(category: CreateCategoryInput): void {
    this.http.post<Category>(this.baseUrl, category).subscribe({
      next: (created: Category) => {
        const next = [created, ...this.categoriesSubject.value];
        this.categoriesSubject.next(next);
      },
      error: (err: unknown) => {
        console.error('Failed to create category', err);
      },
    });
  }

  delete(id: string): void {
    const next = this.categoriesSubject.value.filter((c) => c.id !== id);
    this.categoriesSubject.next(next);
  }
}