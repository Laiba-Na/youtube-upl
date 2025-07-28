'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/DarkModeContext';

import { Menu } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  thumbnail: string | null;
}

export default function AddPostPage() {
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ type: string; url: string; projectId?: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
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
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const { url } = await res.json();
      setSelectedImage({ type: 'upload', url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const handleSelectProject = (project: Project) => {
    if (project.thumbnail) {
      setSelectedImage({ type: 'project', url: project.thumbnail, projectId: project.id });
    } else {
      alert('This project does not have a thumbnail. Please resave the project in the editor.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      alert('Please select an image.');
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          hashtags,
          imageUrl: selectedImage.url,
        }),
      });
      if (!res.ok) throw new Error('Failed to create post');
      router.push('/POST_CATALOG');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      
      <div className="flex">
        
        

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">Add New Post</h1>

            {/* Image Source Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">Select Image Source</h2>
              <div className="space-y-6">
                {/* Upload New Image */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-textBlack dark:text-gray-200">
                    Upload New Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primaryPurple file:text-white hover:file:bg-highlightBlue transition-all duration-200"
                    aria-label="Upload new image"
                  />
                </div>

                {/* Existing Projects */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-textBlack dark:text-gray-200">
                    Select from Existing Projects
                  </label>
                  {loadingProjects ? (
                    <div className="flex justify-center items-center h-32">
                      <svg className="animate-spin h-8 w-8 text-primaryPurple" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="group bg-gray-100 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200"
                          onClick={() => handleSelectProject(project)}
                          role="button"
                          aria-label={`Select project ${project.name}`}
                        >
                          {project.thumbnail ? (
                            <img
                              src={project.thumbnail}
                              alt={project.name}
                              className="w-full h-32 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-300 dark:bg-gray-600 flex items-center justify-center rounded-lg mb-2">
                              <span className="text-gray-500 dark:text-gray-400">No thumbnail</span>
                            </div>
                          )}
                          <p className="text-sm font-medium text-textBlack dark:text-white truncate">{project.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-4">Preview</h2>
                <img
                  src={selectedImage.url}
                  alt="Selected preview"
                  className="w-64 h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Post Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-textBlack dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue focus:outline-none transition-all duration-200"
                  required
                  aria-label="Post title"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-textBlack dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue focus:outline-none transition-all duration-200"
                  rows={4}
                  aria-label="Post description"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-textBlack dark:text-gray-200">
                  Hashtags (comma-separated)
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue focus:outline-none transition-all duration-200"
                  aria-label="Post hashtags"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                aria-label="Create post"
              >
                Create Post
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}