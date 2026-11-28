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

export interface AppSelectOption {
  value: string | number;
  label: string;
}

interface NormalizedOption {
  value: string;
  label: string;
}

let sequence = 0;
const openBindings = new Set<() => void>();
const DEFAULT_TRIGGER_CLASS = 'w-full text-xs border-slate-300 rounded-lg shadow-sm p-2 bg-white border';

@Component({
  selector: 'app-select',
  standalone: true,
  host: { class: 'block min-w-0' },
  template: `
    <div
      #root
      class="ui-select relative"
      [class.is-disabled]="disabled"
      data-ui-select
      [attr.data-name]="name"
      [attr.data-value]="selectedValue"
      [attr.data-required]="required ? 'true' : null"
      [attr.data-disabled]="disabled ? 'true' : null"
    >
      <input
        #hiddenInput
        type="text"
        class="ui-select-value"
        [attr.name]="name"
        [value]="selectedValue"
        [attr.required]="required ? '' : null"
        [attr.disabled]="disabled ? '' : null"
        tabindex="-1"
        aria-hidden="true"
      >
      <button
        #trigger
        type="button"
        [class]="triggerClass"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open ? 'true' : 'false'"
        [attr.aria-controls]="menuId"
        [attr.disabled]="disabled ? '' : null"
        (click)="onTriggerClick($event)"
        (keydown)="onTriggerKeydown($event)"
        (focusout)="onTriggerFocusout($event)"
      >
        <span class="ui-select-label truncate" [attr.title]="selectedLabel">{{ selectedLabel }}</span>
        <svg class="ui-select-arrow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"></path>
        </svg>
      </button>
      <ul
        #menu
        class="ui-select-menu"
        [class.hidden]="!open"
        role="listbox"
        [attr.id]="menuId"
        (mousedown)="onOptionMousedown($event)"
        (mouseover)="onOptionMouseover($event)"
      >
        @for (item of items; track $index) {
          <li
            class="ui-select-option"
            role="option"
            [class.ui-select-option-active]="open && active === $index"
            [attr.aria-selected]="(open ? active === $index : item.value === selectedValue) ? 'true' : 'false'"
            [attr.data-value]="item.value"
            tabindex="-1"
          >{{ item.label }}</li>
        }
      </ul>
    </div>
  `
})
export class AppSelectComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() name = '';
  @Input() options: AppSelectOption[] = [];
  @Input() value: string | number | null = null;
  @Input() required = true;
  @Input() disabled = false;
  @Input() placeholder = 'Seleccione una opción';
  @Input() className = '';
  @Output() readonly valueChange = new EventEmitter<string | number | null>();

  @ViewChild('root') private root?: ElementRef<HTMLElement>;
  @ViewChild('hiddenInput') private hiddenInput?: ElementRef<HTMLInputElement>;
  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('menu') private menu?: ElementRef<HTMLUListElement>;

  readonly menuId = 'ui-select-menu-' + (++sequence);
  items: NormalizedOption[] = [];
  open = false;
  active = -1;

  private readonly hideSelf = () => this.hide();

  constructor(private readonly host: ElementRef<HTMLElement>) {
    openBindings.add(this.hideSelf);
  }

  get selectedValue(): string {
    return this.value === null || this.value === undefined ? '' : String(this.value);
  }

  get selectedLabel(): string {
    const current = this.items.find((item) => item.value === this.selectedValue);
    return current ? current.label : this.placeholder;
  }

  get triggerClass(): string {
    return 'ui-select-trigger ' + (this.className || DEFAULT_TRIGGER_CLASS);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || !this.items.length) {
      this.items = this.normalize(this.options);
    }
    if (changes['value'] || changes['required']) {
      this.syncValidity();
    }
    if (changes['disabled'] && this.disabled) {
      this.hide();
    }
  }

  ngAfterViewInit(): void {
    this.syncValidity();
    const element = this.root?.nativeElement as (HTMLElement & Record<string, unknown>) | undefined;
    if (element) {
      element['__plasticinaSelect'] = {
        root: element,
        getValue: () => this.selectedValue,
        setValue: (next: unknown) => this.commit(this.asValue(next)),
        setDisabled: (next: unknown) => {
          this.disabled = !!next;
          if (this.disabled) this.hide();
        },
        isDisabled: () => this.disabled,
        openMenu: () => this.show(),
        closeMenu: () => this.hide()
      };
    }
  }

  ngOnDestroy(): void {
    openBindings.delete(this.hideSelf);
  }

  onTriggerClick(event: Event): void {
    event.preventDefault();
    if (this.disabled) return;
    if (this.open) this.hide(); else this.show();
    this.trigger?.nativeElement.focus();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const keys = ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape', 'Home', 'End'];
    if (keys.indexOf(event.key) === -1) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      this.hide();
      return;
    }
    if (!this.open) {
      this.show();
      return;
    }
    const last = this.items.length - 1;
    if (event.key === 'ArrowDown') this.setActive(Math.min(this.active + 1, last));
    if (event.key === 'ArrowUp') this.setActive(Math.max(this.active - 1, 0));
    if (event.key === 'Home') this.setActive(0);
    if (event.key === 'End') this.setActive(last);
    if (event.key === 'Enter' || event.key === ' ') {
      if (this.active >= 0) this.select(this.active); else this.hide();
    }
  }

  onTriggerFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.menu && this.menu.nativeElement.contains(related)) return;
    this.hide();
  }

  onOptionMousedown(event: MouseEvent): void {
    const target = event.target as Element | null;
    const option = target && typeof target.closest === 'function' ? target.closest('[data-value]') : null;
    if (!option || !this.menu) return;
    event.preventDefault();
    const options = Array.prototype.slice.call(this.menu.nativeElement.querySelectorAll('[role="option"]')) as Element[];
    const index = options.indexOf(option);
    if (index >= 0) this.select(index);
    this.trigger?.nativeElement.focus();
  }

  onOptionMouseover(event: MouseEvent): void {
    const target = event.target as Element | null;
    const option = target && typeof target.closest === 'function' ? target.closest('[data-value]') : null;
    if (!option || this.disabled || !this.menu) return;
    const options = Array.prototype.slice.call(this.menu.nativeElement.querySelectorAll('[role="option"]')) as Element[];
    const index = options.indexOf(option);
    if (index >= 0) this.setActive(index);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    if (!this.open) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (target === this.host.nativeElement || this.host.nativeElement.contains(target)) return;
    this.hide();
  }

  private normalize(options: AppSelectOption[]): NormalizedOption[] {
    return (Array.isArray(options) ? options : []).map((item) => {
      if (item === null || item === undefined) return { value: '', label: '' };
      if (typeof item !== 'object') return { value: String(item), label: String(item) };
      return {
        value: item.value === undefined || item.value === null ? '' : String(item.value),
        label: item.label === undefined || item.label === null ? '' : String(item.label)
      };
    });
  }

  private asValue(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private show(): void {
    if (this.disabled) return;
    openBindings.forEach((hide) => {
      if (hide !== this.hideSelf) hide();
    });
    this.open = true;
    const index = this.items.findIndex((item) => item.value === this.selectedValue);
    this.setActive(index);
  }

  private hide(): void {
    if (!this.open) return;
    this.open = false;
    this.active = -1;
  }

  private setActive(index: number): void {
    this.active = index;
    const options = this.menu?.nativeElement.querySelectorAll('[role="option"]');
    const option = options ? options[index] : null;
    if (option && typeof option.scrollIntoView === 'function') {
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  private select(index: number): void {
    const item = this.items[index];
    if (!item) return;
    this.commit(item.value);
    this.hide();
  }

  private commit(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    if (this.hiddenInput) {
      this.hiddenInput.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.host.nativeElement.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private syncValidity(): void {
    const input = this.hiddenInput?.nativeElement;
    if (!input) return;
    input.setCustomValidity(this.required && !this.selectedValue ? 'Seleccione una opción válida.' : '');
  }
}
