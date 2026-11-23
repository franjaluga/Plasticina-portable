# Plasticina Portable

Port de escritorio de la aplicación contable Plasticina, construido únicamente con HTML, CSS y JavaScript.

- `plasticina-master/` es la aplicación Laravel/MariaDB original y la referencia visual/funcional.
- La raíz contiene el port estático: `index.html`, `assets/` y `desktop/main.js`.
- No se usa PHP ni servidor local: los datos se guardan en el almacenamiento local del navegador/Electron.
- La UI conserva las clases y textos originales; `assets/app.css` reproduce la identidad visual de Tailwind sin dependencias externas.

## Ejecutar

```bash
npm install
npm start
```

También se puede abrir `index.html` directamente en un navegador moderno.
