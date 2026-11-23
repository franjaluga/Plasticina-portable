(function () {
  'use strict';

  const router = window.Plasticina.app.router;

  function confirmSubmission(form, button) {
    const message = button && button.getAttribute('data-confirm')
      ? button.getAttribute('data-confirm')
      : form.getAttribute('data-confirm');
    return !message || window.confirm(message);
  }

  async function onSubmit(event) {
    const form = event.target.closest('form[data-action]');
    if (!form) return;
    event.preventDefault();
    if (!confirmSubmission(form, event.submitter)) return;

    const action = form.dataset.action;
    const values = window.Actions.readForm(form);
    const getActions = window.Plasticina.app.config.getActions;
    const getRoute = Object.prototype.hasOwnProperty.call(getActions, action) ? getActions[action] : null;

    if (getRoute) {
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
    try {
      await handler(form);
    } catch (error) {
      UI.flash('error', error.message || String(error));
      router.render();
    }
  }

  function onClick(event) {
    const element = event.target.closest('[data-link-action]');
    if (!element) return;
    event.preventDefault();
    const action = element.getAttribute('data-link-action');
    if (window.Actions[action]) window.Actions[action]();
  }

  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onClick);
  window.addEventListener('hashchange', router.render);
})();
