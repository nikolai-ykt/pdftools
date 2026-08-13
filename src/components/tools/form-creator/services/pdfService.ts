import { PDFDocument, PageSizes } from 'pdf-lib';
import { createForm, FormField } from '@/lib/pdf/processors/form-creator';
import type { ProcessOutput } from '@/types/pdf';
import { VisualField, FormTemplate } from '../types';
import { generateId } from '../utils/formCreatorUtils';

export type PageSizeType = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';

export async function createBlankPdfFile(
  pageSize: PageSizeType,
  pageCount: number
): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  const pageSizeMap: Record<string, [number, number]> = {
    A4: PageSizes.A4,
    Letter: PageSizes.Letter,
    Legal: PageSizes.Legal,
    A3: PageSizes.A3,
    A5: PageSizes.A5,
  };

  const size = pageSizeMap[pageSize] || PageSizes.A4;

  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage(size);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const fileName = `blank_form_${pageSize}_${pageCount}p.pdf`;
  return new File([blob], fileName, { type: 'application/pdf' });
}

export async function createTemplatePdfFile(template: FormTemplate): Promise<{
  file: File;
  fields: VisualField[];
}> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage(PageSizes.A4);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const fileName = `${template.id}_form.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const fields: VisualField[] = template.fields.map((field) => ({
    ...field,
    id: generateId(),
  }));

  return { file, fields };
}

export async function addPageToPdfFile(
  file: File,
  currentPage: number,
  position: 'before' | 'after' | 'end',
  fields: VisualField[]
): Promise<{
  newFile: File;
  updatedFields: VisualField[];
  newPageNum: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const pageIndex = currentPage > 0 ? currentPage - 1 : 0;
  const currentPdfPage = pdfDoc.getPage(pageIndex);
  const { width, height } = currentPdfPage.getSize();

  let insertIndex: number;
  if (position === 'before') {
    insertIndex = pageIndex;
  } else if (position === 'after') {
    insertIndex = currentPage;
  } else {
    insertIndex = pdfDoc.getPageCount();
  }

  pdfDoc.insertPage(insertIndex, [width, height]);

  let updatedFields = fields;
  if (position !== 'end') {
    updatedFields = fields.map((field) => {
      if (field.pageNumber > insertIndex) {
        return { ...field, pageNumber: field.pageNumber + 1 };
      }
      return field;
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const newFile = new File([blob], file.name, { type: 'application/pdf' });

  let newPageNum: number;
  if (position === 'before' || position === 'after') {
    newPageNum = insertIndex + 1;
  } else {
    newPageNum = pdfDoc.getPageCount();
  }

  return { newFile, updatedFields, newPageNum };
}

export async function processFormPdf(
  file: File,
  fields: VisualField[],
  flattenForm: boolean,
  onProgress?: (progress: number, message?: string) => void
): Promise<ProcessOutput> {
  const formFields: FormField[] = fields.map(({ id, selected, ...field }) => field);
  return await createForm(file, { fields: formFields, flattenForm }, onProgress);
}
