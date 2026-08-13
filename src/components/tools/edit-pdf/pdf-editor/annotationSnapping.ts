/**
 * PDFCraft Konva Snapping Alignment Module
 * Optimizes snapping calculations by caching target shape bounding boxes on dragstart
 * and updating persistent guide line DOM elements instead of re-creating DOM nodes per frame.
 */
export function getAnnotationSnappingScript(): string {
  return `
    function setupSnapping() {
      const ext = window.pdfjsAnnotationExtensionInstance;
      const stage = ext?.stage || ext?.konvaStage || (window.Konva && window.Konva.stages[0]);
      if (!stage) return;
      
      console.log('[PDFCraft Patch] Setting up Konva Snapping Alignment (Optimized)...');
      
      let cachedBoxes = [];
      let guideLinesContainer = null;
      let vGuide = null;
      let hGuide = null;

      function ensureGuideElements(stg) {
        if (!guideLinesContainer) {
          guideLinesContainer = document.getElementById('pdfcraft-alignment-guides');
          if (!guideLinesContainer) {
            guideLinesContainer = document.createElement('div');
            guideLinesContainer.id = 'pdfcraft-alignment-guides';
            guideLinesContainer.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:99999;';
            stg.container().appendChild(guideLinesContainer);
          }
        }
        if (!vGuide) {
          vGuide = document.createElement('div');
          vGuide.style.cssText = 'position:absolute; top:0; bottom:0; border-left:1.5px dashed red; display:none;';
          guideLinesContainer.appendChild(vGuide);
        }
        if (!hGuide) {
          hGuide = document.createElement('div');
          hGuide.style.cssText = 'position:absolute; left:0; right:0; border-top:1.5px dashed red; display:none;';
          guideLinesContainer.appendChild(hGuide);
        }
      }

      stage.on('dragstart', function(e) {
        const activeShape = e.target;
        if (!activeShape || activeShape === stage) return;
        
        // Cache other shape bounding boxes once when drag starts
        const shapes = stage.find('.annotation') || stage.find('Group') || stage.getChildren();
        cachedBoxes = [];
        shapes.forEach(shape => {
          if (shape === activeShape || shape.name() === 'guideline') return;
          const box = shape.getClientRect();
          if (box) cachedBoxes.push(box);
        });

        ensureGuideElements(stage);
      });

      stage.on('dragmove', function(e) {
        const activeShape = e.target;
        if (!activeShape || activeShape === stage) return;
        
        const snapOffset = 8;
        let snapX = null;
        let snapY = null;
        
        const activeBox = activeShape.getClientRect();
        if (!activeBox) return;

        for (let i = 0; i < cachedBoxes.length; i++) {
          const box = cachedBoxes[i];
          
          // X-axis alignment
          if (Math.abs(activeBox.x - box.x) < snapOffset) snapX = box.x;
          if (Math.abs((activeBox.x + activeBox.width/2) - (box.x + box.width/2)) < snapOffset) {
            snapX = box.x + box.width/2 - activeBox.width/2;
          }
          if (Math.abs((activeBox.x + activeBox.width) - (box.x + box.width)) < snapOffset) {
            snapX = box.x + box.width - activeBox.width;
          }
          
          // Y-axis alignment
          if (Math.abs(activeBox.y - box.y) < snapOffset) snapY = box.y;
          if (Math.abs((activeBox.y + activeBox.height/2) - (box.y + box.height/2)) < snapOffset) {
            snapY = box.y + box.height/2 - activeBox.height/2;
          }
          if (Math.abs((activeBox.y + activeBox.height) - (box.y + box.height)) < snapOffset) {
            snapY = box.y + box.height - activeBox.height;
          }
        }
        
        if (snapX !== null) activeShape.x(snapX);
        if (snapY !== null) activeShape.y(snapY);
        
        updateGuides(stage, snapX, snapY);
      });
      
      stage.on('dragend', function() {
        clearGuides();
        cachedBoxes = [];
      });
      
      function updateGuides(stg, sx, sy) {
        ensureGuideElements(stg);

        if (sx !== null) {
          vGuide.style.left = sx + 'px';
          vGuide.style.display = 'block';
        } else {
          vGuide.style.display = 'none';
        }

        if (sy !== null) {
          hGuide.style.top = sy + 'px';
          hGuide.style.display = 'block';
        } else {
          hGuide.style.display = 'none';
        }
      }
      
      function clearGuides() {
        if (vGuide) vGuide.style.display = 'none';
        if (hGuide) hGuide.style.display = 'none';
      }
    }
  `;
}
