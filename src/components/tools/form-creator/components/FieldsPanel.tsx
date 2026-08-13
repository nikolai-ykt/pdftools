import React from 'react';
import { VisualField } from '../types';
import { getFieldIcon } from '../utils/formCreatorUtils';

interface FieldsPanelProps {
  fields: VisualField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string, pageNumber: number) => void;
  tTools: (key: string) => string;
}

export function FieldsPanel({
  fields,
  selectedFieldId,
  onSelectField,
  tTools,
}: FieldsPanelProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">{tTools('formCreator.noFieldsYet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <div
          key={field.id}
          onClick={() => onSelectField(field.id, field.pageNumber)}
          className={`
            p-2 rounded cursor-pointer text-sm flex items-center justify-between
            ${
              field.id === selectedFieldId
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          <span className="flex items-center gap-1">
            <span>{getFieldIcon(field.type)}</span>
            <span className="truncate">{field.name}</span>
          </span>
          <span className="text-xs text-gray-400 shrink-0">P{field.pageNumber}</span>
        </div>
      ))}
    </div>
  );
}
