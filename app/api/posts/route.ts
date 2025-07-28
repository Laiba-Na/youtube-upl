import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, hashtags, imageUrl } = await request.json();

  try {
    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        title,
        description,
        hashtags,
        imageUrl,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const postId = url.searchParams.get('id');

  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
  }

  try {
    // Verify the post belongs to the user before deleting
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized to delete this post' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
  }
}