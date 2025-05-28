'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (status === 'unauthenticated') {
    return <div className="p-4 text-center text-red-500">Please log in to view your posts.</div>;
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Posts</h1>
      {posts.length === 0 ? (
        <p>
          No posts yet. <Link href="/posts/add" className="text-blue-500 hover:underline">Add a new post</Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="border p-4 rounded shadow">
              <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover mb-2 rounded" />
              <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
              <p className="text-gray-600 mb-2">{post.description}</p>
              <p className="text-sm text-gray-500 mb-2">
                Created at: {new Date(post.createdAt).toLocaleDateString()}
              </p>
              {post.hashtags && <p className="text-sm text-gray-500 mb-2">Hashtags: {post.hashtags}</p>}
              <Link
                href={`/PostMedia/${post.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Share
              </Link>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <Link href="/posts/add" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Add New Post
        </Link>
      </div>
    </div>
  );
}