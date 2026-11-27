import { Component, HostListener } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface Owner {
  id: string | number;
  rut: string;
  name: string;
  account_plan_type: string;
  start_month: unknown;
  start_year: unknown;
  is_active: boolean;
}

interface TemplateRecord {
  id: string | number;
  slug: string;
  name: string;
  description: string;
  items_count: unknown;
}

interface SelectOption {
  value: string;
  label: string;
}

type OwnerKey = string | number;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

@Component({
  selector: 'app-owners-index',
  standalone: true,
  templateUrl: './owners-index.component.html',
  imports: [AppSelectComponent]
})
export class OwnersIndexComponent extends ViewBaseComponent {
  public readonly owners: Owner[];
  public readonly templates: TemplateRecord[];
  public readonly activeOwner: Owner | null;
  public readonly maxStartYear: number;
  public readonly currentYear: number;
  public readonly planOptions: SelectOption[];
  public readonly startMonthOptions: SelectOption[];
  public readonly rut: string;
  public readonly name: string;
  public readonly selectedPlan: string;
  public readonly selectedStartMonth: string;
  public readonly selectedStartYear: string;
  public readonly ownerModalOpenClass = 'fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4';
  public readonly ownerModalClosedClass = 'fixed inset-0 z-50 hidden bg-slate-900/50 flex items-center justify-center p-4';
  public openOwnerId: OwnerKey | null = null;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.owners = this.state.resource<unknown[]>('owners.list', []).map((item) => this.normalizeOwner(item));
    this.templates = this.state.resource<unknown[]>('masters.templates', []).map((item) => this.normalizeTemplate(item));
    const active = this.store.activeOwner ? this.store.activeOwner() : null;
    this.activeOwner = active ? this.normalizeOwner(active) : null;
    this.maxStartYear = Number(this.store.maxWorkingYear ? this.store.maxWorkingYear() : this.currentYear) || this.currentYear;
    this.planOptions = [{ value: 'standard_pyme', label: 'Plan Estándar PyME (Base)' }].concat(
      this.templates.map((item) => ({ value: item.slug, label: item.name }))
    );
    this.startMonthOptions = MONTH_NAMES.map((label, index) => ({
      value: String(index + 1).padStart(2, '0'),
      label: String(index + 1).padStart(2, '0') + ' - ' + label
    }));
    this.rut = String(this.old('rut', ''));
    this.name = String(this.old('name', ''));
    this.selectedPlan = String(this.old('account_plan_type', 'standard_pyme'));
    this.selectedStartMonth = String(this.old('start_month', today.getMonth() + 1)).padStart(2, '0');
    this.selectedStartYear = String(this.old('start_year', this.currentYear));
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public planName(type: unknown): string {
    if (String(type) === 'standard_pyme') {
      return 'Plan Estándar PyME';
    }
    const matched = this.templates.find((item) => String(item.slug) === String(type));
    return matched ? matched.name : String(type ?? '');
  }

  public startLabel(owner: Owner): string {
    return String(owner.start_month || 1).padStart(2, '0') + '/' + String(owner.start_year || this.currentYear);
  }

  public toggleOwnerModal(id: OwnerKey): void {
    this.openOwnerId = this.openOwnerId === id ? null : id;
  }

  public closeOwnerModal(): void {
    this.openOwnerId = null;
  }

  public isOwnerModalOpen(owner: Owner): boolean {
    return this.openOwnerId !== null && String(this.openOwnerId) === String(owner.id);
  }

  public ownerModalClass(owner: Owner): string {
    return this.isOwnerModalOpen(owner) ? this.ownerModalOpenClass : this.ownerModalClosedClass;
  }

  public onModalBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeOwnerModal();
    }
  }

  @HostListener('document:keydown.escape')
  public closeOwnerModalOnEscape(): void {
    this.closeOwnerModal();
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

  private normalizeOwner(value: unknown): Owner {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const id = item.id;
    return {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      rut: String(item.rut ?? ''),
      name: String(item.name ?? ''),
      account_plan_type: String(item.account_plan_type ?? ''),
      start_month: item.start_month ?? 1,
      start_year: item.start_year ?? this.currentYear,
      is_active: Boolean(item.is_active)
    };
  }

  private normalizeTemplate(value: unknown): TemplateRecord {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const id = item.id;
    return {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      slug: String(item.slug ?? ''),
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      items_count: item.items_count ?? 0
    };
  }
}
