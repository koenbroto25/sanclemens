/**
 * LLM (Large Language Model) utility for generating responses using Gemini
 */

const GEMINI_LLM_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_TOOL_LLM_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'; // Gemini 1.5 Flash supports tool use

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  raw?: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: any; // JSON schema for tool parameters
}

export interface ToolCall {
  name: string;
  args: any;
}

export interface LLMToolResponse {
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  raw?: any;
}

export interface LLMToolRequest extends LLMRequest {
  tools?: Tool[];
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Generate response using Gemini LLM
 */
export async function generateLLMResponse(request: LLMRequest): Promise<LLMResponse> {
  try {
    const {
      prompt,
      systemPrompt,
      temperature = 0.7,
      maxTokens = 1024,
      apiKey
    } = request;

    const key = apiKey || process.env.GOOGLE_API_KEY_1;
    if (!key) {
      throw new Error('GOOGLE_API_KEY_1 is not set');
    }

    const contents: any[] = [
      {
        parts: [{ text: prompt }]
      }
    ];

    // Add system prompt if provided
    if (systemPrompt) {
      contents.unshift({
        role: 'system',
        parts: [{ text: systemPrompt }]
      });
    }

    const response = await fetch(`${GEMINI_LLM_API}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error: ${response.status}`, errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    return {
      text,
      usage: {
        input_tokens: usage.promptTokenCount || 0,
        output_tokens: usage.candidatesTokenCount || 0
      },
      raw: data
    };
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw error;
  }
}

/**
 * Generate response using Gemini LLM with tool use capabilities
 */
export async function generateLLMResponseWithTools(request: LLMToolRequest): Promise<LLMToolResponse> {
  try {
    const {
      prompt,
      systemPrompt,
      temperature = 0.7,
      maxTokens = 1024,
      apiKey,
      tools,
      chatHistory = [],
    } = request;

    const key = apiKey || process.env.GOOGLE_API_KEY_1;
    if (!key) {
      throw new Error('GOOGLE_API_KEY_1 is not set');
    }

    const formattedChatHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const contents: any[] = [
      ...formattedChatHistory,
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // Add system prompt if provided, always at the beginning
    if (systemPrompt) {
      contents.unshift({
        role: 'system',
        parts: [{ text: systemPrompt }]
      });
    }

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    if (tools && tools.length > 0) {
      requestBody.tools = [{ functionDeclarations: tools }];
    }

    const response = await fetch(`${GEMINI_TOOL_LLM_API}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API with tools error: ${response.status}`, errorText);
      throw new Error(`LLM API with tools error: ${response.status}`);
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    const toolCalls: ToolCall[] = (candidate?.content?.parts || [])
      .filter((part: any) => part.functionCall)
      .map((part: any) => ({
        name: part.functionCall.name,
        args: part.functionCall.args,
      }));

    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        input_tokens: usage.promptTokenCount || 0,
        output_tokens: usage.candidatesTokenCount || 0
      },
      raw: data
    };
  } catch (error) {
    console.error('Error generating LLM response with tools:', error);
    throw error;
  }
}

/**
 * Generate response with chat history (for multi-turn conversations)
 */
export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: Omit<LLMRequest, 'prompt' | 'systemPrompt'> = {}
): Promise<LLMResponse> {
  try {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      apiKey
    } = options;

    const key = apiKey || process.env.GOOGLE_API_KEY_1;
    if (!key) {
      throw new Error('GOOGLE_API_KEY_1 is not set');
    }

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${GEMINI_LLM_API}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error: ${response.status}`, errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    return {
      text,
      usage: {
        input_tokens: usage.promptTokenCount || 0,
        output_tokens: usage.candidatesTokenCount || 0
      },
      raw: data
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

/**
 * Simple template-based prompt builder
 */
export function buildPrompt(
  template: string,
  variables: Record<string, string | string[]>
): string {
  let prompt = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = Array.isArray(value) ? value.join('\n') : value;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return prompt;
}