(function () {
  'use strict';

  const tests = [];

  function test(name, callback) {
    tests.push({ name: name, callback: callback });
  }

  function fail(message) {
    throw new Error(message || 'Afirmación fallida.');
  }

  function assert(condition, message) {
    if (!condition) fail(message);
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      fail((message || 'Valores distintos') + ': esperado ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
    }
  }

  function assertDeepEqual(actual, expected, message) {
    const left = JSON.stringify(actual);
    const right = JSON.stringify(expected);
    if (left !== right) {
      fail((message || 'Estructuras distintas') + ': esperado ' + right + ', obtenido ' + left);
    }
  }

  function assertIncludes(text, fragment, message) {
    if (String(text).indexOf(String(fragment)) === -1) {
      fail((message || 'No se encontró el fragmento') + ': ' + String(fragment));
    }
  }

  function assertThrows(callback, message) {
    let thrown = null;
    try {
      callback();
    } catch (error) {
      thrown = error;
    }
    if (!thrown) fail(message || 'Se esperaba una excepción.');
    return thrown;
  }

  function resetStore() {
    Store.reset();
  }

  function run() {
    const results = [];
    tests.forEach(function (item) {
      try {
        item.callback();
        results.push({ name: item.name, ok: true });
      } catch (error) {
        results.push({ name: item.name, ok: false, error: error && error.message ? error.message : String(error) });
      }
    });

    const failed = results.filter(function (result) { return !result.ok; });
    const report = document.getElementById('results');
    if (report) {
      report.innerHTML = results.map(function (result) {
        const status = result.ok ? 'OK' : 'FAIL';
        const detail = result.ok ? '' : '<pre>' + String(result.error).replace(/</g, '&lt;') + '</pre>';
        return '<div class="case ' + (result.ok ? 'ok' : 'fail') + '"><strong>' + status + '</strong> ' +
          String(result.name).replace(/</g, '&lt;') + detail + '</div>';
      }).join('');
    }
    window.__TEST_RESULTS__ = results;
    return results;
  }

  window.PlasticinaTest = {
    test: test,
    run: run,
    assert: assert,
    assertEqual: assertEqual,
    assertDeepEqual: assertDeepEqual,
    assertIncludes: assertIncludes,
    assertThrows: assertThrows,
    resetStore: resetStore
  };
})();
