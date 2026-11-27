import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ViewContext } from './plasticina.service';

export interface ViewState {
  context: ViewContext;
  data: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private readonly subject = new BehaviorSubject<ViewState>({
    context: {
      ownerId: null,
      workingYear: new Date().getFullYear(),
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      params: {},
      query: {},
      include: []
    },
    data: {}
  });

  readonly state$ = this.subject.asObservable();

  get snapshot(): ViewState {
    return this.subject.value;
  }

  get context(): ViewContext {
    return this.snapshot.context;
  }

  get data(): Record<string, any> {
    return this.snapshot.data;
  }

  set(context: ViewContext, data: Record<string, any>): void {
    this.subject.next({ context, data });
  }

  resource<T>(name: string, fallback: T): T {
    const value = this.data[name];
    return value === undefined || value === null ? fallback : value as T;
  }
}
