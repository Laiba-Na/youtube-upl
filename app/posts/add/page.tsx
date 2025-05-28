'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  thumbnail: string | null;
}

export default function AddPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ type: string; url: string; projectId?: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

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
      router.push('/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Post</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Select Image Source</h2>
        <div className="mb-2">
          <label className="block mb-1">Upload New Image</label>
          <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block mb-1">Select from Existing Projects</label>
          {loadingProjects ? (
            <p>Loading projects...</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border p-2 cursor-pointer"
                  onClick={() => handleSelectProject(project)}
                >
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-32 object-cover mb-2" />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">No thumbnail</div>
                  )}
                  <p className="text-sm">{project.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedImage && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Preview</h2>
          <img src={selectedImage.url} alt="Selected" className="w-64 h-64 object-cover" />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full"
            rows={4}
          />
        </div>
        <div>
          <label className="block mb-1">Hashtags (comma-separated)</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create Post
        </button>
      </form>
    </div>
  );
}