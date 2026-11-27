const fs = require('fs');
const path = require('path');

const browserDir = path.join(__dirname, '..', 'dist', 'angular-shell', 'browser');
const indexPath = path.join(browserDir, 'index.html');
const generatedChunk = /^(?:main|polyfills|chunk|runtime)-.+\.js$/;
const wrapperStart = '(function(){\n';
const wrapperEnd = '\n})();\n';

if (!fs.existsSync(indexPath)) {
  console.error('No se encontró el index.html generado: ' + indexPath);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const withoutModules = html.replace(/\s+type="module"/g, '');
const scriptSources = [...withoutModules.matchAll(/<script\s+src="([^"]+\.js)"><\/script>/g)]
  .map((match) => match[1]);

let wrapped = 0;
for (const source of scriptSources) {
  if (/^(?:https?:)?\/\//.test(source) || !generatedChunk.test(path.basename(source))) continue;
  const file = path.join(browserDir, source);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const code = fs.readFileSync(file, 'utf8');
  if (code.startsWith(wrapperStart) && code.trimEnd().endsWith('})();')) continue;
  fs.writeFileSync(file, wrapperStart + code + wrapperEnd);
  wrapped += 1;
}

if (withoutModules !== html || wrapped > 0) {
  fs.writeFileSync(indexPath, withoutModules);
}

if (wrapped > 0) {
  console.log('OK: se eliminaron los atributos type="module" y se aislaron ' + wrapped + ' chunks para file://');
} else if (withoutModules !== html) {
  console.log('OK: se eliminaron los atributos type="module" para file://');
} else {
  console.log('OK: el bundle ya es compatible con file://');
}
