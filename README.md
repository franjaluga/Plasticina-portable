# Plasticina Portable

Port de escritorio de la aplicación contable Plasticina, construido únicamente con HTML, CSS y JavaScript.

- `plasticina-master/` es la aplicación Laravel/MariaDB original y la referencia visual/funcional.
- La raíz contiene el port estático: `index.html`, `assets/` y `desktop/main.js`.
- No se usa PHP ni servidor local: los datos se guardan en el almacenamiento local del navegador/Electron.
- La UI conserva las clases y textos originales; `assets/styles/app.css` reproduce la identidad visual de Tailwind sin dependencias externas.

## Estructura de `assets/`

- `core/namespace.js`: espacios de nombre compartidos (`window.Plasticina`).
- `core/ui/`: rutas, formato, sesión, formularios y descargas; compone `window.UI`.
- `data/`: plan de cuentas y plantillas de asientos sembradas.
- `store/`: contexto de estado, maestros, documentos, asientos, contabilidad, CSV y fachada `window.Store`.
- `views/`: una vista por archivo, agrupada por contexto (inicio, ingreso, reportes, documentos, contabilidad, owners, maestros, sistema).
- `actions/`: helpers de formulario y un módulo por grupo de acciones; registros en `window.Actions`.
- `app/`: configuración de rutas, router, eventos, exportación CSV y arranque.
- `tests/`: página y suites de pruebas ejecutables en el navegador.

## Ejecutar

```bash
npm install
npm start
```

También se puede abrir `index.html` directamente en un navegador moderno.

## Pruebas

```bash
npm test          # requiere Node; carga los mismos scripts que index.html en un DOM simulado
npm run test:static  # comprobaciones de estructura y sintaxis sin dependencias
```

También se puede abrir `assets/tests/index.html` en el navegador para ver el resultado de cada caso.
