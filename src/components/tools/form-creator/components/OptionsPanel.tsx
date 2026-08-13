import React from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { SavedProject } from '../types';

interface OptionsPanelProps {
  flattenForm: boolean;
  setFlattenForm: (flatten: boolean) => void;
  onOpenSaveDialog: () => void;
  hasFields: boolean;
  savedProjects: SavedProject[];
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (projectId: string) => void;
  tTools: (key: string) => string;
}

export function OptionsPanel({
  flattenForm,
  setFlattenForm,
  onOpenSaveDialog,
  hasFields,
  savedProjects,
  onLoadProject,
  onDeleteProject,
  tTools,
}: OptionsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Flatten Form Option */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={flattenForm}
          onChange={(e) => setFlattenForm(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300"
        />
        <div>
          <span className="text-sm font-medium">
            {tTools('formCreator.flattenForm') || 'Flatten Form'}
          </span>
          <p className="text-xs text-gray-500">{tTools('formCreator.flattenFormHint')}</p>
        </div>
      </label>

      {/* Save Project */}
      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={onOpenSaveDialog}
          disabled={!hasFields}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {tTools('formCreator.saveProject') || 'Save Project'}
        </button>
      </div>

      {/* Saved Projects List */}
      {savedProjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">{tTools('formCreator.savedProjects')}</p>
          {savedProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
            >
              <div className="flex-1 min-w-0 mr-2">
                <p className="font-medium truncate">{project.name}</p>
                <p className="text-gray-400 truncate">{project.fields.length} fields</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onLoadProject(project)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
