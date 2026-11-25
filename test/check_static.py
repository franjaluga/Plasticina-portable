#!/usr/bin/env python3
"""Comprobaciones estáticas del port cuando Node no está disponible."""
from pathlib import Path
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

    print('OK comprobaciones estáticas' if ok else 'Hay errores estáticos')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
