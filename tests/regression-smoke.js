const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function testGlobalIncludes() {
  htmlFiles.forEach((file) => {
    const txt = read(file);
    assert(txt.includes('css/app-shell.css'), `${file}: missing app-shell.css`);
    assert(txt.includes('js/app-shell.js'), `${file}: missing app-shell.js`);
    assert(txt.includes('js/global-search.js'), `${file}: missing global-search.js`);
    assert(txt.includes('js/data-portability.js'), `${file}: missing data-portability.js`);
  });
}

function testScriptDefer() {
  htmlFiles.forEach((file) => {
    const txt = read(file);
    const scriptTags = [...txt.matchAll(/<script\s+src="[^"]+"[^>]*><\/script>/g)].map((m) => m[0]);
    scriptTags.forEach((tag) => {
      assert(/\bdefer\b/.test(tag), `${file}: script without defer -> ${tag}`);
    });
  });
}

function testWishlistCriticalUI() {
  const html = read('wishlist.html');
  assert(html.includes('id="wishlist-tab-items"'), 'wishlist: missing items tab');
  assert(html.includes('id="wishlist-tab-lists"'), 'wishlist: missing lists tab');
  assert(html.includes('id="shoppingListViewModal"'), 'wishlist: missing list view modal');
  assert(html.includes('id="shoppingListAddItemsModal"'), 'wishlist: missing add items modal');
}

function testPlannerDnDExists() {
  const js = fs.readFileSync(path.join(root, 'js', 'planejamento.js'), 'utf8');
  assert(js.includes('bindCalendarDayDropEvents'), 'planejamento: missing DnD binding');
  assert(js.includes('moveCalendarTaskToDate'), 'planejamento: missing move handler');
}

function testGlobalHotkeysExists() {
  const search = fs.readFileSync(path.join(root, 'js', 'global-search.js'), 'utf8');
  const portability = fs.readFileSync(path.join(root, 'js', 'data-portability.js'), 'utf8');
  assert(/ctrlKey|metaKey/.test(search) && /toLowerCase\(\)\s*===\s*['"]k['"]/.test(search), 'global-search: missing Ctrl+K handler');
  assert(/ctrlKey/.test(portability) && /shiftKey/.test(portability) && /toLowerCase\(\)\s*===\s*['"]b['"]/.test(portability), 'data-portability: missing Ctrl+Shift+B handler');
}

function testNoMojibakeInCriticalFiles() {
  const critical = ['biblioteca.html', path.join('js', 'index-hero-carousel.js')];
  critical.forEach((file) => {
    const txt = fs.readFileSync(path.join(root, file), 'utf8');
    assert(!/[Ã�]/.test(txt), `${file}: possible mojibake remnants`);
  });
}

function run() {
  testGlobalIncludes();
  testScriptDefer();
  testWishlistCriticalUI();
  testPlannerDnDExists();
  testGlobalHotkeysExists();
  testNoMojibakeInCriticalFiles();
  console.log('Smoke tests passed.');
}

run();
