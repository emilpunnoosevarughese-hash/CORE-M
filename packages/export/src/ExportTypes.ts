// Export Format Types for CORE M Export Engine

export enum ExportFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  WEBM = 'webm',
  AVI = 'avi',
  MKV = 'mkv',
  GIF = 'gif',
  PNG_SEQUENCE = 'png_sequence',
  JPEG_SEQUENCE = 'jpeg_sequence',
  PRORES = 'prores',
  DNxHD = 'dnxhd'
}

export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP8 = 'vp8',
  VP9 = 'vp9',
  AV1 = 'av1',
  PRORES_422 = 'prores_422',
  PRORES_4444 = 'prores_4444',
  DNxHD_115 = 'dnxhd_115',
  DNxHD_145 = 'dnxhd_145'
}

export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'mp3',
  PCM = 'pcm',
  OPUS = 'opus',
  FLAC = 'flac',
  WAV = 'wav',
  AC3 = 'ac3'
}
