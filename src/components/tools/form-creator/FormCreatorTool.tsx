'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FilePlus2, Save } from 'lucide-react';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import {
  FormCreatorToolProps,
  FormTemplate,
  SavedProject,
  VisualField,
} from './types';
import { formTemplates } from './templates';
import { BlankPdfModal, PageSizeType } from './components/BlankPdfModal';
import { FormTemplatesModal } from './components/FormTemplatesModal';
import { FormToolbar } from './components/FormToolbar';
import { PdfCanvas } from './components/PdfCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { FieldsPanel } from './components/FieldsPanel';
import { OptionsPanel } from './components/OptionsPanel';
import { formatSize } from './utils/formCreatorUtils';

import { usePdfDocument } from './hooks/usePdfDocument';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import { useFieldEditor } from './hooks/useFieldEditor';
import { useFieldDrag } from './hooks/useFieldDrag';
import { useSavedProjects } from './hooks/useSavedProjects';
import {
  createBlankPdfFile,
  createTemplatePdfFile,
  processFormPdf,
} from './services/pdfService';

export function FormCreatorTool({ className = '' }: FormCreatorToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  // Processing state
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  // Form options
  const [flattenForm, setFlattenForm] = useState(false);

  // Right panel tab state
  const [activeTab, setActiveTab] = useState<'properties' | 'fields' | 'options'>('properties');

  // Modals state
  const [showBlankPdfDialog, setShowBlankPdfDialog] = useState(false);
  const [blankPdfPageSize, setBlankPdfPageSize] = useState<PageSizeType>('A4');
  const [blankPdfPageCount, setBlankPdfPageCount] = useState(1);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('');

  const cancelledRef = useRef(false);

  // Hooks
  const {
    file,
    setFile,
    totalPages,
    currentPage,
    setCurrentPage,
    isAddingPage,
    error,
    setError,
    pdfDocRef,
    loadPdf,
    addBlankPage,
    clearPdf,
  } = usePdfDocument();

  const { canvasRef, containerRef, pageSize, scale } = usePdfRenderer(pdfDocRef, currentPage);

  const {
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    currentTool,
    setCurrentTool,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    addFieldAt,
    updateSelectedField,
    handleDeleteField,
    handleDuplicateField,
    resetHistory,
  } = useFieldEditor(file, currentPage);

  const { handleFieldMouseDown } = useFieldDrag(
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    currentTool,
    scale
  );

  const { savedProjects, saveProject, deleteProject } = useSavedProjects();

  // File upload handler
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        setResult(null);
        setFields([]);
        resetHistory([]);
        setSelectedFieldId(null);
        loadPdf(files[0]);
      }
    },
    [loadPdf, setFields, resetHistory, setSelectedFieldId]
  );

  // Clear file
  const handleClearFile = useCallback(() => {
    clearPdf();
    setResult(null);
    setStatus('idle');
    setFields([]);
    resetHistory([]);
    setSelectedFieldId(null);
  }, [clearPdf, setFields, resetHistory, setSelectedFieldId]);

  // Create blank PDF
  const handleCreateBlankPdf = useCallback(async () => {
    try {
      const pdfFile = await createBlankPdfFile(blankPdfPageSize, blankPdfPageCount);
      setFields([]);
      resetHistory([]);
      setSelectedFieldId(null);
      setResult(null);
      setStatus('idle');
      setShowBlankPdfDialog(false);
      await loadPdf(pdfFile);
    } catch (err) {
      console.error('Failed to create blank PDF:', err);
      setError('Failed to create blank PDF.');
    }
  }, [blankPdfPageSize, blankPdfPageCount, loadPdf, setFields, resetHistory, setSelectedFieldId, setError]);

  // Create form from template
  const handleCreateFromTemplate = useCallback(
    async (template: FormTemplate) => {
      try {
        const { file: pdfFile, fields: templateFields } = await createTemplatePdfFile(template);
        setFields(templateFields);
        resetHistory(templateFields);
        setSelectedFieldId(null);
        setResult(null);
        setStatus('idle');
        setShowTemplateDialog(false);
        await loadPdf(pdfFile);
      } catch (err) {
        console.error('Failed to create form from template:', err);
        setError('Failed to create form from template.');
      }
    },
    [loadPdf, setFields, resetHistory, setSelectedFieldId, setError]
  );

  // Add template fields to existing document
  const handleAddTemplateFields = useCallback(
    (template: FormTemplate) => {
      const templateFields: VisualField[] = template.fields.map((field) => ({
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pageNumber: currentPage,
      }));
      setFields((prev) => [...prev, ...templateFields]);
    },
    [currentPage, setFields]
  );

  // Save project handler
  const handleSaveProject = useCallback(() => {
    if (!file || fields.length === 0) return;
    saveProject(projectName, file.name, fields);
    setShowSaveDialog(false);
    setProjectName('');
  }, [file, fields, projectName, saveProject]);

  // Load project handler
  const handleLoadProject = useCallback(
    (project: SavedProject) => {
      setFields(project.fields);
      resetHistory(project.fields);
      setSelectedFieldId(null);
    },
    [setFields, resetHistory, setSelectedFieldId]
  );

  // Process PDF
  const handleProcess = useCallback(async () => {
    if (!file || fields.length === 0) return;

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const output = await processFormPdf(file, fields, flattenForm, (prog, message) => {
        if (!cancelledRef.current) {
          setProgress(prog);
          setProgressMessage(message || '');
        }
      });

      if (output.success && output.result) {
        setResult(output.result as Blob);
        setStatus('complete');
      } else {
        setError(output.error?.message || 'Failed to create form.');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus('error');
    }
  }, [file, fields, flattenForm, setError]);

  const isProcessing = status === 'processing';
  const selectedField = fields.find((f) => f.id === selectedFieldId);
  const currentPageFields = fields.filter((f) => f.pageNumber === currentPage);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {!file && (
        <div className="space-y-4">
          <FileUploader
            accept={['application/pdf', '.pdf']}
            multiple={false}
            maxFiles={1}
            onFilesSelected={handleFilesSelected}
            onError={setError}
            disabled={isProcessing}
            label={tTools('formCreator.uploadLabel') || 'Upload PDF File'}
            description={tTools('formCreator.uploadDescription') || 'Drag and drop a PDF file here.'}
          />

          {/* Or create blank PDF */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">{tTools('formCreator.orCreateBlank') || 'Or'}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={() => setShowBlankPdfDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <FilePlus2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">
              {tTools('formCreator.createBlankPdf') || 'Create Blank PDF'}
            </span>
          </button>

          {/* Templates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {formTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleCreateFromTemplate(template)}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-xs font-medium text-gray-600 text-center group-hover:text-blue-600">
                  {tTools(`formCreator.template.${template.id}`) || template.name}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center">
            {tTools('formCreator.templateHint') || 'Or choose a template to get started quickly'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          {/* Visual Editor */}
          <div className="space-y-2">
            <FormToolbar
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              formTemplates={formTemplates}
              onSelectTemplate={handleAddTemplateFields}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              selectedFieldId={selectedFieldId}
              onDuplicateField={handleDuplicateField}
              onDeleteField={handleDeleteField}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onAddBlankPage={(pos) => addBlankPage(pos, fields, setFields)}
              isAddingPage={isAddingPage}
              tTools={tTools}
            />

            <PdfCanvas
              containerRef={containerRef}
              canvasRef={canvasRef}
              currentPageFields={currentPageFields}
              pageSize={pageSize}
              scale={scale}
              selectedFieldId={selectedFieldId}
              currentTool={currentTool}
              currentPage={currentPage}
              onAddFieldAt={addFieldAt}
              onFieldClick={(e, id) => {
                e.stopPropagation();
                if (currentTool === 'select') {
                  setSelectedFieldId(id);
                }
              }}
              onFieldMouseDown={handleFieldMouseDown}
              tTools={tTools}
            />
          </div>

          {/* Right Panel - Tabbed Interface */}
          <div
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            {/* Header with file info */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatSize(file.size)} • {totalPages} {tTools('formCreator.pages') || 'pages'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFile}
                disabled={isProcessing}
                className="shrink-0 ml-2"
              >
                ✕
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tTools('formCreator.properties') || 'Properties'}
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'fields'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tTools('formCreator.fieldsTab') || 'Fields'} ({fields.length})
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'options'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tTools('formCreator.optionsTab') || 'Options'}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'properties' && (
                <PropertiesPanel
                  selectedField={selectedField}
                  updateSelectedField={updateSelectedField}
                  onDeleteField={handleDeleteField}
                  tTools={tTools}
                />
              )}

              {activeTab === 'fields' && (
                <FieldsPanel
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(id, pageNum) => {
                    setSelectedFieldId(id);
                    setCurrentPage(pageNum);
                    setActiveTab('properties');
                  }}
                  tTools={tTools}
                />
              )}

              {activeTab === 'options' && (
                <OptionsPanel
                  flattenForm={flattenForm}
                  setFlattenForm={setFlattenForm}
                  onOpenSaveDialog={() => setShowSaveDialog(true)}
                  hasFields={fields.length > 0}
                  savedProjects={savedProjects}
                  onLoadProject={handleLoadProject}
                  onDeleteProject={deleteProject}
                  tTools={tTools}
                />
              )}
            </div>

            {/* Action Button */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="primary"
                size="md"
                onClick={handleProcess}
                disabled={isProcessing || fields.length === 0}
                className="w-full"
              >
                {isProcessing
                  ? tTools('formCreator.processingButton') || 'Processing...'
                  : tTools('formCreator.createButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={() => {
            cancelledRef.current = true;
            setStatus('idle');
          }}
          showPercentage
        />
      )}

      {/* Success Message & Download */}
      {status === 'complete' && result && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-700">
            {tTools('formCreator.successMessage') || 'Form created successfully!'}
          </p>
          <DownloadButton
            file={result}
            filename={file?.name.replace('.pdf', '_form.pdf') || 'form.pdf'}
            variant="secondary"
            size="sm"
            showFileSize
          />
        </div>
      )}

      {/* Save Project Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card variant="outlined" size="lg" className="w-full max-w-md mx-4 bg-white shadow-xl">
            <h3 className="text-lg font-medium mb-4">
              {tTools('formCreator.saveProjectTitle') || 'Save Project'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tTools('formCreator.projectName') || 'Project Name'}
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={tTools('formCreator.projectNamePlaceholder') || 'Enter project name...'}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>{tTools('formCreator.saveInfo', { fields: fields.length })}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setProjectName('');
                  }}
                >
                  {tTools('formCreator.cancelButton') || 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProject}
                  disabled={fields.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {tTools('formCreator.saveButton') || 'Save'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Form Templates Modal */}
      <FormTemplatesModal
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelectTemplate={handleCreateFromTemplate}
        templates={formTemplates}
        tTools={tTools}
      />

      {/* Create Blank PDF Dialog */}
      <BlankPdfModal
        isOpen={showBlankPdfDialog}
        pageSize={blankPdfPageSize}
        setPageSize={(size) => setBlankPdfPageSize(size)}
        pageCount={blankPdfPageCount}
        setPageCount={setBlankPdfPageCount}
        onClose={() => {
          setShowBlankPdfDialog(false);
          setBlankPdfPageSize('A4');
          setBlankPdfPageCount(1);
        }}
        onCreate={handleCreateBlankPdf}
        tTools={tTools}
      />
    </div>
  );
}

export type { FormCreatorToolProps } from './types';
export default FormCreatorTool;
