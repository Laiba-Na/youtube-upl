// editor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EditorTabs from '@/components/EditorTabs';



export default function EditorPage() {


  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  }, [status, projectId]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (content: string) => {
    try {
      if (projectId) {
        // Update existing project
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content, // Send content as a string
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update project: ${errorData.error || 'Unknown error'}`);
        }
  
        alert('Project saved successfully!');
      } else {
        // Create new project
        const name = prompt('Enter a name for your project:');
        if (!name) return;
  
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            content, // Send content as a string
          }),
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
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {projectData ? `Editing: ${projectData.name}` : 'New Design'}
          </h1>
          <button
            onClick={() => router.push('/Editordashboard')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back to Dashboard
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
    </div>
  );
}