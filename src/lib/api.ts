import { invoke } from "@tauri-apps/api/core";
import type { OpenCodeConfig, ProviderConfig, AuthConfig, McpServer, Prompt } from "@/types";

export const configApi = {
  getConfig: () => invoke<OpenCodeConfig>("get_config"),

  saveConfig: (config: OpenCodeConfig) =>
    invoke<boolean>("save_config", { config }),

  addProvider: (id: string, provider: ProviderConfig) =>
    invoke<boolean>("add_provider", { id, provider }),

  updateProvider: (id: string, provider: ProviderConfig) =>
    invoke<boolean>("update_provider", { id, provider }),

  deleteProvider: (id: string) => invoke<boolean>("delete_provider", { id }),

  getConfigPath: () => invoke<string>("get_config_path"),
};

export const authApi = {
  getCredentials: () => invoke<AuthConfig>("get_credentials"),

  setCredential: (id: string, apiKey: string) =>
    invoke<boolean>("set_credential", { id, apiKey }),

  deleteCredential: (id: string) =>
    invoke<boolean>("delete_credential", { id }),

  hasCredential: (id: string) => invoke<boolean>("has_credential", { id }),
};

export const mcpApi = {
  getServers: () => invoke<Record<string, McpServer>>("get_mcp_servers"),

  addServer: (name: string, server: McpServer) =>
    invoke<boolean>("add_mcp_server", { name, server }),

  updateServer: (name: string, server: McpServer) =>
    invoke<boolean>("update_mcp_server", { name, server }),

  deleteServer: (name: string) => invoke<boolean>("delete_mcp_server", { name }),

  toggleServer: (name: string, enabled: boolean) =>
    invoke<boolean>("toggle_mcp_server", { name, enabled }),
};

export const instructionsApi = {
  getAll: () => invoke<string[]>("get_instructions"),

  add: (path: string) => invoke<boolean>("add_instruction", { path }),

  remove: (path: string) => invoke<boolean>("remove_instruction", { path }),

  updateAll: (paths: string[]) => invoke<boolean>("update_instructions", { paths }),
};

export const promptsApi = {
  getAll: () => invoke<Record<string, Prompt>>("get_prompts"),

  upsert: (prompt: Prompt) => invoke<boolean>("upsert_prompt", { prompt }),

  delete: (id: string) => invoke<boolean>("delete_prompt", { id }),

  enable: (id: string) => invoke<boolean>("enable_prompt", { id }),

  importFromFile: () => invoke<string>("import_prompt_from_file"),

  getCurrentFileContent: () => invoke<string | null>("get_current_prompt_file_content"),
};
