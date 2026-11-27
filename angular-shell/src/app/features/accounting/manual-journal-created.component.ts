import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface CreatedJournal {
  id: string;
  entryNumber: string;
}

@Component({
  standalone: true,
  selector: 'app-manual-journal-created',
  templateUrl: './manual-journal-created.component.html'
})
export class ManualJournalCreatedComponent extends ViewBaseComponent {
  public journal: CreatedJournal | null = null;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const query = this.state.context.query || {};
    const journalId = Number(query['journal_id']);
    const source = Number.isInteger(journalId) && journalId > 0 && typeof this.store.journal === 'function'
      ? this.store.journal(journalId)
      : null;
    if (source && typeof source === 'object') {
      const record = source as Record<string, any>;
      this.journal = {
        id: record['id'] === undefined || record['id'] === null ? '' : String(record['id']),
        entryNumber: record['entry_number'] === undefined || record['entry_number'] === null
          ? '' : String(record['entry_number'])
      };
    }
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }
}
