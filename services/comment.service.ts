import { GitHubService } from './github.service';
import { IssueWithProjectData } from '@/types/github';
import { isNonWorkingDay } from '@/config/holidays';

export class CommentService {
  static shouldSendComment(issue: IssueWithProjectData): boolean {
    const { projectData } = issue;
    
    if (!projectData.reportedTo || projectData.reportedTo.trim().length < 3) {
      return false;
    }

    const validStatuses = ['In Test', 'In QA', 'In Prod'];
    if (!projectData.status || !validStatuses.includes(projectData.status)) {
      return false;
    }

    if (!projectData.assignee) {
      return false;
    }

    return true;
  }

  static isTodayWorkingDay(): boolean {
    const today = new Date();
    return !isNonWorkingDay(today);
  }

  static createCommentText(reportedTo: string, status: string): string {
    switch (status) {
      case 'In Test':
        return `${reportedTo} Test ortamına deployu sağlanmıştır. Lütfen, test edip dönüş sağlayınız 😊`;
      
      case 'In QA':
        return `${reportedTo} QA ortamına deployu sağlanmıştır. Lütfen, uat kapsamında kontrol edip dönüş sağlayınız 🔍`;
      
      case 'In Prod':
        return `${reportedTo} Issue production ortamına deploy edilmiştir. Lütfen production ortamında kontrollerinizi gerçekleştiriniz ve issue'ı kapatınız 🚀`;
      
      default:
        return `${reportedTo} - Lütfen kontrol ediniz ${status}`;
    }
  }

  static getSkipReason(issue: IssueWithProjectData): string {
    const { projectData } = issue;
    const validStatuses = ['In Test', 'In QA', 'In Prod'];
    const targetAssignees = ['bolatbaris', 'kazimmadan', 'brkeudunman'];
    
    if (!projectData.assignee || !targetAssignees.includes(projectData.assignee)) {
      return `Assignee uymuyor (${projectData.assignee || 'yok'})`;
    }
    
    if (!projectData.reportedTo || projectData.reportedTo.trim().length < 3) {
      return 'reportedTo yok veya 3 karakterden az';
    }
    
    if (!projectData.status || !validStatuses.includes(projectData.status)) {
      return `Status uymuyor (${projectData.status || 'yok'})`;
    }
    
    return 'Bilinmeyen neden';
  }

  static async processIssues(
    issues: IssueWithProjectData[],
    currentUserToken: string,
    dryRun: boolean = false
  ): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    errors: number;
  }> {
    const stats = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    };

    if (!this.isTodayWorkingDay()) {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      console.log(`\n⛔ Today is a holiday or weekend (${dateStr}). No comments will be sent.\n`);
      return stats;
    }

    const githubService = new GitHubService(currentUserToken);

    if (dryRun) {
      console.log('\n🔍 [DRY RUN MODE] - Comments will NOT be sent\n');
    }

    const issuesWithComment: Array<{ issue: IssueWithProjectData; comment: string }> = [];
    const issuesWithoutComment: Array<{ issue: IssueWithProjectData; reason: string }> = [];
    for (const issue of issues) {
      stats.processed++;

      if (this.shouldSendComment(issue)) {
        const commentText = this.createCommentText(
          issue.projectData.reportedTo!,
          issue.projectData.status!
        );
        issuesWithComment.push({ issue, comment: commentText });
      } else {
        const reason = this.getSkipReason(issue);
        issuesWithoutComment.push({ issue, reason });
      }
    }

    if (issuesWithComment.length > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log(`✅ COMMENT GÖNDERİLECEK ISSUE'LAR (${issuesWithComment.length})`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      for (const { issue, comment } of issuesWithComment) {
        console.log(`📌 Issue #${issue.number} - ${issue.title}`);
        console.log(`   Assignee: @${issue.projectData.assignee}`);
        console.log(`   Status: ${issue.projectData.status}`);
        console.log(`   Comment: "${comment}"`);
        console.log('');
        
        try {
          await githubService.addCommentToIssue(issue.number, comment, dryRun);
          stats.sent++;
          
          if (!dryRun) {
            console.log(`   ✓ Comment gönderildi\n`);
          }
          
          await this.sleep(300);
        } catch (error) {
          stats.errors++;
          console.error(`   ❌ Hata: ${error}\n`);
        }
      }
    } else {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ COMMENT GÖNDERİLECEK ISSUE YOK');
      console.log('═══════════════════════════════════════════════════════\n');
    }

    if (issuesWithoutComment.length > 0) {
      stats.skipped = issuesWithoutComment.length;
      
      console.log('═══════════════════════════════════════════════════════');
      console.log(`⏭️  COMMENT GÖNDERİLMEYECEK ISSUE'LAR (${issuesWithoutComment.length})`);
      console.log('═══════════════════════════════════════════════════════\n');
      
    
    }

    return stats;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

