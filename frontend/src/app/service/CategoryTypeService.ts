import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CategoryType } from '../model/CategoryType';

@Injectable({ providedIn: 'root' })
export class CategoryTypeService {
  private readonly http = inject(HttpClient);
  private readonly categoryTypesSubject = new BehaviorSubject<CategoryType[]>([]);
  private readonly baseUrl = `${environment.apiBaseUrl}/category-types`;

  readonly categoryTypes$: Observable<CategoryType[]> = this.categoryTypesSubject.asObservable();

  load(): void {
    this.http.get<CategoryType[]>(this.baseUrl).subscribe({
      next: (data: CategoryType[]) => {
        this.categoryTypesSubject.next(data);
      },
      error: (err: unknown) => {
        console.error('Failed to load category types', err);
      },
    });
  }

  getAll$(): Observable<CategoryType[]> {
    return this.categoryTypes$;
  }

  getSnapshot(): CategoryType[] {
    return this.categoryTypesSubject.value;
  }
}