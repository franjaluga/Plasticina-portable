import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface TemplateItem {
  id: string | number;
  code: string;
  name: string;
  category: string;
}

interface TemplateRecord {
  id: string | number;
  name: string;
  description: string;
}

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-templates-edit',
  standalone: true,
  templateUrl: './templates-edit.component.html',
  imports: [AppSelectComponent]
})
export class TemplatesEditComponent extends ViewBaseComponent {
  public readonly template: TemplateRecord;
  public items: TemplateItem[];
  public readonly name: string;
  public readonly description: string;
  public readonly categoryOptions: SelectOption[] = [
    { value: 'activo', label: 'Activo' },
    { value: 'pasivo', label: 'Pasivo' },
    { value: 'patrimonio', label: 'Patrimonio' },
    { value: 'ganancia', label: 'Ganancia' },
    { value: 'perdida', label: 'Pérdida' }
  ];

  private rowCounter = 0;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const value = this.state.resource<unknown>('masters.templateDetail', null);
    const detail = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const rawTemplate = detail.template && typeof detail.template === 'object' ? detail.template as Record<string, unknown> : {};
    const id = rawTemplate.id;
    this.template = {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      name: String(rawTemplate.name ?? ''),
      description: String(rawTemplate.description ?? '')
    };
    this.items = Array.isArray(detail.items) ? detail.items.map((item) => this.normalizeItem(item)) : [];
    this.name = String(this.old('name', this.template.name));
    this.description = String(this.old('description', this.template.description));
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public itemValue(item: TemplateItem, field: 'code' | 'name' | 'category'): string {
    const key = 'items[' + String(item.id) + '][' + field + ']';
    return String(this.old(key, item[field]) ?? '');
  }

  public addRow(): void {
    let id = 'new_' + Date.now();
    while (this.items.some((item) => String(item.id) === id)) {
      this.rowCounter += 1;
      id = 'new_' + Date.now() + '_' + this.rowCounter;
    }
    this.items.push({ id, code: '', name: '', category: 'activo' });
  }

  public removeRow(index: number): void {
    this.items.splice(index, 1);
  }

  private normalizeItem(value: unknown): TemplateItem {
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
