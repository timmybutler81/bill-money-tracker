import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

import { Category, CreateCategoryInput } from '../../model/Category';
import { CategoryType } from '../../model/CategoryType';

import { CategoryService } from '../../service/CategoryService';
import { CategoryTypeService } from '../../service/CategoryTypeService';

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
    MatExpansionModule,
  ],
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.css'],
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  categoryTypes: CategoryType[] = [];
  isLoadingCategories = false;

  form = {
    name: '',
    alias: '',
    typeId: '',
  };

  constructor(
    private categoryService: CategoryService,
    private categoryTypeService: CategoryTypeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll$().subscribe((categories) => {
      this.categories = categories;
      this.cdr.detectChanges();
    });

    this.categoryTypeService.getAll$().subscribe((categoryTypes) => {
      this.categoryTypes = categoryTypes;

      if (!this.form.typeId && categoryTypes.length > 0) {
        this.form.typeId = categoryTypes[0].id;
      }

      this.cdr.detectChanges();
    });

    this.loadCategories();
    this.categoryTypeService.load();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.cdr.detectChanges();

    this.categoryService.fetchAll().subscribe({
      next: (categories) => {
        this.categoryService.setCategories(categories);
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      },
    });
  }

  add(): void {
    if (!this.form.name.trim()) {
      return this.toast('Name is required.');
    }

    if (!this.form.typeId) {
      return this.toast('Category type is required.');
    }

    const newCategory: CreateCategoryInput = {
      name: this.form.name.trim(),
      alias: this.form.alias.trim() || undefined,
      typeId: this.form.typeId,
    };

    this.categoryService.add(newCategory);

    this.form.name = '';
    this.form.alias = '';
    this.cdr.detectChanges();
  }

  delete(id: string): void {
    this.categoryService.delete(id);
    this.cdr.detectChanges();
  }

  typeName(typeId: string): string {
    return this.categoryTypes.find((t) => t.id === typeId)?.name ?? 'Unknown';
  }

  trackById(_: number, c: Category): string {
    return c.id;
  }

  private toast(msg: string): void {
    alert(msg);
  }
}