(function () {
  'use strict';

  const ui = window.Plasticina.ui;

  function h(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') value = JSON.stringify(value);
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function json(value) {
    return JSON.stringify(value === undefined ? null : value).replace(/</g, '\\u003c');
  }

  function number(value, decimals) {
    const digits = decimals === undefined ? 0 : decimals;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value || 0));
  }

  function money(value) {
    return '$' + number(value, 0);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthName(month) {
    const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return names[Number(month) - 1] || '';
  }

  Object.assign(ui, { h: h, json: json, number: number, money: money, today: today, monthName: monthName });
})();
