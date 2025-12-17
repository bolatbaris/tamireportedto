import { NextResponse } from 'next/server';
import { GitHubService } from '@/services/github.service';
import { getCurrentUser } from '@/config/tokens';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_USERS = ['bolatbaris', 'kazimmadan', 'brkeudunman'] as const;
type ValidUser = typeof VALID_USERS[number];

function validatePassword(password: string | null): boolean {
  const expectedPassword = process.env.API_PASSWORD;
  
  if (!expectedPassword) {
    console.error('API_PASSWORD is not configured');
    return false;
  }
  
  return password === expectedPassword;
}

function isValidUser(username: string | null): username is ValidUser {
  if (!username) return false;
  return VALID_USERS.includes(username as ValidUser);
}

function generateDailyReport(issues: { number: number; title: string }[]): string {
  const prefix = 'Garanti Daily katıldım. Eteration Daily katıldım.';
  
  if (issues.length === 0) {
    return `${prefix} Bugün üzerinde çalışılan aktif iş bulunmamaktadır.`;
  }

  // Clean up issue titles (remove prefixes like [FIX], [FEATURE], etc.)
  const cleanTitles = issues.map(issue => 
    issue.title.replace(/^\[.*?\]\s*/g, '').trim()
  );

  let workDescription: string;
  if (cleanTitles.length === 1) {
    workDescription = `${cleanTitles[0]} üzerinde çalıştım.`;
  } else {
    workDescription = `${cleanTitles.join(', ')} konularında çalıştım.`;
  }

  return `${prefix} ${workDescription}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    const username = searchParams.get('username');
    const shouldGenerateReport = searchParams.get('report') === 'true';

    // Password validation
    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Invalid or missing password',
        },
        { status: 401 }
      );
    }

    // Username validation
    if (!isValidUser(username)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid username. Must be one of: ${VALID_USERS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get current authenticated user for API calls
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

    // Fetch issues for the specified user
    const githubService = new GitHubService(currentUser.token);
    const allIssues = await githubService.getIssuesWithProjectData([username]);

    // Filter only "In Progress" issues with valid Story Points (> 0)
    const inProgressIssues = allIssues.filter(
      issue => 
        issue.projectData.status === 'In Progress' &&
        issue.projectData.storyPoints !== undefined &&
        issue.projectData.storyPoints > 0
    );

    // Prepare response with essential data
    const issues = inProgressIssues.map(issue => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      status: issue.projectData.status,
      assignee: issue.projectData.assignee,
      storyPoints: issue.projectData.storyPoints,
    }));

    // Generate daily report if requested
    let dailyReport: string | undefined;
    let gistUrl: string | undefined;
    
    if (shouldGenerateReport) {
      dailyReport = generateDailyReport(
        issues.map(i => ({ number: i.number, title: i.title }))
      );
      console.log('📝 Generated Daily Report:', dailyReport);

      // Create Gist with the daily report
      gistUrl = await githubService.createDailyGist(dailyReport, username);
      console.log('🔗 Gist URL:', gistUrl);
    }

    return NextResponse.json({
      success: true,
      username,
      issueCount: issues.length,
      issues,
      ...(dailyReport && { dailyReport }),
      ...(gistUrl && { gistUrl }),
    });

  } catch (error) {
    console.error('Error in GET /api/user-issues:', error);
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
