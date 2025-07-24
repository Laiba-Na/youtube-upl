"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PostsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch posts: ${text}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Fetch posts error:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Your Posts
      </h1>
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No posts found.{" "}
          <Link
            href="/posts/add"
            className="text-indigo-600 dark:text-indigo-400"
          >
            Add a post
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md"
            >
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {post.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {post.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {post.hashtags}
              </p>
              <Link
                href={`/PostMedia/${post.id}`}
                className="text-indigo-600 dark:text-indigo-400 mt-2 inline-block"
              >
                Share
              </Link>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/posts/add"
        className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-500"
      >
        Add Post
      </Link>
    </div>
  );
}
