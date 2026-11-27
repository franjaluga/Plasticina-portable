import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { PlasticinaService, ViewContext } from './plasticina.service';
import { ViewStateService } from './view-state.service';
import { VIEW_RESOURCES } from './view-resources';

export interface ViewDataResult {
  context: ViewContext;
  data: Record<string, unknown>;
}

function strings(source: Record<string, unknown>): Record<string, string> {
  return Object.keys(source).reduce<Record<string, string>>((result, key) => {
    result[key] = String(source[key]);
    return result;
  }, {});
}

export const viewDataResolver: ResolveFn<ViewDataResult> = async (route: ActivatedRouteSnapshot) => {
  const app = inject(PlasticinaService);
  const state = inject(ViewStateService);
  const view = String(route.data['view'] || '');
  await app.initialize();
  const context = app.context(strings(route.params), strings(route.queryParams));
  const data = await app.resolve(VIEW_RESOURCES[view] || [], context);
  window.sessionStorage.removeItem('plasticina_old');
  state.set(context, data);
  app.applyBodyClass(view);
  return { context, data };
};
