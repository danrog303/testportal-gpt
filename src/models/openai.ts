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
  GPT_5_2 = "gpt-5.2",
  GPT_5_1 = "gpt-5.1",
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano"
}
