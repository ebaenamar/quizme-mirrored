import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { domain } = await request.json();
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' }, 
        { status: 400 }
      );
    }
    
    // Get the current quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        allowedEmbedDomains: true,
      }
    });
    
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' }, 
        { status: 404 }
      );
    }
    
    // Add the domain if it's not already in the list
    if (!quiz.allowedEmbedDomains.includes(domain)) {
      await prisma.quiz.update({
        where: { id },
        data: {
          allowedEmbedDomains: {
            push: domain,
          },
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding allowed domain:', error);
    return NextResponse.json(
      { error: 'Failed to add domain' }, 
      { status: 500 }
    );
  }
}
