import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the origin of the request
    const origin = request.headers.get('Origin') || '';
    
    // Get the quiz data
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        questions: true,
        totalQuestions: true,
        allowedEmbedDomains: true,
      }
    });
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    // Check if this quiz has domain restrictions
    if (quiz.allowedEmbedDomains.length > 0) {
      const isAllowed = quiz.allowedEmbedDomains.some(domain => 
        origin.includes(domain) || origin === ''  // Allow empty origin for direct access
      );
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'This quiz cannot be embedded on this domain' }, 
          { status: 403 }
        );
      }
    }
    
    // Set CORS headers to allow embedding
    const response = NextResponse.json({ quiz });
    
    // Allow embedding from any domain by default, or specific domains if restricted
    if (quiz.allowedEmbedDomains.length > 0) {
      const allowedOrigins = quiz.allowedEmbedDomains.join(' ');
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching quiz for embed:', error);
    return NextResponse.json(
      { error: 'Failed to load quiz' }, 
      { status: 500 }
    );
  }
}

// API endpoint to add allowed domains for embedding
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
