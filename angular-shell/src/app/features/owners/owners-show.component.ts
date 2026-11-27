import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface OwnerDetail {
  owner: {
    id: string | number;
    rut: string;
    name: string;
    account_plan_type: string;
    is_active: boolean;
  };
  accountsCount: number;
}

@Component({
  selector: 'app-owners-show',
  standalone: true,
  templateUrl: './owners-show.component.html'
})
export class OwnersShowComponent extends ViewBaseComponent {
  public readonly owner: OwnerDetail['owner'];
  public readonly accountsCount: number;

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const value = this.state.resource<unknown>('owners.detail', null);
    const detail = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const rawOwner = detail.owner && typeof detail.owner === 'object' ? detail.owner as Record<string, unknown> : {};
    const id = rawOwner.id;
    const count = detail.accountsCount;
    this.owner = {
      id: typeof id === 'string' || typeof id === 'number' ? id : '',
      rut: String(rawOwner.rut ?? ''),
      name: String(rawOwner.name ?? ''),
      account_plan_type: String(rawOwner.account_plan_type ?? ''),
      is_active: Boolean(rawOwner.is_active)
    };
    this.accountsCount = typeof count === 'number' ? count : Number(count ?? 0) || 0;
  }
}
