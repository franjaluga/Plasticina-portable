import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  selector: 'app-import-sales-imported',
  standalone: true,
  templateUrl: './import-sales-imported.component.html'
})
export class IngressImportSalesImportedComponent extends ViewBaseComponent {
  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }
}

export { IngressImportSalesImportedComponent as ImportSalesImportedComponent };
