#!/usr/bin/env python3
"""Comprobaciones estáticas del port cuando Node no está disponible."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
REGEX_PREFIXES = set('=(:,![{;?&|+-*~^%')
REGEX_KEYWORDS = {'return', 'typeof', 'case', 'delete', 'void', 'in', 'of', 'new', 'yield', 'await', 'instanceof'}
NATIVE_ALERT = re.compile(r'\b(?:window\.)?alert\s*\(')


def fail(message):
    print('FAIL ' + message)
    return False


def skip_regex(text, index):
    in_class = False
    index += 1
    while index < len(text):
        char = text[index]
        if char == '\\':
            index += 2
            continue
        if char == '[':
            in_class = True
        elif char == ']':
            in_class = False
        elif char == '/' and not in_class:
            index += 1
            while index < len(text) and text[index].isalpha():
                index += 1
            return index
        elif char == '\n':
            return index
        index += 1
    return index


def strip_and_balance(text):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    quote = None
    comment = None
    previous = ''
    index = 0
    while index < len(text):
        char = text[index]
        following = text[index + 1] if index + 1 < len(text) else ''
        if comment == 'line':
            if char == '\n':
                comment = None
            index += 1
            continue
        if comment == 'block':
            if char == '*' and following == '/':
                comment = None
                index += 2
                continue
            index += 1
            continue
        if quote:
            if char == '\\':
                index += 2
                continue
            if char == quote:
                quote = None
                previous = char
            index += 1
            continue
        if char == '/' and following == '/':
            comment = 'line'
            index += 2
            continue
        if char == '/' and following == '*':
            comment = 'block'
            index += 2
            continue
        word_start = index
        while word_start > 0 and text[word_start - 1].isspace():
            word_start -= 1
        while word_start > 0 and (text[word_start - 1].isalnum() or text[word_start - 1] == '_'):
            word_start -= 1
        previous_word = text[word_start:index].strip()
        if char == '/' and (previous in REGEX_PREFIXES or previous == '' or previous_word in REGEX_KEYWORDS):
            index = skip_regex(text, index)
            previous = '/'
            continue
        if char in ('"', "'", '`'):
            quote = char
        elif char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack.pop() != pairs[char]:
                return 'delimitador inesperado: ' + char + ' en línea ' + str(text.count('\n', 0, index) + 1)
        if not char.isspace():
            previous = char
        index += 1
    if quote:
        return 'cadena sin cerrar: ' + quote + ' desde línea ' + str(text.count('\n', 0, index) + 1)
    if stack:
        return 'delimitador sin cerrar: ' + stack[-1]
    return None


def main():
    ok = True
    index_html = (ROOT / 'index.html').read_text(encoding='utf-8')
    scripts = re.findall(r'<script\s+src="assets/([^"]+)"></script>', index_html)
    if not scripts:
        ok = fail('index.html no declara scripts')
    if len(scripts) != len(set(scripts)):
        ok = fail('index.html repite scripts')
    for script in scripts:
        if not (ASSETS / script).is_file():
            ok = fail('falta el script ' + script)

    tests_html = (ASSETS / 'tests' / 'index.html').read_text(encoding='utf-8')
    test_scripts = [src[3:] for src in re.findall(r'<script\s+src="(\.\./[^"]+\.js)"></script>', tests_html)
                    if src.startswith('../') and 'tests/' not in src and 'specific-test/' not in src]
    test_scripts = [src[len('assets/'):] if src.startswith('assets/') else src for src in test_scripts]
    if test_scripts != scripts:
        ok = fail('tests/index.html no carga los mismos scripts que index.html')

    suites = ['harness.js', 'suites/core.test.js', 'suites/store.test.js', 'suites/views.test.js',
              'suites/app.test.js', 'suites/actions.test.js', 'specific-test/owners/owners.test.js',
              'specific-test/period/period.test.js']
    for suite in suites:
        if ('"tests/' + suite + '"' not in tests_html and suite not in tests_html):
            ok = fail('tests/index.html no carga ' + suite)
        if suite not in (ROOT / 'test' / 'run.js').read_text(encoding='utf-8'):
            ok = fail('test/run.js no carga ' + suite)

    js_paths = list(ASSETS.rglob('*.js')) + list((ROOT / 'specific-test').rglob('*.js'))
    for path in sorted(js_paths):
        source = path.read_text(encoding='utf-8')
        problem = strip_and_balance(source)
        if problem:
            ok = fail(str(path.relative_to(ROOT)) + ': ' + problem)
        if NATIVE_ALERT.search(source):
            ok = fail(str(path.relative_to(ROOT)) + ': usa alert() del navegador')

    main_source = (ROOT / 'desktop' / 'main.js').read_text(encoding='utf-8')
    for token in ('sqlite:acquire-lock', 'sqlite:release-lock', 'notifyDatabaseChanged'):
        if token not in main_source:
            ok = fail('desktop/main.js no coordina escrituras concurrentes: ' + token)

    driver_source = (ASSETS / 'core' / 'db' / 'driver.js').read_text(encoding='utf-8')
    for token in ('adapter.withLock', 'adapter.read()', 'adapter.write('):
        if token not in driver_source:
            ok = fail('core/db/driver.js no serializa transacciones: ' + token)

    browser_source = (ASSETS / 'core' / 'db' / 'adapters' / 'browser.js').read_text(encoding='utf-8')
    for token in ('navigator.locks.request', 'withLeaseLock', 'onChanged'):
        if token not in browser_source:
            ok = fail('adaptador browser no coordina pestañas: ' + token)

    helpers_source = (ASSETS / 'views' / 'shared' / 'helpers.js').read_text(encoding='utf-8')
    picker_source = (ASSETS / 'views' / 'shared' / 'account-picker.js').read_text(encoding='utf-8')
    for token in ('bindAccountSearchFormsIn', 'data-account-picker'):
        if token not in helpers_source:
            ok = fail('helpers.js no expone el selector de cuentas: ' + token)
    for token in ('data-account-picker', 'account-suggestions',
                  "panel.addEventListener('mousedown'", "input.addEventListener('keydown'",
                  "input.addEventListener('input'", "document.addEventListener('pointerdown'"):
        if token not in picker_source:
            ok = fail('account-picker.js no concentra el autocompletado: ' + token)
    for token in ("input.addEventListener('focus'", "input.addEventListener('click'", 'this.select()'):
        if token in picker_source:
            ok = fail('account-picker.js no debe abrir ni seleccionar al enfocar: ' + token)
    router_source = (ASSETS / 'app' / 'router.js').read_text(encoding='utf-8')
    if 'bindAccountSearchFormsIn(app)' not in router_source:
        ok = fail('router.js no enlaza los campos de cuenta tras renderizar')
    events_source = (ASSETS / 'app' / 'events.js').read_text(encoding='utf-8')
    if 'viewHelpers.bindAccountSearchFormsIn(document)' not in events_source:
        ok = fail('events.js no tiene enlace delegado de cuentas')

    pending_source = (ASSETS / 'views' / 'documents' / 'pending.js').read_text(encoding='utf-8')
    for token in ("custom_net_account[' + doc.id + '][code]", "picker: 'code'",
                  'emptyLabel: ', 'Cuenta Neto', 'colspan="9"', 'overflow-x-auto', 'min-width:1080px'):
        if token not in pending_source:
            ok = fail('La vista de pendientes no usa cuenta por documento: ' + token)
    if 'name="custom_net_account"' in pending_source:
        ok = fail('La vista de pendientes conserva el campo global de cuenta')
    helpers_source = (ASSETS / 'views' / 'shared' / 'helpers.js').read_text(encoding='utf-8')
    if 'const searchMarker = codeOnly ?' not in helpers_source:
        ok = fail('helpers.js no distingue el campo de código del buscador legacy')

    batch_source = (ASSETS / 'actions' / 'documents.js').read_text(encoding='utf-8')
    for token in ("grouped(form, 'custom_net_account')", 'accountByDocument', 'Store.batchProcess(ids, accountByDocument'):
        if token not in batch_source:
            ok = fail('documents.batch no agrupa las cuentas por documento: ' + token)

    styles = (ASSETS / 'styles' / 'app.css').read_text(encoding='utf-8')
    if 'z-index:10000' not in styles:
        ok = fail('app.css no eleva las sugerencias de cuentas sobre los elementos fijos')
    for token in ('.debit-input[type=number]::-webkit-inner-spin-button',
                  '.debit-input[type=number]::-webkit-outer-spin-button',
                  '.credit-input[type=number]::-webkit-inner-spin-button',
                  '.credit-input[type=number]::-webkit-outer-spin-button',
                  '-moz-appearance:textfield', 'appearance:textfield'):
        if token not in styles:
            ok = fail('app.css no oculta los spinner de Debe/Haber: ' + token)

    config = (ASSETS / 'app' / 'config.js').read_text(encoding='utf-8')
    view_names = set(re.findall(r"view: '([^']+)'", config))
    view_sources = ''.join(path.read_text(encoding='utf-8') for path in (ASSETS / 'views').rglob('*.js'))
    registered_views = set(re.findall(r'window\.Views\.(\w+)\s*=', view_sources))
    missing_views = view_names - registered_views
    if missing_views:
        ok = fail('vistas sin registrar: ' + ', '.join(sorted(missing_views)))

    action_suite = (ASSETS / 'tests' / 'suites' / 'actions.test.js').read_text(encoding='utf-8')
    expected_block = action_suite.split('EXPECTED_ACTIONS = [', 1)[1].split('];', 1)[0]
    expected_actions = re.findall(r"'([a-z_]+\.[a-z_]+)'", expected_block)
    action_sources = ''.join(path.read_text(encoding='utf-8') for path in (ASSETS / 'actions').glob('*.js'))
    registered_actions = set(re.findall(r"window\.Actions\['([^']+)'\]", action_sources))
    missing_actions = [name for name in expected_actions if name not in registered_actions]
    if missing_actions:
        ok = fail('acciones sin registrar: ' + ', '.join(missing_actions))

    facade = (ASSETS / 'store' / 'index.js').read_text(encoding='utf-8')
    facade_names = set(re.findall(r'^\s{4}(\w+):', facade, re.MULTILINE))
    internals = ''.join(path.read_text(encoding='utf-8') for path in (ASSETS / 'store').glob('*.js'))
    exported = re.findall(r'Object\.assign\(s, \{([^}]+)\}\)', internals, re.DOTALL)
    exported_names = set()
    for group in exported:
        exported_names.update(name.strip() for name in group.split(','))
    if not facade_names <= exported_names:
        ok = fail('Store expone métodos inexistentes: ' + ', '.join(sorted(facade_names - exported_names)))

    legacy = ['assets/ui.js', 'assets/seed.js', 'assets/store.js', 'assets/views-basic.js',
              'assets/views-accounting.js', 'assets/views-owners.js', 'assets/views-masters.js',
              'assets/actions.js', 'assets/app.js']
    for name in legacy:
        if (ROOT / name).exists():
            ok = fail('queda el archivo aglomerado ' + name)

    create_view = (ASSETS / 'views' / 'documents' / 'create.js').read_text(encoding='utf-8')
    if 'return `' in create_view:
        markup = create_view.split('return `', 1)[1].split('<script>', 1)[0]
        for helper in ('selected', 'value'):
            used = helper + "('" in markup
            declared = re.search(r'\bfunction\s+' + helper + r'\s*\(', create_view) is not None
            if used and not declared:
                ok = fail('assets/views/documents/create.js usa ' + helper + '() sin declararlo')

    angular_dir = ROOT / 'angular-shell'
    output_index = angular_dir / 'dist' / 'angular-shell' / 'browser' / 'index.html'
    if output_index.exists():
        generated = output_index.read_text(encoding='utf-8')
        if '<app-root></app-root>' not in generated:
            ok = fail('el index Angular generado no contiene app-root')
        if 'type="module"' in generated:
            ok = fail('el index Angular generado no es compatible con file://')
        if 'assets/core/db/index.js' not in generated:
            ok = fail('el index Angular generado no carga el núcleo SQLite')
        for token in ('assets/views/', 'assets/actions/'):
            if token in generated:
                ok = fail('el index Angular generado todavía carga scripts legacy: ' + token)
        for legacy_dir in ('views', 'actions'):
            if (output_index.parent / 'assets' / legacy_dir).exists():
                ok = fail('el bundle Angular todavía empaqueta assets/' + legacy_dir)
        for script in re.findall(r'<script\s+src="([^"]+\.js)"></script>', generated):
            if not re.match(r'(?:main|polyfills|chunk|runtime)-.+\.js$', Path(script).name):
                continue
            chunk = output_index.parent / script
            if not chunk.is_file():
                ok = fail('falta el chunk generado ' + script)
            elif not chunk.read_text(encoding='utf-8').startswith('(function(){\n'):
                ok = fail('el chunk generado no está aislado del ámbito global: ' + script)
        angular_main_source = (angular_dir / 'src' / 'main.ts').read_text(encoding='utf-8')
        if '@angular/compiler' in angular_main_source:
            ok = fail('main.ts importa @angular/compiler; el bundle no debe incluir el compilador JIT')
    else:
        ok = fail('falta el index Angular generado; ejecuta npm run build:shell')

    resolver_source = (angular_dir / 'src' / 'app' / 'core' / 'view-data.resolver.ts').read_text(encoding='utf-8')
    if "removeItem('plasticina_old')" in resolver_source:
        ok = fail('el resolver borra plasticina_old antes de renderizar la vista')
    app_component_source = (angular_dir / 'src' / 'app' / 'app.component.ts').read_text(encoding='utf-8')
    navigation_end = app_component_source.find('instanceof NavigationEnd')
    old_clear = app_component_source.find("removeItem('plasticina_old')")
    if navigation_end < 0 or old_clear < navigation_end:
        ok = fail('plasticina_old debe limpiarse después de NavigationEnd')
    session_source = (ASSETS / 'core' / 'ui' / 'session.js').read_text(encoding='utf-8')
    old_function = session_source.split('function old(key, fallback) {', 1)[1].split('\n  }', 1)[0]
    if 'removeItem' in old_function:
        ok = fail('UI.old consume la bolsa al leerla')

    angular_sources = ''.join(
        path.read_text(encoding='utf-8')
        for path in (angular_dir / 'src' / 'app').rglob('*')
        if path.suffix in ('.ts', '.html')
    )
    for token in ('window.Views', 'window.Actions', 'window.Plasticina.views',
                  'window.Plasticina.actions', 'DynamicViewComponent'):
        if token in angular_sources:
            ok = fail('la app Angular todavía usa una fachada legacy: ' + token)

    routes_file = angular_dir / 'src' / 'app' / 'app.routes.ts'
    if routes_file.exists():
        route_source = routes_file.read_text(encoding='utf-8')
        view_count = route_source.count('...view(')
        if view_count != 36:
            ok = fail('Angular declara ' + str(view_count) + ' vistas; se esperaban 36')

    desktop_main = (ROOT / 'desktop' / 'main.js').read_text(encoding='utf-8')
    if 'angular-shell' not in desktop_main or 'RENDERER_INDEX' not in desktop_main:
        ok = fail('Electron no carga el documento Angular generado')

    package = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    packaged = package.get('build', {}).get('files', [])
    if not any('angular-shell/dist/angular-shell/browser' in item for item in packaged):
        ok = fail('electron-builder no incluye el bundle Angular')

    print('OK comprobaciones estáticas' if ok else 'Hay errores estáticos')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
