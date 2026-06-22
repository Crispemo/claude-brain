import OpenAI from "openai";

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await fetch(audioUrl);
  const blob = await response.blob();
  const file = new File([blob], "audio.mp4", { type: "audio/mp4" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });

  return transcription.text;
}
