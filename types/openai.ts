import { OPENAI_API_TYPE } from '../utils/app/const';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
  requestLimit: number;
  completionTokenLimit: number;
}

export enum OpenAIModelID {
  GPT_4_O = 'gpt-4o',
  GPT_4_O_MINI = 'gpt-4o-mini',
  GPT_4_O_1_PREVIEW = 'o1-preview',
  GPT_4_O_1_MINI = 'o1-mini'
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4_O;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_4_O]: {
    id: OpenAIModelID.GPT_4_O,
    name: 'GPT-4-O（推奨モデル）',
    maxLength: 380000,
    tokenLimit: 128000,
    requestLimit: 95000,
    completionTokenLimit: 16384,
  },
  [OpenAIModelID.GPT_4_O_MINI]: {
    id: OpenAIModelID.GPT_4_O_MINI,
    name: 'GPT-4-O-MINI',
    maxLength: 380000,
    tokenLimit: 128000,
    requestLimit: 95000,
    completionTokenLimit: 16384,
  },
  [OpenAIModelID.GPT_4_O_1_PREVIEW]: {
    id: OpenAIModelID.GPT_4_O_1_PREVIEW,
    name: 'GPT-4-O-1-PREVIEW（ベータ版）',
    maxLength: 380000,
    tokenLimit: 128000,
    requestLimit: 95000,
    completionTokenLimit: 16384,
  },
  [OpenAIModelID.GPT_4_O_1_MINI]: {
    id: OpenAIModelID.GPT_4_O_1_MINI,
    name: 'GPT-4-O-1-MINI（ベータ版）',
    maxLength: 380000,
    tokenLimit: 128000,
    requestLimit: 95000,
    completionTokenLimit: 16384,
  },
};
