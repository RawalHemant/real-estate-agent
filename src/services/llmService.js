import { GoogleGenerativeAI } from "@google/generative-ai";

//LLM Service using Google Gemini API

class LLMService {
  constructor(apiKey, model = "gemini-flash-latest") {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is required."
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
  }

  //Send a completion request and return the text content.
  // @param {string} systemPrompt — sets the model persona
  // @param {string} userPrompt  — the actual request

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
