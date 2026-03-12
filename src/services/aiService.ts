import { GoogleGenAI } from "@google/genai";
import { withRetry } from "../utils/retry";

export async function generateVideo(prompt: string, aspectRatio: '16:9' | '9:16') {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  let operation = await withRetry(() => ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio
    }
  }));

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await withRetry(() => ai.operations.getVideosOperation({operation: operation}));
  }

  return operation.response?.generatedVideos?.[0]?.video?.uri;
}

export async function generateImage(prompt: string, aspectRatio: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio }
    }
  }));
  
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part) {
    return `data:image/png;base64,${part.inlineData?.data}`;
  }
  return null;
}
