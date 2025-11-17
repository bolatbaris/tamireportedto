import { Octokit } from '@octokit/rest';

export async function getCurrentUser(): Promise<{ username: string; token: string } | null> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('GITHUB_TOKEN is not configured');
    return null;
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    console.log(`Reporter user authenticated: ${user.login}`);
    
    return {
      username: user.login,
      token: token,
    };
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }
}
