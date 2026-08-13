import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormTemplate } from '../types';

interface FormTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FormTemplate) => void;
  templates: FormTemplate[];
  tTools: (key: string) => string;
}

export function FormTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  templates,
  tTools,
}: FormTemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card
        variant="outlined"
        size="lg"
        className="w-full max-w-2xl mx-4 bg-white shadow-xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-500" />
            {tTools('formCreator.chooseTemplateTitle') || 'Choose Form Template'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="p-4 border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-500">{template.fields.length} fields</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {tTools('formCreator.cancelButton') || 'Cancel'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
