'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useDarkMode } from '@/app/DarkModeContext';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  imageUrl: string;
  createdAt: string;
}

export default function PostsPage() {
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [status]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleting(postId);
    try {
      const res = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <TopBar />
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Mobile Sidebar Toggle */}
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${isSidebarOpen ? 'hidden' : 'block'}`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {status === 'unauthenticated' ? (
            <div className="max-w-4xl mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl shadow-xl p-6 text-center text-primaryRed dark:text-red-400 animate-shake">
              Please log in to view your posts.
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-12 w-12 text-primaryPurple" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
              </svg>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">Your Posts</h1>
              {posts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No posts yet.{' '}
                    <Link href="/POST_CATALOG/add" className="text-highlightBlue hover:underline">
                      Add a new post
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200"
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h2 className="text-xl font-semibold text-textBlack dark:text-white mb-2">{post.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{post.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                        Created at: {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      {post.hashtags && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">Hashtags: {post.hashtags}</p>
                      )}
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`POST_MEDIA/PostMedia/${post.id}`}
                          className="flex-1 px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200 text-center"
                          aria-label={`Share post ${post.title}`}
                        >
                          Share
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className={`flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200 ${
                            deleting === post.id
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-primaryRed hover:bg-red-600 hover:shadow-md'
                          }`}
                          aria-label={`Delete post ${post.title}`}
                        >
                          {deleting === post.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Link
                  href="/POST_CATALOG/add"
                  className="inline-block px-6 py-3 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                  aria-label="Add new post"
                >
                  Add New Post
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}