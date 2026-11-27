import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface TemplateRecord {
  id: string | number;
  name: string;
  description: string;
  slug: string;
  items_count: unknown;
}

@Component({
  selector: 'app-templates-index',
  standalone: true,
  templateUrl: './templates-index.component.html'
})
export class TemplatesIndexComponent extends ViewBaseComponent {
  public readonly templates: TemplateRecord[];
  public readonly name: string;
  public readonly description: string;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    this.templates = this.state.resource<unknown[]>('masters.templates', []).map((item) => this.normalizeTemplate(item));
    this.name = String(this.old('name', ''));
    this.description = String(this.old('description', ''));
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
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

  private normalizeTemplate(value: unknown): TemplateRecord {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const id = item.id;
    return {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      slug: String(item.slug ?? ''),
      items_count: item.items_count ?? 0
    };
  }
}
