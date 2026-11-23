(function () {
  'use strict';

  const ui = window.Plasticina.ui;
  const ENTRY_FIELD = /^entries\[([^\]]+)\]\[(\w+)\]$/;

  function field(form, name) {
    const element = form.elements[name];
    if (!element) return '';
    if (element instanceof RadioNodeList) return element.value;
    return element.value;
  }

  function entryFor(result, key) {
    let entry = result.find(function (item) { return item._key === key; });
    if (!entry) {
      entry = { _key: key };
      result.push(entry);
    }
    return entry;
  }

  function entriesFrom(form) {
    const result = [];
    const elements = form.elements;
    for (let index = 0; index < elements.length; index++) {
      const match = ENTRY_FIELD.exec(elements[index].name || '');
      if (!match) continue;
      entryFor(result, match[1])[match[2]] = elements[index].value;
    }
    return result;
  }

  Object.assign(ui, { field: field, entriesFrom: entriesFrom });
})();
