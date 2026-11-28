(function () {
  'use strict';

  const ui = window.Plasticina.ui;
  const FLASH_KEY = 'plasticina_flash';
  const OLD_KEY = 'plasticina_old';

  function readSessionJson(key, fallback) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || fallback);
      return value === null || value === undefined ? JSON.parse(fallback) : value;
    } catch (error) {
      return JSON.parse(fallback);
    }
  }

  function flashBag() {
    const bag = readSessionJson(FLASH_KEY, '[]');
    return Array.isArray(bag) ? bag : [];
  }

  function flash(type, message) {
    const bag = flashBag();
    bag.push({ type: type, message: message });
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(bag));
  }

  function flashMarkup(item) {
    const color = item.type === 'error' || item.type === 'danger'
      ? 'bg-red-50 border-red-500 text-red-700'
      : 'bg-emerald-50 border-emerald-500 text-emerald-700';
    return '<div class="mb-5 border-l-4 ' + color + ' p-4 text-xs font-semibold rounded-r-lg">' +
      ui.h(item.message) + '</div>';
  }

  function takeFlash() {
    const bag = flashBag();
    sessionStorage.removeItem(FLASH_KEY);
    return bag.map(flashMarkup).join('');
  }

  function remember(values) {
    sessionStorage.setItem(OLD_KEY, JSON.stringify(values || {}));
  }

  function old(key, fallback) {
    const values = readSessionJson(OLD_KEY, '{}');
    if (key === undefined || key === null) return values;
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback;
  }

  Object.assign(ui, { flash: flash, takeFlash: takeFlash, remember: remember, old: old });
})();
