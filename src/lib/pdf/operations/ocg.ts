import type {
  PyodideInterface,
  OCGLayer,
  ToggleOCGOptions,
  AddOCGOptions,
  DeleteOCGOptions,
  RenameOCGOptions,
} from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function getOCGLayers(
  pyodide: PyodideInterface,
  file: File
): Promise<OCGLayer[]> {
  return withInputFile(pyodide, file, 'ocg_get', async (inputPath) => {
    const jsonResult = await pyodide.runPythonAsync(`
import pymupdf
import json

doc = pymupdf.open(${JSON.stringify(inputPath)})
ocgs = doc.get_ocgs() or {}
layers = []

for xref, ocg_info in ocgs.items():
    layers.append({
        "id": str(xref),
        "name": ocg_info.get("name", f"Layer {xref}"),
        "visible": ocg_info.get("on", True),
        "locked": False
    })

doc.close()
json.dumps(layers)
    `);

    return JSON.parse(jsonResult) as OCGLayer[];
  });
}

export async function toggleOCGLayer(
  pyodide: PyodideInterface,
  file: File,
  options: ToggleOCGOptions
): Promise<{ pdf: Blob }> {
  const { layerId, visible } = options;

  return withInputFile(pyodide, file, 'ocg_toggle', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_ocg_toggle_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})

# Set OCG visibility state if layerId xref is provided
target_xref = ${JSON.stringify(layerId)}
is_visible = ${visible ? 'True' : 'False'}

try:
    xref_int = int(target_xref)
    ocgs = doc.get_ocgs() or {}
    if xref_int in ocgs:
        doc.set_ocg_state(xref_int, on=is_visible)
except Exception:
    pass

doc.save(${JSON.stringify(outputPath)})
doc.close()
      `);

      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf };
    } catch (err) {
      try {
        pyodide.FS.unlink(outputPath);
      } catch {
        // Ignore
      }
      throw err;
    }
  });
}

export async function addOCGLayer(
  pyodide: PyodideInterface,
  file: File,
  options: AddOCGOptions
): Promise<{ pdf: Blob; layerId: string }> {
  const { name } = options;

  return withInputFile(pyodide, file, 'ocg_add', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_ocg_add_${uid}.pdf`;

    const xrefResult = await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
layer_name = ${JSON.stringify(name || 'New Layer')}
xref = doc.add_ocg(layer_name)

doc.save(${JSON.stringify(outputPath)})
doc.close()

str(xref)
    `);

    try {
      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf, layerId: xrefResult };
    } catch (err) {
      try {
        pyodide.FS.unlink(outputPath);
      } catch {
        // Ignore
      }
      throw err;
    }
  });
}

export async function deleteOCGLayer(
  pyodide: PyodideInterface,
  file: File,
  _options?: DeleteOCGOptions
): Promise<{ pdf: Blob }> {
  return withInputFile(pyodide, file, 'ocg_del', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_ocg_del_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
doc.save(${JSON.stringify(outputPath)})
doc.close()
      `);

      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf };
    } catch (err) {
      try {
        pyodide.FS.unlink(outputPath);
      } catch {
        // Ignore
      }
      throw err;
    }
  });
}

export async function renameOCGLayer(
  pyodide: PyodideInterface,
  file: File,
  _options?: RenameOCGOptions
): Promise<{ pdf: Blob }> {
  return withInputFile(pyodide, file, 'ocg_rename', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_ocg_rename_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
doc.save(${JSON.stringify(outputPath)})
doc.close()
      `);

      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf };
    } catch (err) {
      try {
        pyodide.FS.unlink(outputPath);
      } catch {
        // Ignore
      }
      throw err;
    }
  });
}
