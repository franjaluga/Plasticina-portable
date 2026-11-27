import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface Account {
  id: string | number;
  code: string;
  name: string;
  category: string;
}

interface Owner {
  id: string | number;
  name: string;
  rut: string;
}

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-owners-accounts',
  standalone: true,
  templateUrl: './owners-accounts.component.html',
  imports: [AppSelectComponent]
})
export class OwnersAccountsComponent extends ViewBaseComponent {
  public readonly owner: Owner;
  public readonly accounts: Account[];
  public readonly categoryOptions: SelectOption[] = [
    { value: 'activo', label: 'Activo' },
    { value: 'pasivo', label: 'Pasivo' },
    { value: 'patrimonio', label: 'Patrimonio' },
    { value: 'perdida', label: 'Pérdida' },
    { value: 'ganancia', label: 'Ganancia' }
  ];
  public readonly badgeColors: Record<string, string> = {
    activo: 'bg-blue-50 text-blue-700 border-blue-200',
    pasivo: 'bg-amber-50 text-amber-700 border-amber-200',
    patrimonio: 'bg-purple-50 text-purple-700 border-purple-200',
    perdida: 'bg-rose-50 text-rose-700 border-rose-200',
    ganancia: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  public readonly accountModalOpenClass = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
  public readonly accountModalClosedClass = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4';
  public modalOpen = false;
  public modalTitle = 'Añadir Nueva Cuenta';
  public formAction = 'accounts.store';
  public accountId = '';
  public formCode = '';
  public formName = '';
  public formCategory = 'activo';

  private mode: 'create' | 'edit' = 'create';

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const value = this.state.resource<unknown>('owners.accounts', null);
    const detail = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const rawOwner = detail.owner && typeof detail.owner === 'object' ? detail.owner as Record<string, unknown> : {};
    const id = rawOwner.id;
    this.owner = {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      name: String(rawOwner.name ?? ''),
      rut: String(rawOwner.rut ?? '')
    };
    this.accounts = Array.isArray(detail.accounts) ? detail.accounts.map((item) => this.normalizeAccount(item)) : [];
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public get isEditing(): boolean {
    return this.mode === 'edit';
  }

  public badgeClass(category: unknown): string {
    return this.badgeColors[String(category)] || 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  public openCreate(): void {
    this.mode = 'create';
    this.formAction = 'accounts.store';
    this.modalTitle = 'Añadir Nueva Cuenta';
    this.accountId = '';
    this.formCode = String(this.old('code', ''));
    this.formName = String(this.old('name', ''));
    this.formCategory = String(this.old('category', 'activo'));
    this.modalOpen = true;
  }

  public openEdit(account: Account): void {
    this.mode = 'edit';
    this.formAction = 'accounts.update';
    this.modalTitle = 'Editar Cuenta Contable';
    this.accountId = String(this.old('account_id', account.id ?? ''));
    this.formCode = String(this.old('code', account.code ?? ''));
    this.formName = String(this.old('name', account.name ?? ''));
    this.formCategory = String(this.old('category', account.category ?? 'activo'));
    this.modalOpen = true;
  }

  public close(): void {
    this.modalOpen = false;
  }

  public onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  public override submit(name: string, event: Event): void {
    if (event.defaultPrevented) return;
    const form = event.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
    const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement ? event.submitter : null;
    const message = (submitter && submitter.getAttribute('data-confirm')) || (form && form.getAttribute('data-confirm')) || '';
    if (message && !window.confirm(message)) {
      event.preventDefault();
      return;
    }
    super.submit(name, event);
  }

  private normalizeAccount(value: unknown): Account {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const id = item.id;
    return {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      code: String(item.code ?? ''),
      name: String(item.name ?? ''),
      category: String(item.category ?? '')
    };
  }
}
