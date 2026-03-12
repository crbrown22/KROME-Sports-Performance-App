import React, { useState, useEffect } from 'react';

export default function VideoPlayer({ uri }: { uri: string }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(uri, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
          },
        });
        const blob = await response.blob();
        setVideoSrc(URL.createObjectURL(blob));
        setLoading(false);
      } catch (e) {
        console.error("Error fetching video:", e);
        setLoading(false);
      }
    };
    fetchVideo();
    
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [uri]);

  if (loading) return <div className="text-xs text-white/50">Loading video...</div>;
  if (!videoSrc) return <div className="text-xs text-red-500">Error loading video.</div>;

  return <video src={videoSrc} controls className="w-full rounded-lg" />;
}
