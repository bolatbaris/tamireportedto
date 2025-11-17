import { GitHubService } from './github.service';
import { CommentService } from './comment.service';

export class OrchestratorService {
  private githubService: GitHubService;
  private currentUser: { username: string; token: string };

  constructor(userToken: string, username: string) {
    this.githubService = new GitHubService(userToken);
    this.currentUser = { username, token: userToken };
  }

  async run(dryRun: boolean = false): Promise<{
    success: boolean;
    message: string;
    stats?: {
      totalIssues: number;
      processed: number;
      sent: number;
      skipped: number;
      errors: number;
    };
    error?: string;
  }> {
    try {
      console.log('\n╔═══════════════════════════════════════════════════════╗');
      console.log('║        TAMI REPORTED TO - Issue Processor         ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');

      const targetAssignees = ['bolatbaris', 'kazimmadan', 'brkeudunman'];
      console.log(`📥 Issue'lar çekiliyor...`);
      console.log(`   Hedef assignee'ler: ${targetAssignees.map(a => '@' + a).join(', ')}\n`);
      
      const issues = await this.githubService.getIssuesWithProjectData(targetAssignees);

      console.log(`📊 Toplam ${issues.length} issue bulundu\n`);

      if (issues.length === 0) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('ℹ️  İşlenecek issue yok');
        console.log('═══════════════════════════════════════════════════════\n');
        
        return {
          success: true,
          message: 'No open issues found',
          stats: {
            totalIssues: 0,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
          },
        };
      }

      const stats = await CommentService.processIssues(
        issues,
        this.currentUser.token,
        dryRun
      );

      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 İŞLEM ÖZETİ');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   Toplam issue: ${issues.length}`);
      console.log(`   Comment gönderildi: ${stats.sent}`);
      console.log(`   Atlandı: ${stats.skipped}`);
      console.log(`   Hata: ${stats.errors}`);
      console.log('═══════════════════════════════════════════════════════\n');

      return {
        success: true,
        message: 'Process completed successfully',
        stats: {
          totalIssues: issues.length,
          ...stats,
        },
      };
    } catch (error) {
      console.error('\n❌ HATA:', error);
      return {
        success: false,
        message: 'Process failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

