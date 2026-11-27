import { Injectable } from '@angular/core';

const FIELD_ARRAY = /\]$/;

@Injectable({ providedIn: 'root' })
export class FormService {
  readForm(form: HTMLFormElement): Record<string, any> {
    const result: Record<string, any> = {};
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index] as HTMLInputElement;
      if (!element.name || element.type === 'file') continue;
      if (element.type === 'checkbox') {
        this.readCheckbox(result, element);
        continue;
      }
      if (element.type === 'radio' && !element.checked) continue;
      result[element.name] = element.value;
    }
    return result;
  }

  grouped(form: HTMLFormElement, prefix: string): Array<Record<string, string> & { _key: string }> {
    const result: Array<Record<string, string> & { _key: string }> = [];
    const pattern = new RegExp('^' + prefix + '\\[([^\\]]+)\\]\\[(\\w+)\\]$');
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index] as HTMLInputElement;
      const match = pattern.exec(element.name || '');
      if (!match) continue;
      const item = this.itemFor(result, match[1]);
      item[match[2]] = element.value;
    }
    return result;
  }

  number(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  integer(value: unknown): number {
    return Math.trunc(this.number(value));
  }

  private readCheckbox(result: Record<string, any>, element: HTMLInputElement): void {
    if (FIELD_ARRAY.test(element.name)) {
      if (!Array.isArray(result[element.name])) result[element.name] = [];
      if (element.checked) result[element.name].push(element.value);
      return;
    }
    result[element.name] = element.checked ? element.value : '';
  }

  private itemFor(result: Array<Record<string, string> & { _key: string }>, key: string) {
    let item = result.find((entry) => entry._key === key);
    if (!item) {
      item = { _key: key };
      result.push(item);
    }
    return item;
  }
}
