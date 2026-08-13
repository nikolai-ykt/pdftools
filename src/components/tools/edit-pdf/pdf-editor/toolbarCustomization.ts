export interface ToolbarLabels {
  strokeColorLabel: string;
  fillColorLabel: string;
}

export function getToolbarCustomizationScript(labels: ToolbarLabels): string {
  return `
    function setupColorPickerAndStroke() {
      // 1. Inject picker for Highlight tool
      const hlColorPicker = document.getElementById('editorHighlightColorPicker');
      if (hlColorPicker && !hlColorPicker.querySelector('.pdfcraft-custom-hl-picker')) {
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.className = 'pdfcraft-custom-hl-picker';
        picker.style.cssText = 'width:28px; height:28px; border:2px solid #ccc; border-radius:50%; padding:0; cursor:pointer; margin-left:8px; vertical-align:middle; background:none;';
        
        picker.addEventListener('input', function(e) {
          const ext = window.pdfjsAnnotationExtensionInstance;
          const selected = ext?.selectedAnnotation;
          if (selected) {
            ext.updateAnnotationStyle(selected, { color: e.target.value });
          }
        });
        hlColorPicker.appendChild(picker);
      }

      // 2. Targeted MutationObserver: observe document container for .CustomAnnotationMenu appearance
      let menuObserver = null;
      const targetContainer = document.querySelector('.annotationEditorLayer') || document.body;

      function checkAndInjectMenu() {
        const menu = document.querySelector('.CustomAnnotationMenu');
        if (menu && menu.style.display !== 'none') {
          injectCustomMenuControls(menu);
        }
      }

      menuObserver = new MutationObserver(function() {
        checkAndInjectMenu();
      });

      menuObserver.observe(targetContainer, {
        childList: true,
        subtree: true,
      });
    }

    function injectCustomMenuControls(menu) {
      if (menu.querySelector('.pdfcraft-custom-controls')) return;

      console.log('[PDFCraft Patch] CustomAnnotationMenu opened, injecting custom controls...');

      const container = document.createElement('div');
      container.className = 'pdfcraft-custom-controls';
      container.style.cssText = 'border-top:1px solid #ccc; margin-top:8px; padding-top:8px; font-size:12px; display:flex; flex-direction:column; gap:8px; color:var(--toolbar-fg-color, #333);';

      const ext = window.pdfjsAnnotationExtensionInstance;
      const selected = ext?.selectedAnnotation;
      if (!selected) return;

      // 1. Custom Stroke Color Picker
      const colorRow = document.createElement('div');
      colorRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px;';
      
      const colorLabel = document.createElement('span');
      colorLabel.textContent = ${JSON.stringify(labels.strokeColorLabel)};
      
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.style.cssText = 'width:50px; height:24px; border:1px solid #ccc; border-radius:4px; padding:0; cursor:pointer;';
      colorPicker.value = selected.style?.color || '#ff0000';

      colorPicker.addEventListener('change', function(e) {
        const curSelected = window.pdfjsAnnotationExtensionInstance?.selectedAnnotation;
        if (curSelected) {
          window.pdfjsAnnotationExtensionInstance.updateAnnotationStyle(curSelected, { color: e.target.value });
        }
      });

      colorRow.appendChild(colorLabel);
      colorRow.appendChild(colorPicker);
      container.appendChild(colorRow);

      // 2. Allow stroke width of 0 by adjusting native slider min
      const nativeSliders = menu.querySelectorAll('input[type="range"]');
      nativeSliders.forEach(slider => {
        if (slider.getAttribute('min') === '1') {
          slider.setAttribute('min', '0');
        }
      });

      // 3. Shape Fill support (Rectangle, Circle, Cloud)
      const allowedFillTools = ['rectangle', 'circle', 'cloud'];
      if (allowedFillTools.includes(selected.name)) {
        const fillRow = document.createElement('div');
        fillRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px;';
        
        const leftPart = document.createElement('div');
        leftPart.style.cssText = 'display:flex; align-items:center; gap:6px;';
        
        const fillCheckbox = document.createElement('input');
        fillCheckbox.type = 'checkbox';
        fillCheckbox.id = 'pdfcraft-fill-enabled';
        fillCheckbox.style.cssText = 'cursor:pointer;';
        fillCheckbox.checked = selected.style?.fillEnabled || false;
        
        const fillLabel = document.createElement('label');
        fillLabel.htmlFor = 'pdfcraft-fill-enabled';
        fillLabel.textContent = ${JSON.stringify(labels.fillColorLabel)};
        fillLabel.style.cssText = 'cursor:pointer; user-select:none;';

        leftPart.appendChild(fillCheckbox);
        leftPart.appendChild(fillLabel);

        const fillColorPicker = document.createElement('input');
        fillColorPicker.type = 'color';
        fillColorPicker.style.cssText = 'width:50px; height:24px; border:1px solid #ccc; border-radius:4px; padding:0; cursor:pointer;';
        fillColorPicker.value = selected.style?.fillColor || '#ffffff';
        fillColorPicker.disabled = !fillCheckbox.checked;

        fillCheckbox.addEventListener('change', function(e) {
          fillColorPicker.disabled = !e.target.checked;
          const curSelected = window.pdfjsAnnotationExtensionInstance?.selectedAnnotation;
          if (curSelected) {
            window.pdfjsAnnotationExtensionInstance.updateAnnotationStyle(curSelected, {
              fillEnabled: e.target.checked,
              fillColor: fillColorPicker.value
            });
          }
        });

        fillColorPicker.addEventListener('change', function(e) {
          const curSelected = window.pdfjsAnnotationExtensionInstance?.selectedAnnotation;
          if (curSelected && fillCheckbox.checked) {
            window.pdfjsAnnotationExtensionInstance.updateAnnotationStyle(curSelected, {
              fillColor: e.target.value
            });
          }
        });

        fillRow.appendChild(leftPart);
        fillRow.appendChild(fillColorPicker);
        container.appendChild(fillRow);
      }

      const styleContainer = menu.querySelector('.styleContainer') || menu;
      styleContainer.appendChild(container);
    }
  `;
}
