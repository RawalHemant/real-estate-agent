import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * LLM Service using Google Gemini API (free tier).
 *
 * Uses Gemini 2.5 Flash by default — available for free with no credit card.
 * Free tier limits: ~15 RPM, 500 RPD, 250K TPM.
 * More than enough for development and moderate production use.
 */
class LLMService {
  constructor(apiKey, model = "gemini-flash-latest") {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is required. Get one free at https://aistudio.google.com/apikey"
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
  }

  /**
   * Send a completion request and return the text content.
   * @param {string} systemPrompt — sets the model persona
   * @param {string} userPrompt  — the actual request
   * @returns {Promise<string>}
   */
  async complete(systemPrompt, userPrompt) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json", // Gemini native JSON mode
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("LLM returned an empty response");
    }

    return text;
  }
}

export default LLMService;
