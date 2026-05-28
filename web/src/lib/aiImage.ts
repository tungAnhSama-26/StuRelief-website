type AiImageOptions = {
  width?: number;
  height?: number;
  seed?: string | number;
};

export function aiImageUrl(prompt: string, options: AiImageOptions = {}) {
  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const seed = options.seed ?? prompt;

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(String(seed))}&nologo=true`;
}
