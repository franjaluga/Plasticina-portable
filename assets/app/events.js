(function () {
  'use strict';

  const config = window.Plasticina.app.config;
  const db = window.Plasticina.db;
  const router = window.Plasticina.app.router;
  const helpers = window.Plasticina.actions.helpers;
  const viewHelpers = window.Plasticina.views.helpers;

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
      await window.Actions[action](element);
    } catch (error) {
      UI.flash('error', error.message || String(error));
      router.render();
    } finally {
      element.dataset.executing = '';
    }
  }

  function ensureAccountSearchBindings(target) {
    if (!viewHelpers || !viewHelpers.bindAccountSearchFormsIn) return;
    const input = target && target.closest ? target.closest('[data-account-search]') : null;
    if (!input || input.__plasticinaAccountSearch) return;
    viewHelpers.bindAccountSearchFormsIn(document);
    if (input.__plasticinaAccountSearch && typeof input.__plasticinaAccountSearch.render === 'function') {
      input.__plasticinaAccountSearch.render();
    }
  }

  function ensureDropdownBindings(target) {
    if (!viewHelpers || !viewHelpers.bindDropdowns) return;
    const select = target && target.closest ? target.closest('[data-ui-select]') : null;
    if (!select || select.__plasticinaSelect) return;
    viewHelpers.bindDropdowns(document);
  }

  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onClick);
  document.addEventListener('change', function (event) {
    const source = event && event.target && typeof event.target.getAttribute === 'function' ? event.target : null;
    if (!source || source.getAttribute('data-select-all') === null) return;
    const selector = source.getAttribute('data-select-all') || '.doc-checkbox';
    const root = source.form || document;
    Array.prototype.forEach.call(root.querySelectorAll(selector), function (checkbox) {
      checkbox.checked = source.checked;
    });
  });
  document.addEventListener('focusin', function (event) {
    ensureAccountSearchBindings(event.target);
    ensureDropdownBindings(event.target);
  });
  document.addEventListener('click', function (event) {
    ensureAccountSearchBindings(event.target);
    ensureDropdownBindings(event.target);
  });
  window.addEventListener('hashchange', router.render);

  if (db.onExternalChange) {
    db.onExternalChange(function () {
      Promise.resolve(db.ensureFresh()).then(function () {
        if (window.Store) window.Store.refresh();
        if (window.Data) window.Data.invalidate();
        router.render();
      }).catch(function (error) {
        UI.flash('error', error && error.message ? error.message : String(error));
        router.render();
      });
    });
  }
})();
