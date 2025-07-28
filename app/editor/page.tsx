'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDarkMode } from '@/app/DarkModeContext';
import EditorTabs from '@/components/EditorTabs';
import { Menu } from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const projectId = searchParams.get('id');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && projectId) {
      fetchProject();
    } else {
      setIsLoading(false);
    }
  }, [status, projectId, router]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProjectData(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (content: string) => {
    try {
      if (projectId) {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update project: ${errorData.error || 'Unknown error'}`);
        }
        alert('Project saved successfully!');
      } else {
        const name = prompt('Enter a name for your project:');
        if (!name) return;

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create project: ${errorData.error || 'Unknown error'}`);
        }
        const newProject = await response.json();
        router.push(`/editor?id=${newProject.id}`);
        alert('Project created successfully!');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Failed to save project: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-12 w-12 text-primaryPurple" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
     
      <div className="flex">
        
        <main className="flex-1 flex flex-col">
          <header className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold text-textBlack dark:text-white">
                {projectData ? `Editing: ${projectData.name}` : 'New Design'}
              </h1>
              <button
                onClick={() => router.push('/POST_EDITING')}
                className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                aria-label="Back to Post Dashboard"
              >
                Back to Post Dashboard
              </button>
            </div>
          </header>
          <div className="flex-1">
            <EditorTabs
              projectId={projectId || undefined}
              initialData={projectData?.content ? JSON.stringify(projectData.content) : undefined}
              onSave={handleSave}
            />
          </div>
        </main>
      </div>
    </div>
  );
}