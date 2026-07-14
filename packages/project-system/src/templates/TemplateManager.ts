import { ProjectManager } from '../project/ProjectManager';

export interface ProjectTemplate {
  id: string;
  name: string;
  resolution: { width: number, height: number };
  framerate: number;
}

export class TemplateManager {
  private static templates: ProjectTemplate[] = [
    { id: 'blank', name: 'Blank Project', resolution: { width: 1920, height: 1080 }, framerate: 60 },
    { id: 'youtube_4k', name: 'YouTube 4K', resolution: { width: 3840, height: 2160 }, framerate: 60 },
    { id: 'instagram_reels', name: 'Instagram Reels', resolution: { width: 1080, height: 1920 }, framerate: 30 },
    { id: 'tiktok', name: 'TikTok', resolution: { width: 1080, height: 1920 }, framerate: 60 },
    { id: 'cinema_scope', name: 'Cinemascope', resolution: { width: 1920, height: 817 }, framerate: 24 }
  ];

  public static getTemplates(): ProjectTemplate[] {
    return this.templates;
  }

  public static async createFromTemplate(templateId: string, projectName: string) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const pm = ProjectManager.getInstance();
    await pm.createProject(projectName, template.resolution, template.framerate);
  }
}
