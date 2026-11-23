(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const FIELD_ARRAY = /\]$/;

  function readForm(form) {
    const result = {};
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index];
      if (!element.name || element.type === 'file') continue;
      if (element.type === 'checkbox') {
        readCheckbox(result, element);
        continue;
      }
      if (element.type === 'radio' && !element.checked) continue;
      result[element.name] = element.value;
    }
    return result;
  }

  function readCheckbox(result, element) {
    if (FIELD_ARRAY.test(element.name)) {
      if (!Array.isArray(result[element.name])) result[element.name] = [];
      if (element.checked) result[element.name].push(element.value);
      return;
    }
    result[element.name] = element.checked ? element.value : '';
  }

  function grouped(form, prefix) {
    const result = [];
    const pattern = new RegExp('^' + prefix + '\\[([^\\]]+)\\]\\[(\\w+)\\]$');
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index];
      const match = pattern.exec(element.name || '');
      if (!match) continue;
      itemFor(result, match[1])[match[2]] = element.value;
    }
    return result;
  }

  function itemFor(result, key) {
    let item = result.find(function (entry) { return entry._key === key; });
    if (!item) {
      item = { _key: key };
      result.push(item);
    }
    return item;
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function integer(value) {
    return Math.trunc(number(value));
  }

  function afterSuccess(message, routeName, parameters) {
    UI.flash('success', message);
    if (routeName) {
      window.location.hash = UI.route(routeName, parameters);
    } else if (window.App) {
      window.App.render();
    }
  }

  function fail(error, values) {
    UI.remember(values || {});
    UI.flash('error', error && error.message ? error.message : String(error));
    if (window.App) window.App.render();
  }

  function run(form, callback) {
    const values = readForm(form);
    UI.remember(values);
    try {
      callback(values);
    } catch (error) {
      fail(error, values);
    }
  }

  Object.assign(helpers, { readForm: readForm, grouped: grouped, number: number,
                           integer: integer, afterSuccess: afterSuccess, fail: fail, run: run });
})();
