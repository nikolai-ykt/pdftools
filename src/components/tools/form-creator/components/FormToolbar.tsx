import React from 'react';
import { Undo2, Redo2, Copy, Trash2 } from 'lucide-react';
import { FieldType, VisualField, FormTemplate } from '../types';
import { PageNavigation } from './PageNavigation';

interface FormToolbarProps {
  currentTool: FieldType | 'select';
  setCurrentTool: (tool: FieldType | 'select') => void;
  formTemplates: FormTemplate[];
  onSelectTemplate: (template: FormTemplate) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedFieldId: string | null;
  onDuplicateField: () => void;
  onDeleteField: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddBlankPage: (position: 'before' | 'after' | 'end') => void;
  isAddingPage: boolean;
  tTools: (key: string) => string;
}

export function FormToolbar({
  currentTool,
  setCurrentTool,
  formTemplates,
  onSelectTemplate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedFieldId,
  onDuplicateField,
  onDeleteField,
  currentPage,
  totalPages,
  onPageChange,
  onAddBlankPage,
  isAddingPage,
  tTools,
}: FormToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tool Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">{tTools('formCreator.addField') || 'Add'}:</span>
        <select
          value={currentTool}
          onChange={(e) => setCurrentTool(e.target.value as FieldType | 'select')}
          className="px-2 py-1.5 text-sm border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="select">↖ {tTools('formCreator.selectTool')}</option>
          <optgroup label={tTools('formCreator.basicTools') || 'Basic'}>
            <option value="text">📝 {tTools('formCreator.textFieldTool')}</option>
            <option value="checkbox">☑ {tTools('formCreator.checkboxTool')}</option>
            <option value="dropdown">▼ {tTools('formCreator.dropdownTool')}</option>
            <option value="radio">◉ {tTools('formCreator.radioTool')}</option>
          </optgroup>
          <optgroup label={tTools('formCreator.advancedTools') || 'Advanced'}>
            <option value="button">🔘 {tTools('formCreator.buttonTool')}</option>
            <option value="signature">✍ {tTools('formCreator.signatureTool')}</option>
            <option value="date">📅 {tTools('formCreator.dateTool')}</option>
            <option value="listbox">📋 {tTools('formCreator.listboxTool')}</option>
          </optgroup>
        </select>
      </div>

      {/* Template Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">{tTools('formCreator.templates') || 'Template'}:</span>
        <select
          value=""
          onChange={(e) => {
            const templateId = e.target.value;
            if (templateId) {
              const template = formTemplates.find((t) => t.id === templateId);
              if (template) {
                onSelectTemplate(template);
              }
              e.target.value = '';
            }
          }}
          className="px-2 py-1.5 text-sm border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{tTools('formCreator.selectTemplate') || 'Select...'}</option>
          {formTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.icon} {tTools(`formCreator.template.${template.id}`) || template.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-colors ${
            canUndo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
          }`}
          title={tTools('formCreator.undo') || 'Undo'}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-colors ${
            canRedo ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
          }`}
          title={tTools('formCreator.redo') || 'Redo'}
        >
          <Redo2 className="w-4 h-4" />
        </button>
        {selectedFieldId && (
          <>
            <button
              onClick={onDuplicateField}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              title={tTools('formCreator.duplicate') || 'Duplicate'}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteField}
              className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
              title={tTools('formCreator.deleteTool') || 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Page Navigation */}
      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onAddBlankPage={onAddBlankPage}
        isAddingPage={isAddingPage}
        tTools={tTools}
      />
    </div>
  );
}
