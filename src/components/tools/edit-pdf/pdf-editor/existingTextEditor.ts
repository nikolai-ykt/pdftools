export interface ExistingTextEditorLabels {
  tool: string;
  heading: string;
  original: string;
  replacement: string;
  apply: string;
  confirm: string;
  cancel: string;
  hint: string;
  overflow: string;
  fit: string;
  preserve: string;
  shrink: string;
  expand: string;
  signature: string;
}

export function getExistingTextEditorScript(labels: ExistingTextEditorLabels): string {
  return `
    function setupExistingTextEditing() {
      if (document.getElementById('pdfcraft-edit-existing-text')) return;
      const toolbar = document.querySelector('.CustomToolbar ul.buttons');
      if (!toolbar) return;

      const labels = ${JSON.stringify(labels)};

      const item = document.createElement('li');
      item.id = 'pdfcraft-edit-existing-text';
      item.title = labels.tool;
      item.innerHTML =
        '<div class="icon"><span role="img" aria-label="' + labels.tool + '"' +
        ' style="font-size:18px;font-weight:700;line-height:1">T✎</span></div>' +
        '<div class="name">' + labels.tool + '</div>';

      const selectItem = toolbar.querySelector('li[title="Select"]');
      if (selectItem?.nextSibling) {
        toolbar.insertBefore(item, selectItem.nextSibling);
      } else {
        toolbar.insertBefore(item, toolbar.firstChild);
      }

      const style = document.createElement('style');
      style.id = 'pdfcraft-existing-text-styles';
      style.textContent = \`
        body.pdfcraft-text-edit-mode .textLayer { pointer-events: auto !important; }
        body.pdfcraft-text-edit-mode .textLayer span {
          cursor: text !important;
          pointer-events: auto !important;
          border-radius: 2px;
          transition: outline-color .12s, background .12s;
        }
        body.pdfcraft-text-edit-mode .textLayer span:hover {
          outline: 2px solid #2563eb !important;
          background: rgba(37, 99, 235, .14) !important;
        }
        #pdfcraft-edit-existing-text.pdfcraft-active {
          background: rgba(37, 99, 235, .18) !important;
          color: #2563eb !important;
        }
        #pdfcraft-text-edit-hint {
          position: fixed; left: 50%; top: 74px; transform: translateX(-50%);
          z-index: 100000; padding: 7px 12px; border-radius: 999px;
          color: white; background: #1d4ed8; box-shadow: 0 5px 18px rgba(0,0,0,.2);
          font: 500 12px/1.2 system-ui, sans-serif; pointer-events: none;
        }
        #pdfcraft-text-edit-popover {
          position: fixed; z-index: 100001; width: min(380px, calc(100vw - 24px));
          padding: 14px; border: 1px solid #cbd5e1; border-radius: 10px;
          background: white; color: #0f172a; box-shadow: 0 16px 40px rgba(15,23,42,.28);
          font: 13px/1.4 system-ui, sans-serif;
        }
        #pdfcraft-text-edit-popover textarea {
          box-sizing: border-box; width: 100%; min-height: 62px; resize: vertical;
          margin-top: 4px; padding: 8px; border: 1px solid #94a3b8; border-radius: 6px;
          color: #0f172a; background: white; font: inherit;
        }
        #pdfcraft-text-edit-popover .pdfcraft-actions {
          display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;
        }
        #pdfcraft-text-edit-popover button {
          padding: 6px 11px; border: 1px solid #94a3b8; border-radius: 6px;
          cursor: pointer; background: white; color: #0f172a; font: inherit;
        }
        #pdfcraft-text-edit-popover button[data-action="apply"] {
          border-color: #2563eb; background: #2563eb; color: white;
        }
        #pdfcraft-text-edit-popover .pdfcraft-overflow {
          display: none; margin-top: 8px; padding: 7px 8px; border-radius: 6px;
          color: #92400e; background: #fffbeb; border: 1px solid #fde68a;
        }
        #pdfcraft-text-edit-popover select {
          box-sizing: border-box; width: 100%; margin-top: 4px; padding: 7px;
          border: 1px solid #94a3b8; border-radius: 6px; background: white;
        }
        .pdfcraft-live-text-preview {
          outline: 2px dashed #16a34a !important;
          background: rgba(22, 163, 74, .10) !important;
        }
      \`;
      document.head.appendChild(style);

      let active = false;
      let popover = null;
      let previewSpan = null;
      let previewOriginalText = '';

      function restorePreview() {
        if (previewSpan) {
          previewSpan.textContent = previewOriginalText;
          previewSpan.classList.remove('pdfcraft-live-text-preview');
        }
        previewSpan = null;
        previewOriginalText = '';
      }

      function closePopover(restore = true) {
        if (restore) restorePreview();
        if (popover) popover.remove();
        popover = null;
      }

      function setActive(nextActive) {
        active = nextActive;
        document.body.classList.toggle('pdfcraft-text-edit-mode', active);
        item.classList.toggle('pdfcraft-active', active);
        closePopover();

        document.getElementById('pdfcraft-text-edit-hint')?.remove();
        if (active) {
          const hint = document.createElement('div');
          hint.id = 'pdfcraft-text-edit-hint';
          hint.textContent = labels.hint;
          document.body.appendChild(hint);
        }
      }

      item.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        setActive(!active);
      });

      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && (active || popover)) {
          if (popover) closePopover();
          else setActive(false);
        }
      });

      document.addEventListener('click', async function(event) {
        if (!active) return;
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const span = target.closest('.textLayer span');
        if (!span || !span.textContent?.trim()) return;

        event.preventDefault();
        event.stopPropagation();

        const pageElement = span.closest('.page');
        const pageNumber = Number(pageElement?.getAttribute('data-page-number'));
        const app = window.PDFViewerApplication;
        const pageView = app?.pdfViewer?.getPageView(pageNumber - 1);
        const pdfPage = pageView?.pdfPage;
        if (!pageElement || !pageNumber || !pdfPage) return;

        const viewport = pdfPage.getViewport({ scale: 1 });
        const pageRect = pageElement.getBoundingClientRect();
        const textRect = span.getBoundingClientRect();
        const originalWidth = textRect.width;
        const originalHeight = textRect.height;
        const x = (textRect.left - pageRect.left) / pageRect.width * viewport.width;
        const top = (textRect.top - pageRect.top) / pageRect.height * viewport.height;
        const width = textRect.width / pageRect.width * viewport.width;
        const height = textRect.height / pageRect.height * viewport.height;
        const y = viewport.height - top - height;

        closePopover();
        previewSpan = span;
        previewOriginalText = span.textContent;
        popover = document.createElement('div');
        popover.id = 'pdfcraft-text-edit-popover';
        popover.innerHTML =
          '<strong>' + labels.heading + '</strong>' +
          '<div style="margin-top:8px;color:#64748b">' + labels.original + '</div>' +
          '<div style="max-height:48px;overflow:auto">' +
            span.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
          '</div>' +
          '<label style="display:block;margin-top:8px">' + labels.replacement +
            '<textarea></textarea>' +
          '</label>' +
          '<div class="pdfcraft-overflow" role="status">' + labels.overflow + '</div>' +
          '<label style="display:block;margin-top:8px">' + labels.fit +
            '<select data-fit-mode>' +
              '<option value="preserve">' + labels.preserve + '</option>' +
              '<option value="shrink">' + labels.shrink + '</option>' +
              '<option value="expand">' + labels.expand + '</option>' +
            '</select>' +
          '</label>' +
          '<div style="margin-top:8px;color:#92400e;font-size:11px">' + labels.signature + '</div>' +
          '<div class="pdfcraft-actions">' +
            '<button type="button" data-action="cancel">' + labels.cancel + '</button>' +
            '<button type="button" data-action="apply">' + labels.apply + '</button>' +
          '</div>';

        const left = Math.min(Math.max(12, textRect.left), window.innerWidth - 392);
        const topPosition = Math.min(
          window.innerHeight - 245,
          Math.max(90, textRect.bottom + 8)
        );
        popover.style.left = left + 'px';
        popover.style.top = topPosition + 'px';
        document.body.appendChild(popover);

        const textarea = popover.querySelector('textarea');
        textarea.value = span.textContent;
        textarea.focus();
        textarea.select();
        const overflowNotice = popover.querySelector('.pdfcraft-overflow');

        function updatePreview() {
          span.textContent = textarea.value;
          span.classList.add('pdfcraft-live-text-preview');
          const previewRect = span.getBoundingClientRect();
          const lineCount = Math.max(1, textarea.value.split(/\\r?\\n/).length);
          const overflow = previewRect.width > originalWidth + 1 ||
            lineCount * originalHeight > originalHeight + 1;
          overflowNotice.style.display = overflow ? 'block' : 'none';
        }
        textarea.addEventListener('input', updatePreview);
        updatePreview();

        popover.querySelector('[data-action="cancel"]').addEventListener('click', closePopover);
        popover.querySelector('[data-action="apply"]').addEventListener('click', function() {
          const newText = textarea.value;
          if (newText === previewOriginalText) {
            closePopover();
            return;
          }

          const applyButton = popover.querySelector('[data-action="apply"]');
          applyButton.disabled = true;
          applyButton.textContent = '…';
          window.parent.postMessage({
            type: 'pdfcraft:replace-existing-text',
            payload: {
              page: pageNumber,
              text: previewOriginalText,
              replacementText: newText,
              fitMode: popover.querySelector('[data-fit-mode]').value,
              x, y, width, height
            }
          }, window.location.origin);
          closePopover(false);
        });
      }, true);
    }
  `;
}
