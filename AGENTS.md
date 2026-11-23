# AGENTS.md

## Workspace / misión
- La raíz es el port a escritorio de Plasticina y debe implementarse solo con HTML, CSS y JavaScript. No usar PHP en el código del port.
- `plasticina-master/` es la app Laravel/MariaDB original: referencia de comportamiento e identidad visual, pero no se modifica.
- La identidad visual debe conservarse; `assets/styles/app.css` contiene los estilos derivados de las clases Tailwind originales.

## Arquitectura del port
- `index.html` es el único documento de la app; carga los scripts en este orden: núcleo (`core/`, incluida la capa `core/db/`), datos (`data/`), almacén (`store/`), vistas (`views/`), acciones (`actions/`) y aplicación (`app/`).
- `assets/vendor/`: motor SQLite (sql.js/asm.js) empaquetado localmente; no se descarga en tiempo de ejecución.
- `assets/core/namespace.js`: espacios de nombre (`window.Plasticina`) usados por los módulos; evita colisiones entre contextos.
- `assets/core/db/`: capa SQLite. `config.js`, `driver.js` y `adapters/` abren y guardan el archivo; `schema/` contiene el DDL por tabla; `queries/` agrupa las sentencias SQL por entidad; `repositories/` ejecuta esas queries y mapea filas; `index.js` expone `window.Plasticina.db.ready`.
- `assets/core/ui/`: módulos pequeños de rutas, formato, sesión, formularios y descargas; `index.js` compone `window.UI`. Las rutas son hash (`#/...`).
- `assets/data/`: plan de cuentas sembrado y plantillas de asientos manuales.
- `assets/store/`: `context.js` mantiene una proyección en memoria hidratada desde SQLite y helpers primitivos; `masters.js`, `documents.js`, `journals.js`, `accounting.js` y `csv.js` aportan la lógica contable y delegan toda escritura a los repositorios; `index.js` publica `window.Store`.
- `assets/views/`: una vista por archivo, separada por contexto (home, ingress, reports, documents, accounting, owners, masters, system); `shared/helpers.js` contiene los helpers de render. Todas se montan en `window.Views`.
- `assets/actions/`: `helpers.js` y un archivo por contexto; se montan en `window.Actions`.
- `assets/app/`: configuración de rutas, router, eventos, exportación CSV y arranque.
- `builds/`: artefactos y scripts de empaquetado; `linux_builds/` guarda el AppImage dentro de un `.tar`, `windows_builds/` guarda el ZIP autocontenido. El staging de electron-builder va en `builds/.cache/`. La build incluye el port completo y excluye explícitamente `plasticina-master/`, `builds/`, `test/` y `node_modules/`.
- `assets/tests/`: page de pruebas (`index.html`), harness y suites por contexto; `test/run.js` ejecuta las mismas suites en Node sin dependencias.
- `desktop/main.js`: ventana Electron que carga `index.html` con `loadFile`; expone IPC para leer/escribir `plasticina.sqlite` en `userData`; no levanta servidores.

## Datos y persistencia
- No hay base de datos externa: la persistencia es un archivo SQLite real (`plasticina.sqlite`) gestionado por sql.js/asm.js.
- En Electron el archivo se guarda en `app.getPath('userData')` vía `desktop/preload.js`. Al abrir `index.html` directamente, el adaptador de navegador guarda el mismo archivo SQLite en IndexedDB (con respaldo en `localStorage` del binario si IndexedDB no está disponible).
- Toda escritura pasa por `assets/core/db/repositories/` dentro de transacciones SQLite; `Store` solo conserva una proyección en memoria para renderizar.
- El esquema replica las tablas de dominio de Laravel: owners, accounts, entities, document_types, vc_documents, journals, journal_entries, account_templates, account_template_items y settings.
- Seed inicial: owner `55555555-5` / `Test`, 161 cuentas, año de trabajo igual al año actual.

## Comandos
- Instalar y ejecutar: `npm install && npm start`.
- Empaquetar Linux (AppImage dentro de `.tar`): `npm run build:linux`.
- Empaquetar Windows (ZIP autocontenido): `npm run build:windows`.
- Empaquetado genérico / staging: `npm run dist` deja los artefactos en `builds/.cache/`.
- Pruebas: `npm test` (Node) y `npm run test:static` (Python, sin dependencias).
- También se puede abrir `index.html` directamente en un navegador moderno (la base se guarda en IndexedDB).

## Verificación
- Tras cualquier cambio, ejecutar `npm test` y `npm run test:static`; también se puede abrir `assets/tests/index.html` en el navegador.
- Si Node vuelve a estar disponible en el entorno, ejecutar además `node --check` sobre cada archivo de `assets/` y `desktop/main.js`.
- Al añadir scripts, actualizar `index.html` y `assets/tests/index.html` con el mismo orden: `test/check_static.py` verifica que coincidan.
- No generar archivos PHP ni reintroducir dependencias del servidor Laravel.
