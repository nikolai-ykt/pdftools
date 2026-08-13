import { TextMatch } from '@/lib/pdf/processors/find-and-redact';

export function drawMatchHighlights(
    context: CanvasRenderingContext2D,
    matches: TextMatch[],
    previewScale: number,
    viewportHeight: number
): void {
    for (const match of matches) {
        // Convert PDF coordinates (origin bottom-left) to canvas coordinates (origin top-left)
        const x = match.x * previewScale;
        const y = (viewportHeight / previewScale - match.y - match.height) * previewScale;
        const width = match.width * previewScale;
        const height = match.height * previewScale;

        if (match.selected) {
            context.fillStyle = 'rgba(255, 0, 0, 0.3)';
        } else {
            context.fillStyle = 'rgba(255, 200, 0, 0.3)';
        }
        context.fillRect(x, y, width, height);

        context.strokeStyle = match.selected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 200, 0, 0.8)';
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);
    }
}
