import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Next.js 15 route handler for dynamic routes
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise to get the actual ID
    const { id } = await params;
    
    // Get the origin of the request
    const origin = req.headers.get('Origin') || '';
    
    // Get the quiz data
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        questions: true,
        totalQuestions: true,
      }
    });
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    // Get the allowed domains using raw query to avoid TypeScript errors
    const domainsResult = await prisma.$queryRaw<Array<{ allowedEmbedDomains: string[] }>>`
      SELECT "allowedEmbedDomains" FROM "Quiz" WHERE "id" = ${id}
    `;
    
    // Extract the domains array (will be empty if the column doesn't exist)
    const allowedDomains = domainsResult[0]?.allowedEmbedDomains || [];
    
    // Check if this quiz has domain restrictions
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain: string) => 
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
    const response = NextResponse.json({ 
      quiz: {
        ...quiz,
        allowedEmbedDomains: allowedDomains
      } 
    });
    
    // Allow embedding from any domain by default, or specific domains if restricted
    if (allowedDomains.length > 0) {
      const allowedOrigins = allowedDomains.join(' ');
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
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise to get the actual ID
    const { id } = await params;
    
    const body = await req.json();
    const domain = body.domain as string;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' }, 
        { status: 400 }
      );
    }
    
    // Get the current quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });
    
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' }, 
        { status: 404 }
      );
    }
    
    // Use raw SQL to update the domain list
    await prisma.$executeRaw`
      UPDATE "Quiz"
      SET "allowedEmbedDomains" = COALESCE("allowedEmbedDomains", '{}') || ${domain}::text
      WHERE "id" = ${id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding allowed domain:', error);
    return NextResponse.json(
      { error: 'Failed to add domain' }, 
      { status: 500 }
    );
  }
}
