
import { PrismaClient } from "@prisma/client";
import { Metadata } from 'next';



const prisma = new PrismaClient();


export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, imageUrl: true },
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
    description: post.description || 'Check out this post!',
    openGraph: {
      title: post.title,
      description: post.description || 'Check out this post!',
      images: [
        {
          url: imageUrl,
          width: 800, // Adjust based on typical image dimensions
          height: 600,
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

  // Construct share URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(`${post.description || ''} ${formattedHashtags}`)}`;
  const threadsShareUrl = `https://www.instagram.com/?url=${encodeURIComponent(postUrl)}`; // Fallback for Threads
  const twitterShareUrl = `https://x.com/intent/post?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(`${post.title} ${formattedHashtags}`)}`;
  const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.description || '')}`;
  const tumblrShareUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}&caption=${encodeURIComponent(`${post.description || ''} ${formattedHashtags}`)}`;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      <img src={imageUrl} alt={post.title} className="w-full h-auto mb-4 rounded-lg object-cover" />
      {post.description && <p className="mb-4 text-gray-600">{post.description}</p>}
      {formattedHashtags && <p className="mb-4 text-sm text-gray-500">Hashtags: {formattedHashtags}</p>}
      <div className="flex flex-wrap gap-4">
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Share on Facebook
        </a>
        <a
          href={pinterestShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Share on Pinterest
        </a>
        <a
          href={threadsShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Share on Threads
        </a>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500"
        >
          Share on Twitter
        </a>
        <a
          href={linkedinShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900"
        >
          Share on LinkedIn
        </a>
        <a
          href={tumblrShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Share on Tumblr
        </a>
      </div>
    </div>
  );
}


//facebook , pinterest , threads , Twitter , LinkedIn , Tumblr