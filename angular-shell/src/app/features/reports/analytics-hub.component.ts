import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  standalone: true,
  selector: 'app-analytics-hub',
  templateUrl: './analytics-hub.component.html'
})
export class AnalyticsHubComponent extends ViewBaseComponent {
  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }
}
