import { describe, expect, it } from 'vitest';
import { getAllTools } from '@/config/tools';
import { getToolContent } from '@/config/tool-content';

describe('tool content integrity', () => {
  it('provides fallback content for every configured tool to avoid 404 pages', () => {
    const missingTools = getAllTools()
      .map((tool) => tool.id)
      .filter((toolId) => !getToolContent('en', toolId));

    expect(missingTools).toEqual([]);
  });

  it('provides Russian content for every configured tool', () => {
    const missingTools = getAllTools()
      .map((tool) => tool.id)
      .filter((toolId) => !getToolContent('ru', toolId));

    expect(missingTools).toEqual([]);
  });

  it('keeps Chinese tool titles localized instead of falling back to English slugs', () => {
    expect(getToolContent('zh', 'merge-pdf')?.title).toBe('合并PDF');
    expect(getToolContent('zh', 'split-pdf')?.title).toBe('拆分PDF');
    expect(getToolContent('zh', 'compress-pdf')?.title).toBe('压缩PDF');
    expect(getToolContent('zh', 'edit-pdf')?.title).toBe('编辑PDF');
    expect(getToolContent('zh', 'organize-pdf')?.title).toBe('整理PDF');
    expect(getToolContent('zh', 'pdf-to-docx')?.title).toBe('PDF转Word');
  });

  it('keeps Russian tool titles localized instead of falling back to English slugs', () => {
    expect(getToolContent('ru', 'merge-pdf')?.title).toBe('Объединить PDF');
    expect(getToolContent('ru', 'split-pdf')?.title).toBe('Разделить PDF');
    expect(getToolContent('ru', 'compress-pdf')?.title).toBe('Сжать PDF');
    expect(getToolContent('ru', 'edit-pdf')?.title).toBe('Редактировать PDF');
    expect(getToolContent('ru', 'organize-pdf')?.title).toBe('Упорядочить PDF');
    expect(getToolContent('ru', 'pdf-to-docx')?.title).toBe('PDF в Word');
  });
});
