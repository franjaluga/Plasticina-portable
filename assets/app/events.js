(function () {
  'use strict';

  const config = window.Plasticina.app.config;
  const router = window.Plasticina.app.router;
  const helpers = window.Plasticina.actions.helpers;

  function confirmSubmission(form, button) {
    const message = button && button.getAttribute('data-confirm')
      ? button.getAttribute('data-confirm')
      : form.getAttribute('data-confirm');
    return !message || window.confirm(message);
  }

  async function onSubmit(event) {
    const form = event.target && event.target.closest
      ? event.target.closest('form[data-action]')
      : null;
    if (!form || event.defaultPrevented) return;
    event.preventDefault();
    if (!confirmSubmission(form, event.submitter)) return;
    if (form.dataset.submitting === '1') return;
    form.dataset.submitting = '1';
    try {
      const action = form.dataset.action;
      let values;
      try {
        values = helpers.readForm(form);
      } catch (error) {
        UI.flash('error', error.message || String(error));
        router.render();
        return;
      }
      const getActions = window.Plasticina.app.config.getActions;
      const getRoute = Object.prototype.hasOwnProperty.call(getActions, action) ? getActions[action] : null;

      if (getRoute) {
        const rule = config.reportPeriodRoutes[getRoute];
        if (action === 'vc_documents.tax_balance') {
          const status = Store.balancePeriodStatus(values.year, values.month);
          if (!status.allowed) {
            const statusHelp = window.Plasticina.views.helpers.balancePeriodHelp(status);
            UI.flash('error', statusHelp.text);
            router.render();
            return;
          }
        } else if (rule) {
          const status = router.validateReportPeriod(rule.kind, values);
          if (!status.allowed) {
            const statusHelp = window.Plasticina.views.helpers.reportPeriodHelp(status);
            UI.flash('error', statusHelp.text);
            router.render();
            return;
          }
        }
        UI.remember(values);
        router.navigate(UI.route(getRoute, values));
        return;
      }

      const handler = window.Actions[action];
      if (!handler) {
        UI.flash('error', 'Acción no implementada: ' + action);
        router.render();
        return;
      }

      UI.remember(values);
      await handler(form);
    } catch (error) {
      UI.flash('error', error.message || String(error));
      router.render();
    } finally {
      form.dataset.submitting = '';
    }
  }

  async function onClick(event) {
    const element = event.target.closest('[data-link-action]');
    if (!element) return;
    event.preventDefault();
    const action = element.getAttribute('data-link-action');
    if (!window.Actions[action]) return;
    if (element.dataset.executing === '1') return;
    element.dataset.executing = '1';
    try {
      await window.Actions[action]();
    } catch (error) {
      UI.flash('error', error.message || String(error));
      router.render();
    } finally {
      element.dataset.executing = '';
    }
  }

  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onClick);
  window.addEventListener('hashchange', router.render);
})();
