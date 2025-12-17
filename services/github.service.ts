import { Octokit } from '@octokit/rest';
import { GitHubIssue, ProjectData, IssueWithProjectData } from '@/types/github';

const OWNER = 'GTTami';
const REPO = 'WebApp';
const PROJECT_NUMBER = 2;

export class GitHubService {
  private octokit: Octokit;
  private token: string;
  private projectDataCache: Map<number, ProjectData> | null = null;

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

  async getAllProjectData(): Promise<Map<number, ProjectData>> {
    if (this.projectDataCache) {
      return this.projectDataCache;
    }

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
              items(first: 100, orderBy: {field: POSITION, direction: DESC}) {
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
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      `;

      let allProjectItems: any[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      
      while (hasNextPage) {
        const paginatedQuery = cursor 
          ? query.replace('items(first: 100,', `items(first: 100, after: "${cursor}",`)
          : query;
          
        const response: any = await freshOctokit.graphql(paginatedQuery, {
          owner: OWNER,
          projectNumber: PROJECT_NUMBER,
        });

        const items = response?.user?.projectV2?.items?.nodes || [];
        allProjectItems = [...allProjectItems, ...items];
        
        hasNextPage = response?.user?.projectV2?.items?.pageInfo?.hasNextPage || false;
        cursor = response?.user?.projectV2?.items?.pageInfo?.endCursor || null;
      }

      const projectDataMap = new Map<number, ProjectData>();

      for (const item of allProjectItems) {
        const issueNumber = item.content?.number;
        if (!issueNumber) continue;

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

        projectDataMap.set(issueNumber, projectData);
      }

      this.projectDataCache = projectDataMap;
      return projectDataMap;
    } catch (error) {
      console.error('Error fetching all project data:', error);
      return new Map();
    }
  }

  async getIssuesWithProjectData(targetAssignees?: string[]): Promise<IssueWithProjectData[]> {
    const [issues, projectDataMap] = await Promise.all([
      this.getOpenIssues(targetAssignees),
      this.getAllProjectData()
    ]);

    const issuesWithData: IssueWithProjectData[] = issues.map(issue => {
      const projectData = projectDataMap.get(issue.number) || {};
      
      if (issue.assignees && issue.assignees.length > 0) {
        projectData.assignee = issue.assignees[0].login;
      }

      return {
        ...issue,
        projectData,
      };
    });

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
