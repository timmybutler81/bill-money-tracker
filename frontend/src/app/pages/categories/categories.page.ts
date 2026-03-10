import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

import { Category } from '../../model/Category';
import { CategoryType } from '../../model/CategoryType';

import { CategoryService } from '../../service/CategoryService';
import { CATEGORY_TYPES_MOCK } from '../../data/mock-category-type';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatExpansionModule,],
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.css'],
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  categoryTypes: CategoryType[] = CATEGORY_TYPES_MOCK;

  private readonly userId = 'TODO_FROM_AUTH';

  form = {
    name: '',
    alias: '',
    typeId: this.categoryTypes[0]?.id ?? '',
  };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.categories$.subscribe((rows) => {
      this.categories = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  add(): void {
    if (!this.form.name.trim()) return this.toast('Name is required.');
    if (!this.form.typeId) return this.toast('Category type is required.');

    const newCategory: Category = {
      id: this.newId(),
      userId: this.userId,
      name: this.form.name.trim(),
      alias: this.form.alias.trim() || undefined,
      typeId: this.form.typeId,
      createdAt: new Date().toISOString(),
      createdBy: this.userId,
    };

    this.categoryService.add(newCategory);

    this.form.name = '';
    this.form.alias = '';
  }

  delete(id: string): void {
    this.categoryService.delete(id);
  }

  typeName(typeId: string): string {
    return this.categoryTypes.find(t => t.id === typeId)?.name ?? 'Unknown';
  }

  trackById(_: number, c: Category): string {
    return c.id;
  }

  private newId(): string {
    return `cat_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  private toast(msg: string): void {
    alert(msg);
  }
}