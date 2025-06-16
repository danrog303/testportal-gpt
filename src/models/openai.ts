export const GPT_API_URL = "https://api.openai.com/v1/chat/completions";

export interface GptApiRequest {
  model: string;
  messages: GptMessage[];
  temperature: number;
}

export interface GptMessage {
  role: string;
  content: string;
}

export interface GptApiResponse {
  choices: GptChoice[];
}

export interface GptChoice {
  message: GptMessage;
}

export enum GptModel {
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_3_5_TURBO = "gpt-3.5-turbo",
  GPT_4O = "gpt-4o"
}
