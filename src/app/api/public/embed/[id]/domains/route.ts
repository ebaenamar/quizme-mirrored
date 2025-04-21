import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Next.js 15 route handler for dynamic routes
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
