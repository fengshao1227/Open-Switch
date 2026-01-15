export interface OpenCodeModel {
  name: string;
  thinking?: boolean;
  setCacheKey?: boolean;
}

export interface ProviderOptions {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface ProviderConfig {
  npm: string;
  name: string;
  options: ProviderOptions;
  models: Record<string, OpenCodeModel>;
}

export type McpServerType = "local" | "remote";

export interface McpServer {
  type: McpServerType;
  command?: string[];
  environment?: Record<string, string>;
  enabled?: boolean;
  timeout?: number;
  url?: string;
  headers?: Record<string, string>;
}

export interface OpenCodeConfig {
  $schema?: string;
  plugin?: string[];
  provider: Record<string, ProviderConfig>;
  mcp?: Record<string, McpServer>;
  instructions?: string[];
}

export interface Credential {
  type: string;
  key: string;
}

export type AuthConfig = Record<string, Credential>;

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export type SdkType =
  | "@ai-sdk/openai-compatible"
  | "@ai-sdk/openai"
  | "@ai-sdk/anthropic"
  | "@ai-sdk/google";

export const SDK_OPTIONS: { value: SdkType; label: string }[] = [
  { value: "@ai-sdk/openai-compatible", label: "OpenAI Compatible" },
  { value: "@ai-sdk/openai", label: "OpenAI" },
  { value: "@ai-sdk/anthropic", label: "Anthropic" },
  { value: "@ai-sdk/google", label: "Google" },
];
