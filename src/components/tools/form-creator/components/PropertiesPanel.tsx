import React from 'react';
import { VisualField, FieldType } from '../types';
import { getFieldIcon } from '../utils/formCreatorUtils';

interface PropertiesPanelProps {
  selectedField: VisualField | undefined;
  updateSelectedField: (updates: Partial<VisualField>) => void;
  onDeleteField: () => void;
  tTools: (key: string) => string;
}

export function PropertiesPanel({
  selectedField,
  updateSelectedField,
  onDeleteField,
  tTools,
}: PropertiesPanelProps) {
  if (!selectedField) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">{tTools('formCreator.noFieldSelected')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Field header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <span className="text-xl">{getFieldIcon(selectedField.type)}</span>
        <input
          type="text"
          value={selectedField.name}
          onChange={(e) => updateSelectedField({ name: e.target.value })}
          className="flex-1 px-2 py-1 text-sm font-medium border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
        />
      </div>

      {/* Type selector */}
      <select
        value={selectedField.type}
        onChange={(e) => updateSelectedField({ type: e.target.value as FieldType })}
        className="w-full px-2 py-1.5 text-sm border rounded bg-white"
      >
        <option value="text">📝 {tTools('formCreator.textFieldTool')}</option>
        <option value="checkbox">☑ {tTools('formCreator.checkboxTool')}</option>
        <option value="dropdown">▼ {tTools('formCreator.dropdownTool')}</option>
        <option value="radio">◉ {tTools('formCreator.radioTool')}</option>
        <option value="button">🔘 {tTools('formCreator.buttonTool')}</option>
        <option value="signature">✍ {tTools('formCreator.signatureTool')}</option>
        <option value="date">📅 {tTools('formCreator.dateTool')}</option>
        <option value="listbox">📋 {tTools('formCreator.listboxTool')}</option>
      </select>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium mb-1">{tTools('formCreator.fieldLabel') || 'Label'}</label>
        <input
          type="text"
          value={selectedField.label || ''}
          onChange={(e) => updateSelectedField({ label: e.target.value })}
          placeholder={tTools('formCreator.fieldLabelPlaceholder') || 'Enter label text...'}
          className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
        />
      </div>

      {/* Label Position */}
      {selectedField.label && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{tTools('formCreator.labelPosition') || 'Position'}:</span>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="radio"
              name="labelPosition"
              checked={selectedField.labelPosition !== 'left'}
              onChange={() => updateSelectedField({ labelPosition: 'above' })}
              className="w-3 h-3"
            />
            {tTools('formCreator.labelAbove') || 'Above'}
          </label>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="radio"
              name="labelPosition"
              checked={selectedField.labelPosition === 'left'}
              onChange={() => updateSelectedField({ labelPosition: 'left' })}
              className="w-3 h-3"
            />
            {tTools('formCreator.labelLeft') || 'Left'}
          </label>
        </div>
      )}

      {/* Position/Size */}
      <div className="grid grid-cols-4 gap-1">
        {(['x', 'y', 'width', 'height'] as const).map((prop, idx) => (
          <div key={prop}>
            <label className="block text-[10px] text-gray-400 uppercase">{['X', 'Y', 'W', 'H'][idx]}</label>
            <input
              type="number"
              value={Math.round(selectedField[prop] as number)}
              onChange={(e) => updateSelectedField({ [prop]: parseInt(e.target.value) || 0 })}
              className="w-full px-1 py-1 text-xs text-center border rounded"
            />
          </div>
        ))}
      </div>

      {/* Multiline for Text fields */}
      {selectedField.type === 'text' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedField.multiline || false}
            onChange={(e) => updateSelectedField({ multiline: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">{tTools('formCreator.multiline')}</span>
        </label>
      )}

      {/* Default value for text fields */}
      {selectedField.type === 'text' && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.defaultValue') || 'Default Value'}</label>
          <input
            type="text"
            value={String(selectedField.defaultValue || '')}
            onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
            placeholder={tTools('formCreator.defaultValuePlaceholder') || 'Enter default text...'}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
          />
        </div>
      )}

      {/* Default value for checkbox */}
      {selectedField.type === 'checkbox' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedField.defaultValue === true}
            onChange={(e) => updateSelectedField({ defaultValue: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">{tTools('formCreator.defaultChecked') || 'Checked by default'}</span>
        </label>
      )}

      {/* Options for dropdown, radio, listbox */}
      {(selectedField.type === 'dropdown' || selectedField.type === 'radio' || selectedField.type === 'listbox') && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.options')}</label>
          <textarea
            value={(selectedField.options || []).join('\n')}
            onChange={(e) => updateSelectedField({ options: e.target.value.split('\n').filter((o) => o.trim()) })}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
            rows={4}
          />
        </div>
      )}

      {/* Default selection for dropdown/radio/listbox */}
      {(selectedField.type === 'dropdown' || selectedField.type === 'radio' || selectedField.type === 'listbox') &&
        selectedField.options &&
        selectedField.options.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">{tTools('formCreator.defaultSelection') || 'Default Selection'}</label>
            <select
              value={String(selectedField.defaultValue || '')}
              onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
              className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
            >
              <option value="">{tTools('formCreator.noDefault') || '-- None --'}</option>
              {selectedField.options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Listbox multi-select option */}
      {selectedField.type === 'listbox' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedField.multiSelect || false}
            onChange={(e) => updateSelectedField({ multiSelect: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">{tTools('formCreator.multiSelect') || 'Allow multiple selection'}</span>
        </label>
      )}

      {/* Button label */}
      {selectedField.type === 'button' && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.buttonLabel') || 'Button Label'}</label>
          <input
            type="text"
            value={selectedField.buttonLabel || ''}
            onChange={(e) => updateSelectedField({ buttonLabel: e.target.value })}
            placeholder={tTools('formCreator.buttonLabelPlaceholder') || 'Submit'}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
          />
        </div>
      )}

      {/* Signature label */}
      {selectedField.type === 'signature' && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.signatureLabel') || 'Signature Label'}</label>
          <input
            type="text"
            value={selectedField.signatureLabel || ''}
            onChange={(e) => updateSelectedField({ signatureLabel: e.target.value })}
            placeholder={tTools('formCreator.signatureLabelPlaceholder') || 'Sign here'}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
          />
        </div>
      )}

      {/* Date format */}
      {selectedField.type === 'date' && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.dateFormat') || 'Date Format'}</label>
          <select
            value={selectedField.dateFormat || 'YYYY-MM-DD'}
            onChange={(e) => updateSelectedField({ dateFormat: e.target.value })}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
          </select>
        </div>
      )}

      {/* Date default value */}
      {selectedField.type === 'date' && (
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('formCreator.defaultDate') || 'Default Date'}</label>
          <input
            type="date"
            value={String(selectedField.defaultValue || '')}
            onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
            className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
          />
        </div>
      )}

      {/* Required field option */}
      <label className="flex items-center gap-2 pt-2 border-t border-gray-100 cursor-pointer">
        <input
          type="checkbox"
          checked={selectedField.required || false}
          onChange={(e) => updateSelectedField({ required: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm">{tTools('formCreator.required') || 'Required field'}</span>
      </label>

      <button
        onClick={onDeleteField}
        className="w-full py-1.5 text-sm text-red-500 hover:bg-red-50 rounded border border-red-200"
      >
        {tTools('formCreator.deleteField')}
      </button>
    </div>
  );
}
