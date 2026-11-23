(function () {
  'use strict';

  const ui = window.Plasticina.ui;
  const NOTIFICATION_ID = 'plasticina-notifications';
  let lastNotification = null;

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
  }

  function notificationHost() {
    if (!document || !document.body) return null;
    let host = document.getElementById(NOTIFICATION_ID);
    if (host) return host;
    host = document.createElement('div');
    host.id = NOTIFICATION_ID;
    host.setAttribute('style', 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:min(420px,calc(100vw - 32px));');
    document.body.appendChild(host);
    return host;
  }

  function notify(message, type) {
    const text = message === null || message === undefined ? '' : String(message);
    lastNotification = text;
    const host = notificationHost();
    if (!host) return null;
    const color = type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#dc2626';
    const item = document.createElement('div');
    item.setAttribute('role', 'alert');
    item.setAttribute('style', 'display:flex;align-items:flex-start;gap:12px;background:#ffffff;border-left:4px solid ' + color + ';color:#111827;padding:12px 14px;border-radius:8px;box-shadow:0 10px 25px rgba(15,23,42,0.18);font:600 13px/1.4 system-ui,sans-serif;');
    const content = document.createElement('span');
    content.textContent = text;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Cerrar notificación');
    close.setAttribute('style', 'background:transparent;border:0;color:#6b7280;font-size:18px;line-height:1;cursor:pointer;padding:0;');
    item.appendChild(content);
    item.appendChild(close);
    host.appendChild(item);
    let dismissed = false;
    const timer = setTimeout(function () {
      if (!dismissed && host.removeChild) host.removeChild(item);
      dismissed = true;
    }, 6000);
    close.onclick = function () {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      if (host.removeChild) host.removeChild(item);
    };
    return timer;
  }

  ui.download = download;
  ui.notify = notify;
  ui.lastNotification = function () { return lastNotification; };
})();
