import { PrismaClient } from '@prisma/client';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostMediaClient from '@/components/PostMediaClient';

// Singleton PrismaClient
const prisma = new PrismaClient();

interface Post {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  imageUrl: string | null;
}

interface Props {
  params: { id: string };
}

// Shared logic for fetching post and constructing URLs
async function getPostData(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      hashtags: true,
      imageUrl: true,
    },
  });

  if (!post) return null;

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const imageUrl = post.imageUrl?.startsWith('http') ? post.imageUrl : `${appUrl}${post.imageUrl}`;
  const formattedHashtags = post.hashtags
    ? post.hashtags
        .split(',')
        .map((tag) => (tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`))
        .join(' ')
    : '';

  return { post, imageUrl, formattedHashtags };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPostData(params.id);
  if (!data) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for does not exist.',
    };
  }

  const { post, imageUrl, formattedHashtags } = data;
  const description = `${post.description || ''} ${formattedHashtags}`.trim() || 'Check out this post!';

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.imageUrl
        ? [
            {
              url: imageUrl,
              width: 1080,
              height: 1080,
              alt: post.title,
            },
          ]
        : [],
      type: 'article',
      url: `${process.env.NEXTAUTH_URL}/posts/${params.id}`,
    },
  };
}

export default async function PostMediaPage({ params }: Props) {
  const data = await getPostData(params.id);
  if (!data) {
    notFound();
  }

  const { post, imageUrl, formattedHashtags } = data;

  return (
    <PostMediaClient
      post={post}
      imageUrl={imageUrl}
      formattedHashtags={formattedHashtags}
    />
  );
}