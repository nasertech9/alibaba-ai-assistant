
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  // Guidelines: Create a new GoogleGenAI instance right before making an API call.
  // Do not store it in a class property initialized in the constructor.

  async generateResponse(prompt: string, modelName: string = 'gemini-3-flash-preview') {
    // Always use a new instance for each call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });
      // Accessing .text property directly as per guidelines
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async chat(messages: { role: string; content: string }[]) {
    // Always use a new instance for each call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      // Send last message
      const lastMessage = messages[messages.length - 1].content;
      const response = await chat.sendMessage({ message: lastMessage });
      // Accessing .text property directly as per guidelines
      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
