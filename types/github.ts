export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  assignees: Array<{
    login: string;
  }>;
  html_url: string;
  node_id: string;
}

export interface ProjectField {
  id: string;
  name: string;
  dataType: string;
}

export interface ProjectItem {
  id: string;
  content?: {
    number: number;
  };
  fieldValues: {
    nodes: Array<{
      field: {
        name: string;
      };
      text?: string;
      name?: string;
    }>;
  };
}

export interface ProjectData {
  reportedTo?: string;
  status?: string;
  assignee?: string;
}

export interface IssueWithProjectData extends GitHubIssue {
  projectData: ProjectData;
}

export interface UserToken {
  username: string;
  token: string;
}

