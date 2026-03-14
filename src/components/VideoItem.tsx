import { safeStorage } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface VideoItemProps {
  url: string;
  prompt: string;
}

export default function VideoItem({ url, prompt }: VideoItemProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.API_KEY!,
          },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error('Failed to fetch video', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [url]);

  if (loading) return <div className="w-full h-40 bg-zinc-800 rounded-xl flex items-center justify-center">Loading...</div>;
  if (!videoUrl) return <div className="w-full h-40 bg-zinc-800 rounded-xl flex items-center justify-center">Failed to load</div>;

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-white/10">
      <video src={videoUrl} controls className="w-full h-40 object-cover rounded-xl mb-4" />
      <p className="text-xs text-white/70 mb-4 line-clamp-2">{prompt}</p>
      <div className="flex gap-2">
        <a href={videoUrl} target="_blank" rel="noreferrer" className="flex-1 btn-outline-accent text-xs py-2">Open</a>
        <a href={videoUrl} download className="btn-outline-accent text-xs py-2 px-3"><Download className="w-4 h-4" /></a>
      </div>
    </div>
  );
}
