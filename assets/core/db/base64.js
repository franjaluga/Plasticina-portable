(function () {
  'use strict';

  function toBase64(bytes) {
    let binary = '';
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let index = 0; index < view.length; index += 0x8000) {
      binary += String.fromCharCode.apply(null, view.subarray(index, index + 0x8000));
    }
    return window.btoa(binary);
  }

  function fromBase64(value) {
    const binary = window.atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  window.Plasticina.db.internals.base64 = { toBase64: toBase64, fromBase64: fromBase64 };
})();
