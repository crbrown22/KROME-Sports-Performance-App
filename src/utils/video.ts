export const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already an embed URL, just return it
  if (url.includes('youtube.com/embed/')) return url;
  
  // Handle standard youtube.com/watch?v=...
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  
  // Ensure it starts with http/https
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};
