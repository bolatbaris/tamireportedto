import { Octokit } from '@octokit/rest';
import { GitHubIssue, ProjectData, IssueWithProjectData } from '@/types/github';

const OWNER = 'GTTami';
const REPO = 'WebApp';
const PROJECT_NUMBER = 2;

/**
 * GitHub API ile işlem yapmak için servis sınıfı
 */
export class GitHubService {
  private octokit: Octokit;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  async getOpenIssues(targetAssignees: string[] = ['bolatbaris', 'kazimmadan', 'brkeudunman']): Promise<GitHubIssue[]> {
    try {
      const allIssues: GitHubIssue[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data } = await this.octokit.rest.issues.listForRepo({
          owner: OWNER,
          repo: REPO,
          state: 'open',
          per_page: perPage,
          page: page,
        });

        if (data.length === 0) break;

        allIssues.push(...(data as GitHubIssue[]));

        if (data.length < perPage) break;

        page++;
      }

      const filteredIssues = allIssues.filter(issue => {
        if (!issue.assignees || issue.assignees.length === 0) return false;
        
        return issue.assignees.some(assignee => 
          targetAssignees.includes(assignee.login)
        );
      });
      
      return filteredIssues;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  async getProjectDataForIssue(issueNumber: number): Promise<ProjectData> {
    try {
      const freshOctokit = new Octokit({ 
        auth: this.token,
        request: {
          cache: 'no-cache'
        }
      });
      
      const query = `
        query($owner: String!, $projectNumber: Int!) {
          user(login: $owner) {
            projectV2(number: $projectNumber) {
              items(first: 100) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      number
                    }
                  }
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldTextValue {
                        text
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response: any = await freshOctokit.graphql(query, {
        owner: OWNER,
        projectNumber: PROJECT_NUMBER,
      });

      const projectItems = response?.user?.projectV2?.items?.nodes || [];
      const item = projectItems.find(
        (item: any) => item.content?.number === issueNumber
      );

      if (!item) {
        return {};
      }

      const projectData: ProjectData = {};
      const fieldValues = item.fieldValues?.nodes || [];

      for (const fieldValue of fieldValues) {
        const fieldName = fieldValue.field?.name?.trim();
        
        if (fieldName === 'reportedTo' && fieldValue.text) {
          projectData.reportedTo = fieldValue.text;
        } else if (fieldName === 'Status' && fieldValue.name) {
          projectData.status = fieldValue.name;
        }
      }

      return projectData;
    } catch (error) {
      console.error(`Error fetching project data for issue #${issueNumber}:`, error);
      return {};
    }
  }

  async getIssuesWithProjectData(targetAssignees?: string[]): Promise<IssueWithProjectData[]> {
    const issues = await this.getOpenIssues(targetAssignees);
    const issuesWithData: IssueWithProjectData[] = [];

    for (const issue of issues) {
      const projectData = await this.getProjectDataForIssue(issue.number);
      
      if (issue.assignees && issue.assignees.length > 0) {
        projectData.assignee = issue.assignees[0].login;
      }

      issuesWithData.push({
        ...issue,
        projectData,
      });
    }

    return issuesWithData;
  }

  async addCommentToIssue(
    issueNumber: number,
    comment: string,
    dryRun: boolean = false
  ): Promise<void> {
    try {
      if (dryRun) {
        return;
      }

      await this.octokit.rest.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: issueNumber,
        body: comment,
      });
    } catch (error) {
      console.error(`❌ Error adding comment to issue #${issueNumber}:`, error);
      throw error;
    }
  }

}

