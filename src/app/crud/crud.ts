import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';

interface CrudFormModel {
  name: string;
  email: string;
  role: string;
  gender: string;
  education: string[];
}

interface CrudItem extends CrudFormModel {
  id: number;
}

interface CrudFormErrors {
  name: string;
  email: string;
  role: string;
  gender: string;
  education: string;
}

interface ConfirmDialogData {
  title: string;
  message: string;
  email?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.email) {
        <p>Email: <strong>{{ data.email }}</strong></p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-crud',
  host: {
    '(window:resize)': 'onWindowResize()',
  },
  imports: [
    ScrollingModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  templateUrl: './crud.html',
  styleUrl: './crud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Crud {
  private readonly storageKey = 'crud-items-v1';
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly recordItemSize = 188;
  readonly viewportHeight = signal(this.getViewportHeight());
  readonly genderOptions = ['Male', 'Female', 'Other'];
  readonly educationOptions = ['High School', 'Diploma', 'Graduate', 'Post Graduate'];

  formModel = signal<CrudFormModel>({
    name: '',
    email: '',
    role: '',
    gender: '',
    education: [],
  });

  items = signal<CrudItem[]>([]);
  editingId = signal<number | null>(null);
  formErrors = signal<CrudFormErrors>({
    name: '',
    email: '',
    role: '',
    gender: '',
    education: '',
  });

  constructor() {
    this.loadItems();
  }

  isEditing(id: number): boolean {
    return this.editingId() === id;
  }

  trackByItemId(_index: number, item: CrudItem): number {
    return item.id;
  }

  onWindowResize(): void {
    this.viewportHeight.set(this.getViewportHeight());
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const value = this.formModel();
    const currentId = this.editingId();

    if (currentId === null) {
      const item: CrudItem = {
        id: Date.now(),
        ...value,
      };
      this.items.update((current) => [item, ...current]);
    } else {
      this.items.update((current) =>
        current.map((item) => (item.id === currentId ? { ...item, ...value } : item)),
      );
    }

    this.persistItems();
    this.resetForm();
  }

  startEdit(item: CrudItem): void {
    this.editingId.set(item.id);
    this.formModel.set({
      name: item.name,
      email: item.email,
      role: item.role,
      gender: item.gender,
      education: item.education,
    });
    this.formErrors.set({ name: '', email: '', role: '', gender: '', education: '' });
  }

  async deleteItem(id: number): Promise<void> {
    const item = this.items().find((current) => current.id === id);

    const confirmed = await this.confirmAction({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record?',
      email: item?.email?.trim() || undefined,
    });

    if (!confirmed) {
      return;
    }

    this.items.update((current) => current.filter((item) => item.id !== id));

    if (this.editingId() === id) {
      this.resetForm();
    }

    this.persistItems();
  }

  async clearAll(): Promise<void> {
    const confirmed = await this.confirmAction({
      title: 'Clear All Records',
      message: 'Are you sure you want to clear all records?',
    });

    if (!confirmed) {
      return;
    }

    this.items.set([]);
    this.resetForm();
    this.persistItems();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  updateField(field: keyof CrudFormModel, value: string): void {
    this.formModel.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  toggleEducation(education: string, checked: boolean): void {
    this.formModel.update((current) => ({
      ...current,
      education: checked
        ? [...current.education, education]
        : current.education.filter((item) => item !== education),
    }));
  }

  hasErrors(): boolean {
    const errors = this.formErrors();
    return Boolean(errors.name || errors.email || errors.role || errors.gender || errors.education);
  }

  private validateForm(): boolean {
    const data = this.formModel();
    const nextErrors: CrudFormErrors = { name: '', email: '', role: '', gender: '', education: '' };
    const normalizedEmail = data.email.trim().toLowerCase();
    const currentId = this.editingId();

    if (!data.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!data.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email';
    } else {
      const duplicate = this.items().some(
        (item) => item.id !== currentId && item.email.trim().toLowerCase() === normalizedEmail,
      );

      if (duplicate) {
        nextErrors.email = 'This email already exists';
        this.snackBar.open('Duplicate email entry is not allowed.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    }

    if (!data.role.trim()) {
      nextErrors.role = 'Role is required';
    }

    if (!data.gender.trim()) {
      nextErrors.gender = 'Gender is required';
    }

    if (data.education.length === 0) {
      nextErrors.education = 'Select at least one education option';
    }

    this.formErrors.set(nextErrors);
    return !nextErrors.name && !nextErrors.email && !nextErrors.role && !nextErrors.gender && !nextErrors.education;
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.formModel.set({
      name: '',
      email: '',
      role: '',
      gender: '',
      education: [],
    });
    this.formErrors.set({ name: '', email: '', role: '', gender: '', education: '' });
  }

  private loadItems(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CrudItem[];
      this.items.set(Array.isArray(parsed) ? parsed.map((item) => this.normalizeItem(item)) : []);
    } catch {
      this.items.set([]);
    }
  }

  private persistItems(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
  }

  private async confirmAction(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '360px',
      disableClose: true,
      data,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }

  private getViewportHeight(): number {
    if (typeof window === 'undefined') {
      return 500;
    }

    return Math.max(320, window.innerHeight - 260);
  }

  private normalizeItem(item: Partial<CrudItem>): CrudItem {
    return {
      id: item.id ?? Date.now(),
      name: item.name ?? '',
      email: item.email ?? '',
      role: item.role ?? '',
      gender: item.gender ?? '',
      education: Array.isArray(item.education) ? item.education : [],
    };
  }
}
