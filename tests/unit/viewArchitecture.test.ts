import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, 'src');
const VIEWS_ROOT = path.join(SRC_ROOT, 'views');
const COMPONENTS_ROOT = path.join(VIEWS_ROOT, 'components');
const LAYOUTS_ROOT = path.join(VIEWS_ROOT, 'layouts');

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
  }));
  return nested.flat();
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function relativePath(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function getImportSpecifiers(source: string): string[] {
  return Array.from(source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g), (match) => match[1]);
}

function getMaxScssSelectorNesting(source: string): number {
  const sanitized = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['"])(?:\\.|(?!\1).)*\1/g, '');
  const selectorDepthStack = [0];
  let prelude = '';
  let maxDepth = 0;

  for (const character of sanitized) {
    if (character === '{') {
      const isAtRule = prelude.trim().startsWith('@');
      const depth = selectorDepthStack[selectorDepthStack.length - 1] + (isAtRule ? 0 : 1);
      selectorDepthStack.push(depth);
      maxDepth = Math.max(maxDepth, depth);
      prelude = '';
    } else if (character === '}') {
      selectorDepthStack.pop();
      prelude = '';
    } else if (character === ';') {
      prelude = '';
    } else {
      prelude += character;
    }
  }

  return maxDepth;
}

test('aucun type any ne peut être réintroduit dans le code source', async () => {
  const files = (await listFiles(SRC_ROOT)).filter((file) => /\.tsx?$/.test(file));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (/\bany\b/.test(source)) violations.push(relativePath(file));
  }

  assert.deepEqual(violations, []);
});

test('les views ne dépendent jamais directement des services contexts ou du routage', async () => {
  const files = (await listFiles(VIEWS_ROOT)).filter((file) => /\.tsx?$/.test(file));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const specifier of getImportSpecifiers(source)) {
      if (
        specifier.includes('/API/services')
        || specifier.includes('/context/')
        || specifier === 'react-router-dom'
      ) {
        violations.push(`${relativePath(file)} -> ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('DashboardPage délègue toute son orchestration au hook dédié', async () => {
  const dashboardPath = path.join(LAYOUTS_ROOT, 'dashboardPage', 'DashboardPage.tsx');
  const source = await readFile(dashboardPath, 'utf8');

  assert.equal(source.includes('useDashboardPage'), true);
  assert.equal(/\buse(?:Effect|Memo|Ref|State)\b/.test(source), false);
  assert.equal(/\b(?:useCampaign|useDialer|useNavigation|useToast|useDashboardData)\b/.test(source), false);
  assert.equal(/\b(?:requestNextProspect|loadCampaign|clearProchainProspect)\b/.test(source), false);
});

test('les imports publics des views passent par leur index.ts', async () => {
  const files = (await listFiles(VIEWS_ROOT)).filter((file) => /\.tsx?$/.test(file));
  const publicLayerMarkers = ['/hooks/', '/utils/types/', '/utils/scripts/', '/utils/constants/'];
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const specifier of getImportSpecifiers(source)) {
      if (publicLayerMarkers.some((marker) => specifier.includes(marker)) && !/\/index\.ts$/.test(specifier)) {
        violations.push(`${relativePath(file)} -> ${specifier}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('chaque module component et layout possède un barrel local agrégé', async () => {
  for (const layerRoot of [COMPONENTS_ROOT, LAYOUTS_ROOT]) {
    const globalIndex = await readFile(path.join(layerRoot, 'index.ts'), 'utf8');
    const directories = (await readdir(layerRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const directory of directories) {
      const moduleRoot = path.join(layerRoot, directory);
      const moduleFiles = (await listFiles(moduleRoot)).filter((file) => file.endsWith('.tsx'));
      if (moduleFiles.length === 0) continue;

      const localIndexPath = path.join(moduleRoot, 'index.ts');
      assert.equal(await pathExists(localIndexPath), true, `${relativePath(moduleRoot)} doit contenir index.ts`);
      const localIndex = await readFile(localIndexPath, 'utf8');

      for (const moduleFile of moduleFiles) {
        assert.equal(
          localIndex.includes(`./${path.basename(moduleFile)}`),
          true,
          `${relativePath(moduleFile)} doit être exporté par ${relativePath(localIndexPath)}`,
        );
      }

      assert.equal(
        globalIndex.includes(`./${directory}/index.ts`),
        true,
        `${relativePath(localIndexPath)} doit être agrégé par ${relativePath(path.join(layerRoot, 'index.ts'))}`,
      );
    }
  }
});

test('les classes SCSS n utilisent jamais l esperluette et restent à trois niveaux', async () => {
  const files = (await listFiles(SRC_ROOT)).filter((file) => file.endsWith('.scss'));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    if (/(^|[\s,{])&(?=[\w.#:[-])/m.test(withoutComments)) {
      violations.push(`${relativePath(file)} (esperluette)`);
    }
    const nesting = getMaxScssSelectorNesting(source);
    if (nesting > 3) violations.push(`${relativePath(file)} (${nesting} niveaux)`);
  }

  assert.deepEqual(violations, []);
});

test('le manifeste de routes reste identique au point de départ de la refactorisation', async () => {
  const source = await readFile(path.join(SRC_ROOT, 'App.tsx'), 'utf8');
  const routes = Array.from(source.matchAll(/<Route\s+path=["']([^"']+)["']/g), (match) => match[1]);

  assert.deepEqual(routes, ['/login', '/', '/prospect/:id', '/plan-appel', '/objections']);
});
