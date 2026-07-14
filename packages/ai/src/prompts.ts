export interface PromptVariable {
  key: string;       // e.g. "tone"
  label: string;     // e.g. "Tone"
  type: 'text' | 'select';
  defaultValue?: string;
  options?: string[];  // for select type
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  template: string;           // supports {{variable}} substitution
  variables: PromptVariable[];
  isPinned: boolean;
  isCustom: boolean;
}

export type PromptCategory =
  | 'video'
  | 'text'
  | 'audio'
  | 'image'
  | 'workflow'
  | 'custom';

export const BUILT_IN_PROMPTS: PromptTemplate[] = [
  // ─── Video ──────────────────────────────────────────────────────────────────
  {
    id: 'auto-cut-silences',
    name: 'Auto Cut Silences',
    category: 'video',
    description: 'Analyze the timeline and suggest removing silent gaps.',
    template: 'Analyze my current video project. Identify all segments on the timeline where the audio level drops below -40dB for more than {{min_duration}} seconds, and list them with their start/end timestamps so I can remove them.',
    variables: [{ key: 'min_duration', label: 'Minimum silence (seconds)', type: 'text', defaultValue: '0.5' }],
    isPinned: false,
    isCustom: false,
  },
  {
    id: 'scene-summary',
    name: 'Scene Summary',
    category: 'video',
    description: 'Summarize what happens in the current clip.',
    template: 'I am editing a video. The current clip starts at {{start_time}} and ends at {{end_time}}. Based on the clip description, write a concise one-sentence scene summary I can use as a chapter marker.',
    variables: [
      { key: 'start_time', label: 'Clip Start', type: 'text', defaultValue: '00:00:00' },
      { key: 'end_time',   label: 'Clip End',   type: 'text', defaultValue: '00:00:10' },
    ],
    isPinned: false,
    isCustom: false,
  },

  // ─── Text ────────────────────────────────────────────────────────────────────
  {
    id: 'social-caption',
    name: 'Social Media Caption',
    category: 'text',
    description: 'Generate a caption for this video.',
    template: 'Write a compelling {{platform}} caption for a video about "{{topic}}". The tone should be {{tone}}. Include 5 relevant hashtags at the end.',
    variables: [
      { key: 'platform', label: 'Platform', type: 'select', defaultValue: 'Instagram', options: ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'LinkedIn'] },
      { key: 'topic',    label: 'Video Topic', type: 'text', defaultValue: 'my video' },
      { key: 'tone',     label: 'Tone', type: 'select', defaultValue: 'engaging and fun', options: ['engaging and fun', 'professional', 'inspirational', 'educational', 'casual'] },
    ],
    isPinned: true,
    isCustom: false,
  },
  {
    id: 'youtube-description',
    name: 'YouTube Description',
    category: 'text',
    description: 'Generate a full SEO-optimized YouTube description.',
    template: 'Write an SEO-optimized YouTube video description for a video titled "{{title}}" about {{topic}}. Include a hook, a detailed paragraph, a timestamps section (use placeholder timestamps), links section, and relevant hashtags. Target keyword: {{keyword}}.',
    variables: [
      { key: 'title',   label: 'Video Title', type: 'text',   defaultValue: 'My Awesome Video' },
      { key: 'topic',   label: 'Topic',       type: 'text',   defaultValue: 'video editing tips' },
      { key: 'keyword', label: 'Target Keyword', type: 'text', defaultValue: 'video editing' },
    ],
    isPinned: false,
    isCustom: false,
  },
  {
    id: 'script-generator',
    name: 'Script Generator',
    category: 'text',
    description: 'Generate a video script from a topic.',
    template: 'Write a {{duration}}-minute video script about "{{topic}}" in a {{style}} style. Include an engaging intro, 3 main points with transitions, and a call-to-action outro. Target audience: {{audience}}.',
    variables: [
      { key: 'topic',    label: 'Topic',     type: 'text', defaultValue: 'productivity tips' },
      { key: 'duration', label: 'Duration (minutes)', type: 'select', defaultValue: '5', options: ['1', '3', '5', '10', '15'] },
      { key: 'style',    label: 'Style',     type: 'select', defaultValue: 'educational', options: ['educational', 'entertaining', 'documentary', 'vlog', 'tutorial'] },
      { key: 'audience', label: 'Audience',  type: 'text', defaultValue: 'general viewers' },
    ],
    isPinned: false,
    isCustom: false,
  },
  {
    id: 'rewrite-tone',
    name: 'Rewrite in Tone',
    category: 'text',
    description: 'Rewrite provided text in a different tone.',
    template: 'Rewrite the following text in a {{tone}} tone, keeping the core message intact:\n\n"{{text}}"',
    variables: [
      { key: 'text', label: 'Text to rewrite', type: 'text', defaultValue: '' },
      { key: 'tone', label: 'Target Tone', type: 'select', defaultValue: 'professional', options: ['professional', 'casual', 'humorous', 'inspirational', 'urgent', 'empathetic'] },
    ],
    isPinned: false,
    isCustom: false,
  },

  // ─── Audio ───────────────────────────────────────────────────────────────────
  {
    id: 'transcript-cleanup',
    name: 'Transcript Cleanup',
    category: 'audio',
    description: 'Clean up a raw auto-generated transcript.',
    template: 'Clean up this raw auto-generated transcript by fixing grammar, removing filler words (um, uh, like, you know), and adding proper punctuation. Keep the meaning intact:\n\n{{transcript}}',
    variables: [
      { key: 'transcript', label: 'Raw Transcript', type: 'text', defaultValue: '' },
    ],
    isPinned: false,
    isCustom: false,
  },
  {
    id: 'audio-eq-advice',
    name: 'EQ Settings Advice',
    category: 'audio',
    description: 'Get advice for EQing different voice types.',
    template: 'What are the best EQ settings to apply to a {{voice_type}} voice that sounds {{issue}} in order to make it sound {{goal}}?',
    variables: [
      { key: 'voice_type', label: 'Voice Type', type: 'select', defaultValue: 'male', options: ['male', 'female', 'deep', 'high-pitched'] },
      { key: 'issue', label: 'Current Issue', type: 'select', defaultValue: 'muffled', options: ['muffled', 'harsh', 'thin', 'boomy', 'nasal'] },
      { key: 'goal', label: 'Goal', type: 'select', defaultValue: 'clear and professional', options: ['clear and professional', 'warm and intimate', 'radio broadcast', 'telephone effect'] },
    ],
    isPinned: false,
    isCustom: false,
  },

  // ─── Image ───────────────────────────────────────────────────────────────────
  {
    id: 'image-generation-prompt',
    name: 'Image Generation Prompt',
    category: 'image',
    description: 'Create a detailed prompt for AI image generators.',
    template: 'Write a highly detailed prompt for an AI image generator (like Midjourney or DALL-E) to create an image of {{subject}}. The style should be {{style}}, with {{lighting}} lighting. Include details about composition, camera angle, and mood.',
    variables: [
      { key: 'subject', label: 'Subject', type: 'text', defaultValue: 'a futuristic city skyline' },
      { key: 'style', label: 'Style', type: 'select', defaultValue: 'photorealistic', options: ['photorealistic', 'anime', 'oil painting', '3D render', 'cyberpunk', 'cinematic concept art'] },
      { key: 'lighting', label: 'Lighting', type: 'select', defaultValue: 'cinematic', options: ['cinematic', 'natural', 'neon', 'moody', 'studio'] },
    ],
    isPinned: true,
    isCustom: false,
  },

  // ─── Workflow ─────────────────────────────────────────────────────────────────
  {
    id: 'color-grade-suggestion',
    name: 'Color Grade Suggestion',
    category: 'workflow',
    description: 'Suggest color grading settings for a specific look.',
    template: 'I am color grading a video and want to achieve a "{{look}}" cinematic look. Suggest specific color grading adjustments I should make including: exposure, contrast, highlights, shadows, saturation, hue shifts, and any creative recommendations.',
    variables: [
      { key: 'look', label: 'Desired Look', type: 'select', defaultValue: 'teal and orange', options: ['teal and orange', 'warm vintage', 'cold horror', 'bleach bypass', 'summer blockbuster', 'indie film', 'documentary'] },
    ],
    isPinned: true,
    isCustom: false,
  },
  {
    id: 'export-settings',
    name: 'Export Settings Advisor',
    category: 'workflow',
    description: 'Get recommended export settings for a platform.',
    template: 'What are the optimal video export settings (resolution, bitrate, codec, frame rate, audio) for uploading to {{platform}}? My source footage is {{resolution}} at {{fps}}fps.',
    variables: [
      { key: 'platform',   label: 'Target Platform', type: 'select', defaultValue: 'YouTube', options: ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Twitter/X', 'Vimeo', 'Cinema (DCP)'] },
      { key: 'resolution', label: 'Source Resolution', type: 'select', defaultValue: '1080p', options: ['720p', '1080p', '1440p', '4K', '6K', '8K'] },
      { key: 'fps',        label: 'Frame Rate', type: 'select', defaultValue: '24', options: ['24', '25', '30', '50', '60', '120'] },
    ],
    isPinned: false,
    isCustom: false,
  },
];

export function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
