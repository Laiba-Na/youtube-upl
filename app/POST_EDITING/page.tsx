'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useDarkMode } from '@/app/DarkModeContext';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { FaPlus } from 'react-icons/fa';

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Editordashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${isSidebarOpen ? 'hidden' : 'block'}`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex">
          {/* Search & Recent Sidebar */}
          <div className={`w-64 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl hidden lg:block`}>
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue focus:outline-none transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search projects"
            />
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-textBlack dark:text-white mb-3">Recent Projects</h3>
              <ul className="space-y-2">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/editor?id=${project.id}`}
                      className="text-highlightBlue hover:underline text-sm"
                      aria-label={`Open project ${project.name}`}
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-textBlack dark:text-white">Your Projects</h1>
                <Link
                  href="/editor"
                  className="p-3 bg-primaryPurple text-white rounded-full hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                  aria-label="Create new project"
                >
                  <FaPlus className="h-6 w-6" />
                </Link>
              </div>
              {filteredProjects.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
                  <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">
                    No projects match your search
                  </h2>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-highlightBlue hover:underline"
                    aria-label="Clear search"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200"
                    >
                      <div className="h-40 bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded-lg mb-4">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.name}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">No preview</span>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-2">{project.name}</h2>
                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/editor?id=${project.id}`}
                          className="flex-1 px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200 text-center"
                          aria-label={`Edit project ${project.name}`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="flex-1 px-4 py-2 bg-primaryRed text-white rounded-lg hover:bg-red-600 hover:shadow-md transition-all duration-200"
                          aria-label={`Delete project ${project.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}