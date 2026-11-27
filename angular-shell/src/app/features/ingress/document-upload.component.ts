import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  templateUrl: './document-upload.component.html'
})
export class DocumentUploadComponent extends ViewBaseComponent {
  public readonly ownerId: string | number;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerId = owner && owner.id !== undefined && owner.id !== null ? owner.id : '';
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }
}
