'use client';
import React, { useState } from 'react';
import Editor from './Editor';


interface EditorTabsProps {
  projectId?: string;
  initialData?: string;
  onSave?: (data: string) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ projectId, initialData, onSave }) => {
  const [activeTab, setActiveTab] = useState('design');

 

  
  

  

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'design' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('design')}
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