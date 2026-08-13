import React, { useState, useRef } from 'react';
import { FilePlus2 } from 'lucide-react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddBlankPage: (position: 'before' | 'after' | 'end') => void;
  isAddingPage: boolean;
  tTools: (key: string) => string;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  onAddBlankPage,
  isAddingPage,
  tTools,
}: PageNavigationProps) {
  const [showAddPageMenu, setShowAddPageMenu] = useState(false);
  const addPageMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (addPageMenuTimerRef.current) {
      clearTimeout(addPageMenuTimerRef.current);
      addPageMenuTimerRef.current = null;
    }
    if (!isAddingPage) {
      setShowAddPageMenu(true);
    }
  };

  const handleMouseLeave = () => {
    addPageMenuTimerRef.current = setTimeout(() => {
      setShowAddPageMenu(false);
    }, 300);
  };

  return (
    <div className="flex items-center gap-1 ml-auto">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={`px-2 py-1 rounded text-sm ${
          currentPage > 1 ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        ←
      </button>
      <span className="text-sm text-gray-600 px-2">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className={`px-2 py-1 rounded text-sm ${
          currentPage < totalPages ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        →
      </button>

      {/* Add Blank Page dropdown */}
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          className={`p-1.5 rounded transition-colors ${
            isAddingPage
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={tTools('formCreator.addBlankPage') || 'Add Blank Page'}
          disabled={isAddingPage}
        >
          <FilePlus2 className="w-4 h-4" />
        </button>
        <div
          className={`absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10 transition-opacity duration-150 ${
            showAddPageMenu && !isAddingPage ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <button
            onClick={() => {
              onAddBlankPage('before');
              setShowAddPageMenu(false);
            }}
            disabled={isAddingPage}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {tTools('formCreator.addPageBefore') || 'Before current'}
          </button>
          <button
            onClick={() => {
              onAddBlankPage('after');
              setShowAddPageMenu(false);
            }}
            disabled={isAddingPage}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {tTools('formCreator.addPageAfter') || 'After current'}
          </button>
          <button
            onClick={() => {
              onAddBlankPage('end');
              setShowAddPageMenu(false);
            }}
            disabled={isAddingPage}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {tTools('formCreator.addPageEnd') || 'At end'}
          </button>
        </div>
      </div>
    </div>
  );
}
