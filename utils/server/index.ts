import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import { OpenAIModelID } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

function isBeta(modelId: string) {
  return [OpenAIModelID.GPT_4_O_1_PREVIEW.toString(), OpenAIModelID.GPT_4_O_1_MINI.toString()].includes(modelId)
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
  tokenCount: number,
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  const isStream = !isBeta(model.id);

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
      messages: [
        ...(isBeta(model.id)
          ? []
          : [{ role: 'system', content: systemPrompt }]),
        ...messages,
      ],
      max_completion_tokens: model.completionTokenLimit,
      temperature: isBeta(model.id) ? 1 : temperature,
      stream: isStream,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (!res.ok) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${result?.value || res.statusText}`,
      );
    }
  }

  if (isStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data;

            if (data === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta?.content || '';
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        };

        const parser = createParser(onParse);

        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return stream;
  } else {
    const json = await res.json();
    const text = json.choices[0].message.content;
    const stream = new ReadableStream({
      start(controller) {
        const queue = encoder.encode(text);
        controller.enqueue(queue);
        controller.close();
      },
    });

    return stream;
  }
};
