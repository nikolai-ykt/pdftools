import type { PyodideInterface, DeskewOptions, DeskewResult, DeskewDetail } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function deskewPdf(
  pyodide: PyodideInterface,
  file: File,
  options?: DeskewOptions
): Promise<DeskewResult> {
  const { threshold = 0.5, dpi = 150 } = options || {};

  return withInputFile(pyodide, file, 'deskew', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_deskew_${uid}.pdf`;

    const rawJsonResult = await pyodide.runPythonAsync(`
import pymupdf
import numpy as np
import json
import math

def detect_skew_angle(pix, threshold=0.5, max_angle=10):
    samples = pix.samples
    width = pix.width
    height = pix.height
    n = pix.n
    
    img_array = np.frombuffer(samples, dtype=np.uint8)
    
    if n == 1:
        img = img_array.reshape(height, width)
    elif n == 3:
        img = img_array.reshape(height, width, n)
        img = np.dot(img[...,:3], [0.299, 0.587, 0.114]).astype(np.uint8)
    elif n == 4:
        img = img_array.reshape(height, width, n)
        img = np.dot(img[...,:3], [0.299, 0.587, 0.114]).astype(np.uint8)
    else:
        img = img_array.reshape(height, width, n)
        img = img[:,:,0]
    
    hist, _ = np.histogram(img.flatten(), bins=256, range=(0, 256))
    total_pixels = img.size
    
    sum_total = sum(i * hist[i] for i in range(256))
    sum_background = 0
    weight_background = 0
    max_variance = 0
    otsu_threshold = 0
    
    for i in range(256):
        weight_background += hist[i]
        if weight_background == 0:
            continue
        
        weight_foreground = total_pixels - weight_background
        if weight_foreground == 0:
            break
        
        sum_background += i * hist[i]
        mean_background = sum_background / weight_background
        mean_foreground = (sum_total - sum_background) / weight_foreground
        
        variance = weight_background * weight_foreground * (mean_background - mean_foreground) ** 2
        
        if variance > max_variance:
            max_variance = variance
            otsu_threshold = i
    
    binary = (img > otsu_threshold).astype(np.uint8) * 255
    
    angle_range = np.linspace(-max_angle, max_angle, int(max_angle * 4 + 1))
    variances = []
    
    for angle in angle_range:
        angle_rad = math.radians(angle)
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        
        if abs(angle) < 0.5:
            projection = np.sum(binary, axis=1)
        else:
            h_new = int(abs(height * cos_a) + abs(width * sin_a))
            projection = np.zeros(h_new)
            
            for y in range(0, height, max(1, height // 200)):
                for x in range(0, width, max(1, width // 200)):
                    if binary[y, x] > 128:
                        x_rot = int((x - width/2) * cos_a - (y - height/2) * sin_a + width/2)
                        y_rot = int((x - width/2) * sin_a + (y - height/2) * cos_a + height/2)
                        
                        y_new = int(y_rot * h_new / height)
                        if 0 <= y_new < h_new:
                            projection[y_new] += 1
        
        variance = np.var(projection)
        variances.append(variance)
    
    best_idx = np.argmax(variances)
    detected_angle = angle_range[best_idx]
    max_var = variances[best_idx]
    baseline_var = variances[len(variances) // 2]
    
    if baseline_var > 0 and (max_var - baseline_var) / baseline_var > threshold / 10:
        return detected_angle
    else:
        return 0.0

def rotate_page(page, angle):
    if abs(angle) < 0.1:
        return False
    
    if abs(angle % 90) < 0.1:
        rotation = int(round(angle / 90) * 90) % 360
        page.set_rotation(rotation)
        return True
    else:
        if abs(angle) >= 0.5:
            rotation = int(round(angle))
            if abs(rotation) >= 1:
                current_rotation = page.rotation
                new_rotation = (current_rotation - rotation) % 360
                page.set_rotation(new_rotation)
                return True
        return False

doc = pymupdf.open(${JSON.stringify(inputPath)})
angles = []
corrected = []

for page in doc:
    try:
        pix = page.get_pixmap(dpi=${dpi})
        angle = detect_skew_angle(pix, threshold=${threshold}, max_angle=10)
        angles.append(float(angle))
        
        if abs(angle) >= 0.3:
            was_corrected = rotate_page(page, angle)
            corrected.append(was_corrected)
        else:
            corrected.append(False)
    except Exception:
        angles.append(0.0)
        corrected.append(False)

doc.save(${JSON.stringify(outputPath)})
doc.close()

json.dumps({
    "totalPages": len(angles),
    "correctedPages": sum(corrected),
    "angles": angles,
    "corrected": corrected
})
    `);

    const resultData = JSON.parse(rawJsonResult) as DeskewDetail;

    try {
      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf, result: resultData };
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
