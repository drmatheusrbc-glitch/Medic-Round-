import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured.");
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  try {
    console.log("Testing basic generateContent with gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Olá, diga oi.",
    });
    console.log("Success:", response.text);
  } catch (error: any) {
    console.error("Failed basic call:", error);
  }

  try {
    console.log("Testing with parts structure containing plain text...");
    const parts = [
      { text: "Test text" }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
    });
    console.log("Success with {parts}:", response.text);
  } catch (error: any) {
    console.error("Failed {parts} call:", error);
  }

  try {
    console.log("Testing with parts containing inlineData...");
    const base64Data = "JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gPj4KZW5kb2JqCnRyYWlsZXIKICA8PCAvUm9vdCAxIDAgUiA+JQpFT0Y="; // minimum valid-like pdf
    const parts = [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        }
      },
      {
        text: "Extraia o texto.",
      }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
    });
    console.log("Success PDF OCR call:", response.text);
  } catch (error: any) {
    console.error("Failed PDF OCR call:", error);
  }
}

run();
