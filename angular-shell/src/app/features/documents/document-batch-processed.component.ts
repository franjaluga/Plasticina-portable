import { Component, OnInit } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  selector: 'app-document-batch-processed',
  standalone: true,
  templateUrl: './document-batch-processed.component.html'
})
export class DocumentBatchProcessedComponent extends ViewBaseComponent implements OnInit {
  public processed: number | null = null;
  public showSummary = false;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
  }

  public ngOnInit(): void {
    const query = this.ctx.query || {};
    const processed = Number(query['processed']);
    this.processed = processed;
    this.showSummary = Number.isInteger(processed) && processed >= 0;
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }
}
