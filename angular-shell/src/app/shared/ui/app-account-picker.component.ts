import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { PlasticinaService } from '../../core/plasticina.service';

interface AccountRecord {
  code?: unknown;
  name?: unknown;
}

interface AccountSuggestion {
  account: AccountRecord;
  code: string;
  name: string;
}

interface ResolveResult {
  account: AccountRecord | null;
  ambiguous: boolean;
  matches: AccountRecord[];
}

interface NormalizeResult {
  valid: boolean;
  empty?: boolean;
  ambiguous?: boolean;
  account?: AccountRecord;
  matches?: AccountRecord[];
}

type LabelState = 'valid' | 'empty' | 'invalid';

let sequence = 0;
const openPanels = new Set<() => void>();

@Component({
  selector: 'app-account-picker',
  standalone: true,
  template: `
    <div class="account-search-wrap flex items-center gap-2">
      <div class="account-search-field relative min-w-0 flex-1">
        <input
          #searchInput
          type="text"
          data-account-search
          data-account-picker=""
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="panelOpen ? 'true' : 'false'"
          [attr.aria-controls]="panelId"
          [value]="text"
          placeholder="Código o nombre"
          class="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white"
          autocomplete="off"
          [attr.required]="required ? '' : null"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (focusout)="onFocusout($event)"
        >
        <input #hiddenInput type="hidden" [attr.name]="name" [value]="text">
        <div
          #panel
          [attr.id]="panelId"
          class="account-suggestions"
          [class.hidden]="!panelOpen"
          role="listbox"
        >
          @if (!suggestions.length) {
            <div class="account-suggestion-empty">Sin coincidencias</div>
          } @else {
            @for (suggestion of suggestions; track $index) {
              <button
                type="button"
                role="option"
                [attr.aria-selected]="active === $index ? 'true' : 'false'"
                [class.account-suggestion-active]="active === $index"
                [attr.data-index]="$index"
                class="account-suggestion"
                [attr.data-code]="suggestion.code"
                (mousedown)="onSuggestionMousedown($event)"
              ><span class="font-mono font-semibold text-slate-800">{{ suggestion.code }}</span><span class="text-slate-400"> - </span><span class="text-slate-600">{{ suggestion.name }}</span></button>
            }
          }
        </div>
      </div>
      <span
        class="account-name-label truncate text-xs"
        [class.text-slate-600]="labelState === 'valid'"
        [class.font-medium]="labelState === 'valid'"
        [class.text-gray-400]="labelState !== 'valid'"
        [class.italic]="labelState !== 'valid'"
        [attr.title]="labelText"
      >{{ labelText }}</span>
    </div>
  `
})
export class AppAccountPickerComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() name = '';
  @Input() value = '';
  @Input() accounts: any[] = [];
  @Input() ownerId: number | string | null = null;
  @Input() workingYear: number = new Date().getFullYear();
  @Input() required = true;
  @Output() readonly valueChange = new EventEmitter<string>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('hiddenInput') private hiddenInput?: ElementRef<HTMLInputElement>;
  @ViewChild('panel') private panel?: ElementRef<HTMLDivElement>;

  readonly panelId = 'account-suggestions-' + (++sequence);
  text = '';
  suggestions: AccountSuggestion[] = [];
  active = -1;
  panelOpen = false;
  labelText = 'Seleccione o escriba cuenta';
  labelState: LabelState = 'empty';

  private source: AccountRecord[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private form: HTMLFormElement | null = null;
  private readonly hideSelf = () => this.hide();
  private readonly submitHandler = (event: Event): void => this.onFormSubmit(event);

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly app: PlasticinaService
  ) {
    openPanels.add(this.hideSelf);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.text = this.value === null || this.value === undefined ? '' : String(this.value);
    }
    if (changes['accounts'] || !this.source.length) {
      const supplied = this.accountList(this.accounts);
      if (supplied.length) {
        this.source = supplied;
        this.syncLabel();
      } else {
        this.loadAccounts();
      }
    }
    if (changes['value'] || changes['accounts'] || changes['ownerId'] || changes['workingYear']) {
      this.syncLabel();
    }
  }

  ngAfterViewInit(): void {
    const form = this.host.nativeElement.closest('form') as HTMLFormElement | null;
    if (form) {
      this.form = form;
      form.addEventListener('submit', this.submitHandler, true);
    }
    const input = this.searchInput?.nativeElement as (HTMLInputElement & Record<string, unknown>) | undefined;
    if (input) {
      input['__plasticinaAccountPicker'] = {
        input,
        hide: () => this.hide(),
        show: () => this.renderSuggestions(),
        select: (index: number) => this.select(index),
        normalize: () => this.normalize()
      };
    }
  }

  ngOnDestroy(): void {
    openPanels.delete(this.hideSelf);
    if (this.form) this.form.removeEventListener('submit', this.submitHandler, true);
    if (this.timer) clearTimeout(this.timer);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.setCustomValidity('');
    this.text = input.value;
    this.value = input.value;
    if (this.hiddenInput) this.hiddenInput.nativeElement.value = input.value;
    this.valueChange.emit(input.value);
    this.syncLabel();
    this.scheduleRender();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.suggestions.length || !this.panelOpen) this.renderSuggestions();
      if (!this.suggestions.length) return;
      this.active = event.key === 'ArrowDown'
        ? Math.min(this.active + 1, this.suggestions.length - 1)
        : Math.max(this.active - 1, 0);
      return;
    }
    if (event.key === 'Enter' && this.active >= 0 && this.suggestions[this.active]) {
      event.preventDefault();
      this.select(this.active);
      return;
    }
    if (event.key === 'Enter') {
      const result = this.resolveAccount(this.text);
      if (result.account) {
        event.preventDefault();
        this.select(this.suggestions.findIndex((item) => item.account === result.account));
        const code = String(result.account.code ?? '');
        if (this.text !== code) {
          this.text = code;
          this.value = code;
          if (this.hiddenInput) this.hiddenInput.nativeElement.value = code;
          this.setLabel(this.accountName(result.account), 'valid');
          this.valueChange.emit(code);
          this.hide();
        }
      }
      return;
    }
    if (event.key === 'Escape') this.hide();
  }

  onFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.panel && this.panel.nativeElement.contains(related)) return;
    this.hide();
  }

  onSuggestionMousedown(event: MouseEvent): void {
    const target = event.target as Element | null;
    const option = target && typeof target.closest === 'function' ? target.closest('[data-index]') : null;
    if (!option || !this.panel) return;
    event.preventDefault();
    const index = Number(option.getAttribute('data-index'));
    if (Number.isFinite(index)) this.select(index);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    if (!this.panelOpen) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (target === this.searchInput?.nativeElement ||
        target === this.panel?.nativeElement ||
        (this.panel && this.panel.nativeElement.contains(target))) return;
    this.hide();
  }

  private accountList(value: unknown): AccountRecord[] {
    if (Array.isArray(value)) return value as AccountRecord[];
    if (value && typeof value === 'object' && Array.isArray((value as { accounts?: unknown }).accounts)) {
      return (value as { accounts: AccountRecord[] }).accounts;
    }
    return [];
  }

  private loadAccounts(): void {
    const store = this.app.store;
    const fallback = store && typeof store.activeOwnerAccounts === 'function'
      ? this.accountList(store.activeOwnerAccounts())
      : [];
    this.source = fallback;
    this.syncLabel();
    const data = this.app.data;
    if (!data || typeof data.resolve !== 'function') return;
    Promise.resolve(data.resolve('catalogs.accounts', this.context()))
      .then((result) => {
        const list = this.accountList(result && typeof result === 'object' && 'data' in result
          ? (result as { data: unknown }).data
          : result);
        if (list.length) this.source = list;
        this.syncLabel();
      })
      .catch(() => {
        this.source = fallback;
        this.syncLabel();
      });
  }

  private context(): Record<string, unknown> {
    const store = this.app.store;
    const owner = store && typeof store.activeOwner === 'function' ? store.activeOwner() : null;
    const ownerId = this.ownerId === null || this.ownerId === '' ? (owner ? owner.id : null) : this.ownerId;
    const storedYear = store && typeof store.workingYear === 'function' ? Number(store.workingYear()) : 0;
    const year = this.workingYear || storedYear || new Date().getFullYear();
    const today = this.app.ui && typeof this.app.ui.today === 'function' ? this.app.ui.today() : '';
    const month = today ? Number(today.slice(5, 7)) : 1;
    return {
      ownerId,
      workingYear: year,
      year,
      month,
      params: {},
      query: {},
      include: []
    };
  }

  private normalizeText(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private accountName(account: AccountRecord | null): string {
    return account ? String(account.name || '') : '';
  }

  private accountSource(accounts: AccountRecord[]): AccountRecord[] {
    const seen = new Set<unknown>();
    return accounts.filter((account) => {
      if (!account || account.code === undefined || account.code === null || seen.has(account.code)) return false;
      seen.add(account.code);
      return true;
    });
  }

  private searchAccounts(term: string, limit: number): AccountRecord[] {
    const needle = this.normalizeText(term);
    const source = this.accountSource(this.source);
    const matches = source.filter((account) => {
      if (!needle) return true;
      return this.normalizeText(account.code).indexOf(needle) !== -1 ||
        this.normalizeText(account.name).indexOf(needle) !== -1;
    });
    return limit ? matches.slice(0, Math.max(1, limit)) : matches;
  }

  private resolveAccount(value: string): ResolveResult {
    const source = this.accountSource(this.source);
    const term = this.normalizeText(value);
    if (!term) return { account: null, ambiguous: false, matches: [] };
    const account = source.find((item) => this.normalizeText(item.code) === term);
    if (account) return { account, ambiguous: false, matches: [account] };
    const exactNames = source.filter((item) => this.normalizeText(item.name) === term);
    if (exactNames.length === 1) return { account: exactNames[0], ambiguous: false, matches: exactNames };
    if (exactNames.length > 1) return { account: null, ambiguous: true, matches: exactNames };
    const matches = this.searchAccounts(term, 0);
    if (matches.length === 1) return { account: matches[0], ambiguous: false, matches };
    return { account: null, ambiguous: matches.length > 1, matches };
  }

  private setLabel(text: string, state: LabelState): void {
    this.labelText = text;
    this.labelState = state;
  }

  private syncLabel(): void {
    const result = this.resolveAccount(this.text);
    if (result.account) {
      this.setLabel(this.accountName(result.account), 'valid');
      return;
    }
    if (!String(this.text === undefined || this.text === null ? '' : this.text).trim()) {
      this.setLabel('Seleccione o escriba cuenta', 'empty');
      return;
    }
    this.setLabel(result.ambiguous ? 'Cuenta ambigua' : 'Cuenta no encontrada', 'invalid');
  }

  private scheduleRender(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.renderSuggestions();
    }, 60);
  }

  private renderSuggestions(): void {
    this.suggestions = this.searchAccounts(this.text, 8).map((account) => ({
      account,
      code: String(account.code ?? ''),
      name: this.accountName(account)
    }));
    this.active = -1;
    this.show();
  }

  private show(): void {
    openPanels.forEach((hide) => {
      if (hide !== this.hideSelf) hide();
    });
    this.panelOpen = true;
  }

  private hide(): void {
    this.panelOpen = false;
    this.active = -1;
  }

  private select(index: number): void {
    const suggestion = this.suggestions[index];
    if (!suggestion) return;
    const code = suggestion.code;
    this.text = code;
    this.value = code;
    const input = this.searchInput?.nativeElement;
    if (input) {
      input.value = code;
      input.setCustomValidity('');
    }
    if (this.hiddenInput) this.hiddenInput.nativeElement.value = code;
    this.setLabel(suggestion.name, 'valid');
    this.hide();
    this.valueChange.emit(code);
  }

  private normalize(): NormalizeResult {
    const input = this.searchInput?.nativeElement;
    if (!input) return { valid: false, empty: true };
    const value = String(input.value || '').trim();
    if (!value) {
      input.setCustomValidity('');
      this.setLabel('Seleccione o escriba cuenta', 'empty');
      this.hide();
      return { valid: false, empty: true };
    }
    const result = this.resolveAccount(value);
    if (result.account) {
      const code = String(result.account.code ?? '');
      input.value = code;
      input.setCustomValidity('');
      if (this.hiddenInput) this.hiddenInput.nativeElement.value = code;
      this.text = code;
      this.value = code;
      this.setLabel(this.accountName(result.account), 'valid');
      this.hide();
      this.valueChange.emit(code);
      return { valid: true, account: result.account };
    }
    const message = result.ambiguous
      ? 'La cuenta "' + value + '" es ambigua; seleccione una coincidencia de la lista.'
      : 'No existe una cuenta contable que coincida con "' + value + '".';
    input.setCustomValidity(message);
    this.setLabel(result.ambiguous ? 'Cuenta ambigua' : 'Cuenta no encontrada', 'invalid');
    this.renderSuggestions();
    this.app.flash('error', message);
    return { valid: false, ambiguous: result.ambiguous, matches: result.matches };
  }

  private onFormSubmit(event: Event): void {
    const result = this.normalize();
    if (!result.valid && !result.empty) event.preventDefault();
  }
}
