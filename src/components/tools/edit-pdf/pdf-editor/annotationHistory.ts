export interface AnnotationHistoryLabels {
  undoLabel: string;
  redoLabel: string;
  unnamedUser: string;
}

export function getAnnotationHistoryScript(labels: AnnotationHistoryLabels): string {
  return `
    function setupUndoRedoAndAuthorPatch() {
      let undoStack = [];
      let redoStack = [];
      let lastStateStr = '';
      let isDoingUndoRedo = false;
      const MAX_ANNOTATION_STEPS = 20;

      function getAnnotationsSnapshot() {
        const ext = window.pdfjsAnnotationExtensionInstance;
        if (!ext || typeof ext.getAnnotationStore !== 'function') return null;
        const store = ext.getAnnotationStore();
        if (!store) return null;
        return JSON.stringify(store);
      }

      // Initialize undo stack
      const initialState = getAnnotationsSnapshot();
      if (initialState) {
        undoStack.push(initialState);
        lastStateStr = initialState;
      }

      // Check for state changes every 1500ms (reduced from 500ms thrashing)
      setInterval(() => {
        const ext = window.pdfjsAnnotationExtensionInstance;
        if (!ext) return;

        // Dynamic author override for tool name labels in comments list
        const store = typeof ext.getAnnotationStore === 'function' ? ext.getAnnotationStore() : null;
        if (store && store.annotations) {
          store.annotations.forEach(ann => {
            const targetAuthor = (ann.name || 'Annotation') + ' (${labels.unnamedUser})';
            if (ann.author !== targetAuthor && ann.author === '${labels.unnamedUser}') {
              ann.author = targetAuthor;
            }
          });
        }

        const currentState = getAnnotationsSnapshot();
        if (currentState && currentState !== lastStateStr) {
          if (!isDoingUndoRedo) {
            undoStack.push(currentState);
            if (undoStack.length > MAX_ANNOTATION_STEPS) {
              undoStack.shift();
            }
            redoStack = [];
            updateUndoRedoButtonsState();
          }
          lastStateStr = currentState;
        }
      }, 1500);

      injectUndoRedoButtons();

      function performUndo() {
        if (undoStack.length <= 1) return;
        isDoingUndoRedo = true;
        const current = undoStack.pop();
        redoStack.push(current);
        if (redoStack.length > MAX_ANNOTATION_STEPS) redoStack.shift();
        const prev = undoStack[undoStack.length - 1];
        loadState(prev);
      }

      function performRedo() {
        if (redoStack.length === 0) return;
        isDoingUndoRedo = true;
        const next = redoStack.pop();
        undoStack.push(next);
        if (undoStack.length > MAX_ANNOTATION_STEPS) undoStack.shift();
        loadState(next);
      }

      function loadState(stateStr) {
        const ext = window.pdfjsAnnotationExtensionInstance;
        if (!ext) return;

        try {
          const stateObj = JSON.parse(stateStr);
          if (typeof ext.resetPdfjsAnnotationStorage === 'function') {
            ext.resetPdfjsAnnotationStorage();
          }
          if (typeof ext.initAnnotations === 'function') {
            ext.initAnnotations(stateObj);
          }
          if (typeof ext.reDrawAnnotation === 'function') {
            ext.reDrawAnnotation();
          }
          lastStateStr = stateStr;
          updateUndoRedoButtonsState();
        } catch (err) {
          console.error('[PDFCraft Patch] Failed to load state', err);
        } finally {
          setTimeout(() => {
            isDoingUndoRedo = false;
          }, 100);
        }
      }

      function injectUndoRedoButtons() {
        const customToolbar = document.querySelector('.CustomToolbar');
        if (customToolbar) {
          if (customToolbar.querySelector('.pdfcraft-undo-btn')) return;
          const btnList = customToolbar.querySelector('ul') || customToolbar;

          const undoLi = document.createElement('li');
          undoLi.className = 'pdfcraft-undo-btn';
          undoLi.style.cssText = 'display:inline-block; margin-right:8px;';

          const undoBtn = document.createElement('button');
          undoBtn.type = 'button';
          undoBtn.innerHTML = '<span style="margin-right:2px; font-weight:bold;">↩</span>${labels.undoLabel}';
          undoBtn.className = 'toolbarButton';
          undoBtn.style.cssText = 'padding:4px 8px; font-size:12px; cursor:pointer; border-radius:4px; opacity:0.5; border:1px solid var(--toolbar-border-color, #ccc); background-color:var(--toolbar-bg-color, #f5f5f5); color:var(--toolbar-fg-color, #333); font-family:inherit;';
          undoBtn.disabled = true;
          undoBtn.addEventListener('click', performUndo);
          undoLi.appendChild(undoBtn);

          const redoLi = document.createElement('li');
          redoLi.className = 'pdfcraft-redo-btn';
          redoLi.style.cssText = 'display:inline-block; margin-right:8px;';

          const redoBtn = document.createElement('button');
          redoBtn.type = 'button';
          redoBtn.innerHTML = '<span style="margin-right:2px; font-weight:bold;">↪</span>${labels.redoLabel}';
          redoBtn.className = 'toolbarButton';
          redoBtn.style.cssText = 'padding:4px 8px; font-size:12px; cursor:pointer; border-radius:4px; opacity:0.5; border:1px solid var(--toolbar-border-color, #ccc); background-color:var(--toolbar-bg-color, #f5f5f5); color:var(--toolbar-fg-color, #333); font-family:inherit;';
          redoBtn.disabled = true;
          redoBtn.addEventListener('click', performRedo);
          redoLi.appendChild(redoBtn);

          if (btnList.firstChild) {
            btnList.insertBefore(undoLi, btnList.firstChild);
            btnList.insertBefore(redoLi, undoLi.nextSibling);
          } else {
            btnList.appendChild(undoLi);
            btnList.appendChild(redoLi);
          }
        }
      }

      function updateUndoRedoButtonsState() {
        const undoBtn = document.querySelector('.pdfcraft-undo-btn button');
        const redoBtn = document.querySelector('.pdfcraft-redo-btn button');
        
        if (undoBtn) {
          const canUndo = undoStack.length > 1;
          undoBtn.disabled = !canUndo;
          undoBtn.style.opacity = canUndo ? '1' : '0.5';
        }
        if (redoBtn) {
          const canRedo = redoStack.length > 0;
          redoBtn.disabled = !canRedo;
          redoBtn.style.opacity = canRedo ? '1' : '0.5';
        }
      }
    }
  `;
}
