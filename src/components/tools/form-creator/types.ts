import { FormField } from '@/lib/pdf/processors/form-creator';

export interface FormCreatorToolProps {
  className?: string;
}

export type FieldType =
  | 'text'
  | 'checkbox'
  | 'dropdown'
  | 'radio'
  | 'button'
  | 'signature'
  | 'date'
  | 'listbox';

export interface VisualField extends FormField {
  id: string;
  selected?: boolean;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: Omit<VisualField, 'id'>[];
}

export interface SavedProject {
  id: string;
  name: string;
  fileName: string;
  fields: VisualField[];
  savedAt: number;
}
