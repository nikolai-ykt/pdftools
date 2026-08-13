import { withBasePath } from '../../utils/path';
import type { PyodideInterface } from './types';

let pyodideInstance: PyodideInterface | null = null;
let pyodidePromise: Promise<PyodideInterface> | null = null;

export function resolvePublicAssetPath(assetPath: string): string {
  if (typeof window === 'undefined') return assetPath;

  const resolvedPath = withBasePath(assetPath);
  if (resolvedPath !== assetPath) return resolvedPath;

  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
  const nextScript = scripts.find((script) => script.src.includes('/_next/'));

  if (!nextScript) return normalizedAssetPath;

  try {
    const scriptUrl = new URL(nextScript.src);
    const nextIndex = scriptUrl.pathname.indexOf('/_next/');
    if (nextIndex <= 0) return normalizedAssetPath;

    const basePath = scriptUrl.pathname.slice(0, nextIndex).replace(/\/$/, '');
    return `${basePath}${normalizedAssetPath}`;
  } catch {
    return normalizedAssetPath;
  }
}

async function createPyodideEngine(): Promise<PyodideInterface> {
  const basePath = new URL(
    resolvePublicAssetPath('/pymupdf-wasm/'),
    window.location.origin
  ).toString();

  const pyodideModule = await import(/* webpackIgnore: true */ `${basePath}pyodide.js`);
  const loadPyodide = pyodideModule.loadPyodide;

  const pyodide: PyodideInterface = await loadPyodide({
    indexURL: basePath,
    fullStdLib: false,
  });

  const loadWheel = async (url: string) => {
    await pyodide.loadPackage(url);
  };

  pyodide.runPython(`
import sys
from types import ModuleType

# Mock tqdm (used for progress bars)
tqdm_mod = ModuleType("tqdm")
def tqdm(iterable=None, *args, **kwargs):
    return iterable if iterable else []
tqdm_mod.tqdm = tqdm
sys.modules["tqdm"] = tqdm_mod

# Mock fire (CLI tool)
fire_mod = ModuleType("fire")
sys.modules["fire"] = fire_mod
  `);

  await loadWheel(`${basePath}numpy-2.2.5-cp313-cp313-pyodide_2025_0_wasm32.whl`);
  await loadWheel(`${basePath}typing_extensions-4.12.2-py3-none-any.whl`);
  await loadWheel(`${basePath}packaging-24.1-py3-none-any.whl`);
  await loadWheel(`${basePath}fonttools-4.56.0-py3-none-any.whl`);
  await loadWheel(`${basePath}lxml-5.4.0-cp313-cp313-pyodide_2025_0_wasm32.whl`);
  await loadWheel(`${basePath}pymupdf-1.26.3-cp313-none-pyodide_2025_0_wasm32.whl`);

  await pyodide.runPythonAsync('import pymupdf');

  pyodideInstance = pyodide;
  return pyodide;
}

export function loadPyodideEngine(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return Promise.resolve(pyodideInstance);
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = createPyodideEngine().catch((err) => {
    pyodidePromise = null;
    pyodideInstance = null;
    throw err;
  });

  return pyodidePromise;
}

export function resetPyodideEngine(): void {
  pyodideInstance = null;
  pyodidePromise = null;
}
