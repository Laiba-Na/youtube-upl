// app/PostMedia/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import { Metadata } from 'next';
import ShareButtons from "@/components/ShareButtons";

const prisma = new PrismaClient();

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, imageUrl: true, hashtags: true },
  });

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for does not exist.',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  const imageUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${appUrl}${post.imageUrl}`;

  return {
    title: post.title,
    description: `${post.description} ${post.hashtags ? post.hashtags.split(',').join(' ') : ''}` || 'Check out this post!',
    openGraph: {
      title: post.title,
      description: `${post.description} ${post.hashtags ? post.hashtags.split(',').join(' ') : ''}` || 'Check out this post!',
      images: [
        {
          url: imageUrl,
          width: 1080,
          height: 1080,
          alt: post.title,
        },
      ],
      type: 'article',
      url: `${appUrl}/posts/${params.id}`,
    },
  };
}

export default async function PostMediaPage({ params }: { params: { id: string } }) {
  // Fetch post data
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      hashtags: true,
      imageUrl: true,
    },
  });

  // Handle post not found
  if (!post) {
    return <div className="p-4 text-center text-red-500">Post not found</div>;
  }

  // Construct absolute URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  const postUrl = `${appUrl}/posts/${post.id}`;
  const imageUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${appUrl}${post.imageUrl}`;

  // Convert comma-separated hashtags to space-separated for sharing
  const formattedHashtags = post.hashtags
    ? post.hashtags
        .split(',')
        .map((tag) => (tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`))
        .join(' ')
    : '';

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      <img src={imageUrl} alt={post.title} className="w-full h-auto mb-4 rounded-lg object-cover" />
      {post.description && <p className="mb-4 text-gray-600">{post.description}</p>}
      {formattedHashtags && <p className="mb-4 text-sm text-gray-500">Hashtags: {formattedHashtags}</p>}
      
      <ShareButtons 
        
        imageUrl={imageUrl}
        title={post.title}
        description={post.description || ''}
        hashtags={formattedHashtags}
      />
    </div>
  );
}