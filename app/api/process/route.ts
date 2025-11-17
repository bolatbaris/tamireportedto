import { NextResponse } from 'next/server';
import { OrchestratorService } from '@/services/orchestrator.service';
import { getCurrentUser } from '@/config/tokens';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function validatePassword(password: string | null): boolean {
  const expectedPassword = process.env.API_PASSWORD;
  
  if (!expectedPassword) {
    console.error('API_PASSWORD is not configured');
    return false;
  }
  
  return password === expectedPassword;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Invalid or missing password',
        },
        { status: 401 }
      );
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'GITHUB_TOKEN is not configured or invalid',
        },
        { status: 500 }
      );
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const dryRun = isDevelopment;

    const orchestrator = new OrchestratorService(currentUser.token, currentUser.username);
    const result = await orchestrator.run(dryRun);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error in GET /api/process:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

