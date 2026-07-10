/**
 * AI Prompt Gateway — Centralized access to all AI prompts
 * 
 * This module provides a single point of access for all AI prompts in the application.
 * It loads prompts from individual files in this directory and provides functions
 * to retrieve them, with variable interpolation support.
 */

import { spiritualCompanionPrompt } from './spiritualCompanionPrompt';
import { learnCatholicBotPrompt } from './learnCatholicBotPrompt';
import { birthdayGreetingPrompt } from './birthdayGreetingPrompt';
import { patronSaintGreetingPrompt } from './patronSaintGreetingPrompt';
import { infoPublikPrompt } from './infoPublikPrompt';

export interface PromptTemplate {
  systemInstruction: string;
  contextTemplate?: string;
  variables?: Record<string, string>;
}

export type PromptName = 
  | 'spiritual_companion'
  | 'learn_catholic_bot'
  | 'birthday_greeting'
  | 'patron_saint_greeting'
  | 'info_publik';

const promptRegistry: Record<PromptName, PromptTemplate> = {
  spiritual_companion: spiritualCompanionPrompt,
  learn_catholic_bot: learnCatholicBotPrompt,
  birthday_greeting: birthdayGreetingPrompt,
  patron_saint_greeting: patronSaintGreetingPrompt,
  info_publik: infoPublikPrompt,
};

/**
 * Retrieve a single prompt by name
 */
export function getPrompt(name: PromptName): PromptTemplate {
  const prompt = promptRegistry[name];
  if (!prompt) {
    throw new Error(`Prompt "${name}" not found in registry.`);
  }
  return prompt;
}

/**
 * Retrieve multiple prompts and merge them (hybrid approach)
 * Useful when you need to combine system instructions from multiple prompts
 */
export function getHybridPrompt(names: PromptName[]): PromptTemplate {
  const prompts = names.map(name => getPrompt(name));
  
  return {
    systemInstruction: prompts.map(p => p.systemInstruction).filter(Boolean).join('\n\n'),
    contextTemplate: prompts.map(p => p.contextTemplate).filter(Boolean).join('\n\n') || undefined,
    variables: prompts.reduce((acc, p) => ({ ...acc, ...p.variables }), {}),
  };
}

/**
 * Interpolate variables into a template string
 */
export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Get a ready-to-use prompt with variables interpolated
 */
export function getReadyPrompt(name: PromptName, variables: Record<string, string> = {}): string {
  const prompt = getPrompt(name);
  const systemInstruction = interpolate(prompt.systemInstruction, { ...prompt.variables, ...variables });
  const contextTemplate = prompt.contextTemplate ? interpolate(prompt.contextTemplate, { ...prompt.variables, ...variables }) : undefined;
  
  return [systemInstruction, contextTemplate].filter(Boolean).join('\n\n');
}

export { promptRegistry };