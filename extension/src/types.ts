export type HintLevel = 1 | 2 | 3;

export interface HintRequestMessage {
  type: 'AP_STUDY_HINT_REQUEST';
  problemText: string;
  level: HintLevel;
}

export interface HintResponseMessage {
  ok: boolean;
  hint?: string;
  error?: string;
  level?: HintLevel;
}

export interface ExtractedProblem {
  text: string;
  choices: string[];
}

export interface AnthropicTextBlock {
  type?: string;
  text?: string;
}

export interface AnthropicMessagesResponse {
  content?: AnthropicTextBlock[];
}
