'use client';

import React, { useState } from 'react';
import { useDarkMode } from '@/app/DarkModeContext';
import Editor from './Editor';

interface EditorTabsProps {
  projectId?: string;
  initialData?: string;
  onSave?: (data: string) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ projectId, initialData, onSave }) => {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('design');

  return (
    <div className="flex flex-col h-full">
      <div className={`bg-white dark:bg-gray-800 shadow-sm border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'design'
                  ? 'text-highlightBlue border-b-2 border-highlightBlue'
                  : 'text-gray-500 dark:text-gray-400 hover:text-textBlack dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('design')}
              aria-label="Switch to Design Editor"
            >
              Design Editor
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {activeTab === 'design' && (
          <Editor
            projectId={projectId}
            initialData={initialData}
            onSave={onSave}
          />
        )}
      </div>
    </div>
  );
};

export default EditorTabs;