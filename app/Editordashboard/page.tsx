'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaPlus, FaBars } from 'react-icons/fa';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between p-4 bg-white shadow">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <FaBars size={24} />
        </button>
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 mx-2 px-4 py-2 bg-gray-100 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link href="/editor">
          <FaPlus size={24} />
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed top-0 left-0 h-full w-64 bg-white p-4 shadow">
            <Sidebar />
          </div>
          <div className="h-full" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex flex-1 relative">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Search & Recent */}
          <div className="w-64 p-4 bg-textBlack">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 bg-gray-100 rounded-md text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Recent</h3>
              <ul className="space-y-2">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/editor?id=${project.id}`} className="text-blue-300 hover:underline">
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plus Button */}
          <div className="flex items-center justify-center px-2">
            <Link href="/editor">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                <FaPlus size={24} />
              </div>
            </Link>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">No projects match your search</h2>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-gray-200 flex items-center justify-center">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">No preview available</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                      {project.description && (
                        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm mb-4">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between">
                        <Link
                          href={`/editor?id=${project.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
