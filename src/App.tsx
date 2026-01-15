import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit, AlertTriangle, Box, Sparkles, Eye, EyeOff, Settings, Globe, Server, FileText, Download, Check, Github, ExternalLink } from "lucide-react";
import { configApi, authApi, mcpApi, promptsApi } from "@/lib/api";
import type { ProviderConfig, OpenCodeModel, SdkType, McpServer, McpServerType, Prompt } from "@/types";
import { SDK_OPTIONS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";

type TabType = "providers" | "mcp" | "prompts";

interface ProviderFormData {
  id: string;
  npm: SdkType;
  name: string;
  baseURL: string;
  apiKey: string;
  customHeaders: string;
  models: { id: string; name: string; thinking: boolean; setCacheKey: boolean }[];
}

const defaultFormData: ProviderFormData = {
  id: "",
  npm: "@ai-sdk/openai-compatible",
  name: "",
  baseURL: "",
  apiKey: "",
  customHeaders: "",
  models: [],
};

interface McpFormData {
  name: string;
  type: McpServerType;
  command: string;
  environment: string;
  url: string;
  headers: string;
  timeout: string;
  enabled: boolean;
}

const defaultMcpFormData: McpFormData = {
  name: "",
  type: "local",
  command: "",
  environment: "",
  url: "",
  headers: "",
  timeout: "",
  enabled: true,
};

function App() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("providers");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(defaultFormData);
  const [newModelId, setNewModelId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isMcpAddOpen, setIsMcpAddOpen] = useState(false);
  const [editingMcp, setEditingMcp] = useState<string | null>(null);
  const [mcpFormData, setMcpFormData] = useState<McpFormData>(defaultMcpFormData);
  const [mcpDeleteConfirmOpen, setMcpDeleteConfirmOpen] = useState(false);
  const [mcpToDelete, setMcpToDelete] = useState<string | null>(null);

  const [isPromptAddOpen, setIsPromptAddOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptFormData, setPromptFormData] = useState({ name: "", description: "", content: "" });
  const [promptDeleteConfirmOpen, setPromptDeleteConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: configApi.getConfig,
  });

  const { data: credentials } = useQuery({
    queryKey: ["credentials"],
    queryFn: authApi.getCredentials,
  });

  const { data: mcpServers, isLoading: isMcpLoading } = useQuery({
    queryKey: ["mcp"],
    queryFn: mcpApi.getServers,
  });

  const { data: prompts, isLoading: isPromptsLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: promptsApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: ProviderConfig }) =>
      configApi.addProvider(id, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success(t("provider.addedSuccess"));
      closeDialog();
    },
    onError: (error) => {
      toast.error(`${t("provider.addFailed")}: ${error}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: ProviderConfig }) =>
      configApi.updateProvider(id, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success(t("provider.updatedSuccess"));
      closeDialog();
    },
    onError: (error) => {
      toast.error(`${t("provider.updateFailed")}: ${error}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: configApi.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success(t("provider.deletedSuccess"));
      closeDeleteDialog();
    },
    onError: (error) => {
      toast.error(`${t("provider.deleteFailed")}: ${error}`);
    },
  });

  const setCredentialMutation = useMutation({
    mutationFn: ({ id, apiKey }: { id: string; apiKey: string }) =>
      authApi.setCredential(id, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
    onError: (error) => {
      toast.error(`${t("key.saveFailed")}: ${error}`);
    },
  });

  const addMcpMutation = useMutation({
    mutationFn: ({ name, server }: { name: string; server: McpServer }) =>
      mcpApi.addServer(name, server),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp"] });
      toast.success(t("mcp.addedSuccess"));
      closeMcpDialog();
    },
    onError: (error) => {
      toast.error(`${t("mcp.addFailed")}: ${error}`);
    },
  });

  const updateMcpMutation = useMutation({
    mutationFn: ({ name, server }: { name: string; server: McpServer }) =>
      mcpApi.updateServer(name, server),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp"] });
      toast.success(t("mcp.updatedSuccess"));
      closeMcpDialog();
    },
    onError: (error) => {
      toast.error(`${t("mcp.updateFailed")}: ${error}`);
    },
  });

  const deleteMcpMutation = useMutation({
    mutationFn: mcpApi.deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp"] });
      toast.success(t("mcp.deletedSuccess"));
      closeMcpDeleteDialog();
    },
    onError: (error) => {
      toast.error(`${t("mcp.deleteFailed")}: ${error}`);
    },
  });

  const toggleMcpMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      mcpApi.toggleServer(name, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp"] });
    },
    onError: (error) => {
      toast.error(`${t("mcp.toggleFailed")}: ${error}`);
    },
  });

  const upsertPromptMutation = useMutation({
    mutationFn: promptsApi.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(editingPrompt ? t("prompts.updatedSuccess") : t("prompts.addedSuccess"));
      closePromptDialog();
    },
    onError: (error) => {
      toast.error(`${editingPrompt ? t("prompts.updateFailed") : t("prompts.addFailed")}: ${error}`);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: promptsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(t("prompts.deletedSuccess"));
      closePromptDeleteDialog();
    },
    onError: (error) => {
      toast.error(`${t("prompts.deleteFailed")}: ${error}`);
    },
  });

  const enablePromptMutation = useMutation({
    mutationFn: promptsApi.enable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(t("prompts.enabledSuccess"));
    },
    onError: (error) => {
      toast.error(`${t("prompts.enableFailed")}: ${error}`);
    },
  });

  const importPromptMutation = useMutation({
    mutationFn: promptsApi.importFromFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(t("prompts.importSuccess"));
    },
    onError: (error) => {
      toast.error(`${t("prompts.importFailed")}: ${error}`);
    },
  });

  const hasApiKey = (providerId: string) => {
    return credentials && providerId in credentials;
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingProvider(null);
    setFormData(defaultFormData);
    setNewModelId("");
    setShowApiKey(false);
  };

  const closeDeleteDialog = () => {
    setDeleteConfirmOpen(false);
    setProviderToDelete(null);
  };

  const closeMcpDialog = () => {
    setIsMcpAddOpen(false);
    setEditingMcp(null);
    setMcpFormData(defaultMcpFormData);
  };

  const closeMcpDeleteDialog = () => {
    setMcpDeleteConfirmOpen(false);
    setMcpToDelete(null);
  };

  const closePromptDialog = () => {
    setIsPromptAddOpen(false);
    setEditingPrompt(null);
    setPromptFormData({ name: "", description: "", content: "" });
  };

  const closePromptDeleteDialog = () => {
    setPromptDeleteConfirmOpen(false);
    setPromptToDelete(null);
  };

  const openPromptEditDialog = (id: string, prompt: Prompt) => {
    setPromptFormData({
      name: prompt.name,
      description: prompt.description ?? "",
      content: prompt.content,
    });
    setEditingPrompt(id);
  };

  const confirmPromptDelete = (id: string) => {
    setPromptToDelete(id);
    setPromptDeleteConfirmOpen(true);
  };

  const handlePromptSubmit = async () => {
    if (!promptFormData.name.trim()) {
      toast.error(t("prompts.nameRequired"));
      return;
    }
    if (!promptFormData.content.trim()) {
      toast.error(t("prompts.contentRequired"));
      return;
    }

    const now = Date.now();
    const prompt: Prompt = {
      id: editingPrompt ?? `prompt-${now}`,
      name: promptFormData.name.trim(),
      content: promptFormData.content,
      description: promptFormData.description.trim() || undefined,
      enabled: false,
      createdAt: editingPrompt ? undefined : now,
      updatedAt: now,
    };

    await upsertPromptMutation.mutateAsync(prompt);
  };

  const openMcpEditDialog = (name: string, server: McpServer) => {
    setMcpFormData({
      name,
      type: server.type,
      command: server.command?.join("\n") ?? "",
      environment: server.environment ? JSON.stringify(server.environment, null, 2) : "",
      url: server.url ?? "",
      headers: server.headers ? JSON.stringify(server.headers, null, 2) : "",
      timeout: server.timeout?.toString() ?? "",
      enabled: server.enabled ?? true,
    });
    setEditingMcp(name);
  };

  const confirmMcpDelete = (name: string) => {
    setMcpToDelete(name);
    setMcpDeleteConfirmOpen(true);
  };

  const handleMcpSubmit = async () => {
    if (!mcpFormData.name) {
      toast.error(t("mcp.nameRequired"));
      return;
    }

    if (mcpFormData.type === "local" && !mcpFormData.command.trim()) {
      toast.error(t("mcp.commandRequired"));
      return;
    }

    if (mcpFormData.type === "remote" && !mcpFormData.url.trim()) {
      toast.error(t("mcp.urlRequired"));
      return;
    }

    let environment: Record<string, string> | undefined;
    if (mcpFormData.environment.trim()) {
      try {
        environment = JSON.parse(mcpFormData.environment);
      } catch {
        toast.error(t("mcp.invalidEnvironment"));
        return;
      }
    }

    let headers: Record<string, string> | undefined;
    if (mcpFormData.headers.trim()) {
      try {
        headers = JSON.parse(mcpFormData.headers);
      } catch {
        toast.error(t("mcp.invalidHeaders"));
        return;
      }
    }

    const server: McpServer = {
      type: mcpFormData.type,
      enabled: mcpFormData.enabled,
      ...(mcpFormData.type === "local" && {
        command: mcpFormData.command.split("\n").map(s => s.trim()).filter(Boolean),
        environment,
      }),
      ...(mcpFormData.type === "remote" && {
        url: mcpFormData.url,
        headers,
      }),
      ...(mcpFormData.timeout && { timeout: parseInt(mcpFormData.timeout, 10) }),
    };

    try {
      if (editingMcp) {
        await updateMcpMutation.mutateAsync({ name: mcpFormData.name, server });
      } else {
        await addMcpMutation.mutateAsync({ name: mcpFormData.name, server });
      }
    } catch {
      return;
    }
  };

  const openEditDialog = (id: string, provider: ProviderConfig) => {
    const models = Object.entries(provider.models).map(([modelId, model]) => ({
      id: modelId,
      name: model.name,
      thinking: model.thinking ?? false,
      setCacheKey: model.setCacheKey ?? false,
    }));

    setFormData({
      id,
      npm: provider.npm as SdkType,
      name: provider.name,
      baseURL: provider.options.baseURL,
      apiKey: "",
      customHeaders: provider.options.headers ? JSON.stringify(provider.options.headers, null, 2) : "",
      models,
    });
    setEditingProvider(id);
  };

  const confirmDelete = (id: string) => {
    setProviderToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.name || !formData.baseURL) {
      toast.error(t("form.requiredFields"));
      return;
    }

    const models: Record<string, OpenCodeModel> = {};
    formData.models.forEach((m) => {
      models[m.id] = {
        name: m.name,
        thinking: m.thinking || undefined,
        setCacheKey: m.setCacheKey || undefined,
      };
    });

    let headers: Record<string, string> | undefined;
    if (formData.customHeaders.trim()) {
      try {
        headers = JSON.parse(formData.customHeaders);
      } catch {
        toast.error(t("form.invalidHeaders"));
        return;
      }
    }

    const provider: ProviderConfig = {
      npm: formData.npm,
      name: formData.name,
      options: { 
        baseURL: formData.baseURL,
        headers: headers,
      },
      models,
    };

    try {
      if (editingProvider) {
        await updateMutation.mutateAsync({ id: formData.id, provider });
      } else {
        await addMutation.mutateAsync({ id: formData.id, provider });
      }

      if (formData.apiKey.trim()) {
        await setCredentialMutation.mutateAsync({ id: formData.id, apiKey: formData.apiKey.trim() });
      }
    } catch {
      return;
    }
  };

  const addModel = () => {
    if (!newModelId.trim()) return;
    setFormData((prev) => ({
      ...prev,
      models: [
        ...prev.models,
        { id: newModelId, name: newModelId, thinking: false, setCacheKey: false },
      ],
    }));
    setNewModelId("");
  };

  const removeModel = (modelId: string) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models.filter((m) => m.id !== modelId),
    }));
  };

  const updateModel = (
    modelId: string,
    field: "thinking" | "setCacheKey",
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models.map((m) =>
        m.id === modelId ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const providers = config?.provider ?? {};

  const ProviderSkeleton = () => (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel animate-pulse rounded-lg p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="h-6 w-1/3 rounded bg-muted/50" />
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded bg-muted/50" />
              <div className="h-8 w-8 rounded bg-muted/50" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-1/4 rounded bg-muted/30" />
            <div className="h-4 w-1/2 rounded bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background font-sans selection:bg-primary/20 text-foreground overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-20" />
      
      <div className="relative mx-auto max-w-4xl space-y-8 p-6 lg:p-12">
        <header className="glass-panel flex items-center justify-between rounded-2xl p-6 transition-all hover:neon-glow">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="group flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all hover:bg-primary/20 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{t("app.title")}</h1>
              <p className="text-sm font-medium text-muted-foreground/80">
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          {activeTab === "providers" && (
            <Button 
              onClick={() => setIsAddOpen(true)} 
              className="h-10 px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("provider.add")}
            </Button>
          )}
          {activeTab === "mcp" && (
            <Button 
              onClick={() => setIsMcpAddOpen(true)} 
              className="h-10 px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("mcp.add")}
            </Button>
          )}
        </header>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("providers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === "providers"
                ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Box className="h-4 w-4" />
            {t("tabs.providers")}
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === "mcp"
                ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Server className="h-4 w-4" />
            {t("tabs.mcp")}
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === "prompts"
                ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <FileText className="h-4 w-4" />
            {t("tabs.prompts")}
          </button>
        </div>

        {activeTab === "providers" && (
          <>
            {isLoading ? (
          <ProviderSkeleton />
        ) : Object.keys(providers).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border-dashed border-2 border-muted py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
                <Box className="h-10 w-10 text-primary/60" />
              </div>
              <h3 className="text-xl font-medium text-foreground">{t("provider.noProviders")}</h3>
              <p className="mb-8 mt-2 max-w-sm text-sm text-muted-foreground">
                {t("provider.getStarted")}
              </p>
              <Button onClick={() => setIsAddOpen(true)} variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                {t("provider.createConfig")}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(providers).map(([id, provider]) => (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className="glass-panel group relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 ring-1 ring-white/5 font-mono text-lg font-bold text-primary">
                          {provider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold tracking-tight text-foreground/90">
                            {provider.name}
                          </CardTitle>
                          <div className="mt-0.5 flex items-center gap-2">
                             <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">ID</span>
                             <span className="font-mono text-xs text-muted-foreground">{id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 transition-all duration-200 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => openEditDialog(id, provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => confirmDelete(id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                      <div className="grid gap-3 rounded-lg bg-black/20 p-3 text-sm ring-1 ring-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.sdk")}</span>
                          <code className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary/90">
                            {provider.npm}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.url")}</span>
                          <code className="max-w-[200px] truncate rounded bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground/80">
                            {provider.options.baseURL}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.key")}</span>
                          {hasApiKey(id) ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                              {t("key.configured")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              {t("key.notSet")}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {Object.keys(provider.models).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {Object.keys(provider.models).map((modelId) => (
                            <span
                              key={modelId}
                              className="inline-flex items-center rounded-md bg-secondary/50 px-2.5 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-white/5 transition-colors hover:bg-secondary hover:text-primary"
                            >
                              {modelId}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <Dialog open={isAddOpen || !!editingProvider} onOpenChange={closeDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg border-border/80 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProvider ? t("provider.edit") : t("provider.new")}
              </DialogTitle>
              <DialogDescription>
                {t("app.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">{t("form.providerId")}</Label>
                  <Input
                    id="id"
                    placeholder={t("form.providerIdPlaceholder")}
                    value={formData.id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, id: e.target.value }))
                    }
                    disabled={!!editingProvider}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("form.displayName")}</Label>
                  <Input
                    id="name"
                    placeholder={t("form.displayNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sdk">{t("form.sdkConfig")}</Label>
                <Select
                  value={formData.npm}
                  onValueChange={(value: SdkType) =>
                    setFormData((prev) => ({ ...prev, npm: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SDK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseURL">{t("form.apiEndpoint")}</Label>
                <Input
                  id="baseURL"
                  placeholder={t("form.apiEndpointPlaceholder")}
                  value={formData.baseURL}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, baseURL: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  {t("form.apiKey")}
                  {editingProvider && hasApiKey(editingProvider) && (
                    <span className="text-xs text-green-500">({t("form.apiKeyConfigured")})</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder={editingProvider && hasApiKey(editingProvider) ? t("form.apiKeyKeepCurrent") : t("form.apiKeyPlaceholder")}
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers" className="flex items-center gap-2">
                  {t("form.headers")}
                  <span className="text-xs text-muted-foreground">({t("form.headersOptional")})</span>
                </Label>
                <textarea
                  id="headers"
                  placeholder={t("form.headersPlaceholder")}
                  value={formData.customHeaders}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customHeaders: e.target.value }))
                  }
                  className="w-full h-20 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label>{t("form.models")}</Label>
                  <span className="text-xs text-muted-foreground">{t("form.modelsCount", { count: formData.models.length })}</span>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder={t("form.modelIdPlaceholder")}
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addModel()}
                    className="font-mono text-sm"
                  />
                  <Button type="button" onClick={addModel} variant="secondary">
                    {t("button.add")}
                  </Button>
                </div>

                <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-2">
                  {formData.models.length === 0 ? (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      {t("form.noModels")}
                    </div>
                  ) : (
                    formData.models.map((model) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        key={model.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-2 shadow-sm"
                      >
                        <span className="font-mono text-sm font-medium pl-1">{model.id}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-3 px-2">
                            <label className="flex cursor-pointer items-center gap-1.5 rounded hover:bg-muted px-1 py-0.5 transition-colors">
                              <Switch
                                className="scale-75"
                                checked={model.thinking}
                                onCheckedChange={(v) =>
                                  updateModel(model.id, "thinking", v)
                                }
                              />
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{t("model.think")}</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-1.5 rounded hover:bg-muted px-1 py-0.5 transition-colors">
                              <Switch
                                className="scale-75"
                                checked={model.setCacheKey}
                                onCheckedChange={(v) =>
                                  updateModel(model.id, "setCacheKey", v)
                                }
                              />
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{t("model.cache")}</span>
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeModel(model.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog}>
                {t("button.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={addMutation.isPending || updateMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editingProvider ? t("button.save") : t("button.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <DialogTitle>{t("provider.delete")}?</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                {t("provider.deleteConfirm")} <span className="font-semibold text-foreground">{providerToDelete}</span>? {t("provider.deleteWarning")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="ghost" onClick={closeDeleteDialog}>
                {t("button.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => providerToDelete && deleteMutation.mutate(providerToDelete)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t("button.deleting") : t("provider.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}

        {activeTab === "mcp" && (
          <>
            {isMcpLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-panel animate-pulse rounded-lg p-6">
                    <div className="flex items-center justify-between pb-4">
                      <div className="h-6 w-1/3 rounded bg-muted/50" />
                      <div className="h-8 w-16 rounded bg-muted/50" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-1/2 rounded bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !mcpServers || Object.keys(mcpServers).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border-dashed border-2 border-muted py-24 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
                    <Server className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">{t("mcp.noServers")}</h3>
                  <p className="mb-8 mt-2 max-w-sm text-sm text-muted-foreground">
                    {t("mcp.getStarted")}
                  </p>
                  <Button onClick={() => setIsMcpAddOpen(true)} variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                    {t("mcp.createFirst")}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div layout className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {Object.entries(mcpServers).map(([name, server]) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Card className="glass-panel group relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 ring-1 ring-white/5">
                              <Server className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold tracking-tight text-foreground/90">
                                {name}
                              </CardTitle>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  server.type === "local" 
                                    ? "bg-blue-500/20 text-blue-400" 
                                    : "bg-purple-500/20 text-purple-400"
                                }`}>
                                  {server.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={server.enabled ?? true}
                              onCheckedChange={(enabled) => toggleMcpMutation.mutate({ name, enabled })}
                            />
                            <div className="flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => openMcpEditDialog(name, server)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => confirmMcpDelete(name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className="rounded-lg bg-black/20 p-3 text-sm ring-1 ring-white/5">
                            {server.type === "local" && server.command && (
                              <code className="font-mono text-xs text-muted-foreground break-all">
                                {server.command.join(" ")}
                              </code>
                            )}
                            {server.type === "remote" && server.url && (
                              <code className="font-mono text-xs text-muted-foreground break-all">
                                {server.url}
                              </code>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            <Dialog open={isMcpAddOpen || !!editingMcp} onOpenChange={closeMcpDialog}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg border-border/80 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingMcp ? t("mcp.edit") : t("mcp.new")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("mcp.description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="mcpName">{t("mcp.serverName")}</Label>
                    <Input
                      id="mcpName"
                      placeholder={t("mcp.serverNamePlaceholder")}
                      value={mcpFormData.name}
                      onChange={(e) => setMcpFormData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!!editingMcp}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("mcp.serverType")}</Label>
                    <Select
                      value={mcpFormData.type}
                      onValueChange={(value: McpServerType) => setMcpFormData((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">{t("mcp.typeLocal")}</SelectItem>
                        <SelectItem value="remote">{t("mcp.typeRemote")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {mcpFormData.type === "local" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="mcpCommand">{t("mcp.command")}</Label>
                        <textarea
                          id="mcpCommand"
                          placeholder={t("mcp.commandPlaceholder")}
                          value={mcpFormData.command}
                          onChange={(e) => setMcpFormData((prev) => ({ ...prev, command: e.target.value }))}
                          className="w-full h-24 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">{t("mcp.commandHint")}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mcpEnv" className="flex items-center gap-2">
                          {t("mcp.environment")}
                          <span className="text-xs text-muted-foreground">({t("form.headersOptional")})</span>
                        </Label>
                        <textarea
                          id="mcpEnv"
                          placeholder={t("mcp.environmentPlaceholder")}
                          value={mcpFormData.environment}
                          onChange={(e) => setMcpFormData((prev) => ({ ...prev, environment: e.target.value }))}
                          className="w-full h-20 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </>
                  )}

                  {mcpFormData.type === "remote" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="mcpUrl">{t("mcp.url")}</Label>
                        <Input
                          id="mcpUrl"
                          placeholder={t("mcp.urlPlaceholder")}
                          value={mcpFormData.url}
                          onChange={(e) => setMcpFormData((prev) => ({ ...prev, url: e.target.value }))}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mcpHeaders" className="flex items-center gap-2">
                          {t("mcp.headers")}
                          <span className="text-xs text-muted-foreground">({t("form.headersOptional")})</span>
                        </Label>
                        <textarea
                          id="mcpHeaders"
                          placeholder={t("form.headersPlaceholder")}
                          value={mcpFormData.headers}
                          onChange={(e) => setMcpFormData((prev) => ({ ...prev, headers: e.target.value }))}
                          className="w-full h-20 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mcpTimeout" className="flex items-center gap-2">
                        {t("mcp.timeout")}
                        <span className="text-xs text-muted-foreground">({t("form.headersOptional")})</span>
                      </Label>
                      <Input
                        id="mcpTimeout"
                        type="number"
                        placeholder="5000"
                        value={mcpFormData.timeout}
                        onChange={(e) => setMcpFormData((prev) => ({ ...prev, timeout: e.target.value }))}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("mcp.enabled")}</Label>
                      <div className="flex items-center h-10">
                        <Switch
                          checked={mcpFormData.enabled}
                          onCheckedChange={(v) => setMcpFormData((prev) => ({ ...prev, enabled: v }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={closeMcpDialog}>
                    {t("button.cancel")}
                  </Button>
                  <Button
                    onClick={handleMcpSubmit}
                    disabled={addMcpMutation.isPending || updateMcpMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {editingMcp ? t("button.save") : t("button.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={mcpDeleteConfirmOpen} onOpenChange={setMcpDeleteConfirmOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <DialogTitle>{t("mcp.delete")}?</DialogTitle>
                  </div>
                  <DialogDescription className="pt-2">
                    {t("mcp.deleteConfirm")} <span className="font-semibold text-foreground">{mcpToDelete}</span>? {t("mcp.deleteWarning")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={closeMcpDeleteDialog}>
                    {t("button.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => mcpToDelete && deleteMcpMutation.mutate(mcpToDelete)}
                    disabled={deleteMcpMutation.isPending}
                  >
                    {deleteMcpMutation.isPending ? t("button.deleting") : t("mcp.delete")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {activeTab === "prompts" && (
          <>
            {isPromptsLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-panel animate-pulse rounded-lg p-6">
                    <div className="flex items-center justify-between pb-4">
                      <div className="h-6 w-1/3 rounded bg-muted/50" />
                      <div className="h-8 w-16 rounded bg-muted/50" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-1/2 rounded bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !prompts || Object.keys(prompts).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="glass-panel flex flex-col items-center justify-center rounded-2xl border-dashed border-2 border-muted py-24 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
                    <FileText className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">{t("prompts.noPrompts")}</h3>
                  <p className="mb-8 mt-2 max-w-sm text-sm text-muted-foreground">
                    {t("prompts.getStarted")}
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setIsPromptAddOpen(true)} variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                      {t("prompts.createFirst")}
                    </Button>
                    <Button onClick={() => importPromptMutation.mutate()} variant="ghost" disabled={importPromptMutation.isPending}>
                      <Download className="mr-2 h-4 w-4" />
                      {t("prompts.import")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div layout className="grid gap-4">
                <div className="flex justify-end gap-2 mb-2">
                  <Button onClick={() => importPromptMutation.mutate()} variant="ghost" size="sm" disabled={importPromptMutation.isPending}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("prompts.import")}
                  </Button>
                </div>
                <AnimatePresence mode="popLayout">
                  {Object.entries(prompts).map(([id, prompt]) => (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Card className={`glass-panel group relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${prompt.enabled ? "ring-2 ring-primary/50" : ""}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-white/5 ${prompt.enabled ? "bg-primary/20" : "bg-secondary/50"}`}>
                              <FileText className={`h-5 w-5 ${prompt.enabled ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold tracking-tight text-foreground/90 flex items-center gap-2">
                                {prompt.name}
                                {prompt.enabled && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                    <Check className="h-3 w-3" />
                                    {t("prompts.active")}
                                  </span>
                                )}
                              </CardTitle>
                              {prompt.description && (
                                <p className="mt-0.5 text-sm text-muted-foreground">{prompt.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!prompt.enabled && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                                onClick={() => enablePromptMutation.mutate(id)}
                                disabled={enablePromptMutation.isPending}
                              >
                                {t("prompts.activate")}
                              </Button>
                            )}
                            <div className="flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => openPromptEditDialog(id, prompt)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => confirmPromptDelete(id)}
                                disabled={prompt.enabled}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className="rounded-lg bg-black/20 p-3 text-sm ring-1 ring-white/5 max-h-24 overflow-hidden">
                            <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all line-clamp-3">
                              {prompt.content.slice(0, 300)}{prompt.content.length > 300 ? "..." : ""}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            <Dialog open={isPromptAddOpen || !!editingPrompt} onOpenChange={closePromptDialog}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-border/80 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingPrompt ? t("prompts.edit") : t("prompts.new")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("prompts.description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="promptName">{t("prompts.name")}</Label>
                    <Input
                      id="promptName"
                      placeholder={t("prompts.namePlaceholder")}
                      value={promptFormData.name}
                      onChange={(e) => setPromptFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promptDescription" className="flex items-center gap-2">
                      {t("prompts.descriptionLabel")}
                      <span className="text-xs text-muted-foreground">({t("form.headersOptional")})</span>
                    </Label>
                    <Input
                      id="promptDescription"
                      placeholder={t("prompts.descriptionPlaceholder")}
                      value={promptFormData.description}
                      onChange={(e) => setPromptFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promptContent">{t("prompts.content")}</Label>
                    <textarea
                      id="promptContent"
                      placeholder={t("prompts.contentPlaceholder")}
                      value={promptFormData.content}
                      onChange={(e) => setPromptFormData((prev) => ({ ...prev, content: e.target.value }))}
                      className="w-full h-64 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={closePromptDialog}>
                    {t("button.cancel")}
                  </Button>
                  <Button
                    onClick={handlePromptSubmit}
                    disabled={upsertPromptMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {editingPrompt ? t("button.save") : t("button.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={promptDeleteConfirmOpen} onOpenChange={setPromptDeleteConfirmOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <DialogTitle>{t("prompts.delete")}?</DialogTitle>
                  </div>
                  <DialogDescription className="pt-2">
                    {t("prompts.deleteConfirm")} <span className="font-semibold text-foreground">{promptToDelete}</span>? {t("prompts.deleteWarning")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={closePromptDeleteDialog}>
                    {t("button.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => promptToDelete && deletePromptMutation.mutate(promptToDelete)}
                    disabled={deletePromptMutation.isPending}
                  >
                    {deletePromptMutation.isPending ? t("button.deleting") : t("prompts.delete")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <DialogTitle>{t("settings.title")}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label>{t("language.label")}</Label>
                </div>
                <Select value={i18n.language.split("-")[0]} onValueChange={(lang) => i18n.changeLanguage(lang)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("language.en")}</SelectItem>
                    <SelectItem value="zh">{t("language.zh")}</SelectItem>
                    <SelectItem value="ja">{t("language.ja")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <Label>{t("settings.about")}</Label>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("settings.version")}</span>
                    <span className="font-mono text-foreground/80">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("settings.author")}</span>
                    <span className="text-foreground/80">fengshao1227</span>
                  </div>
                  <a
                    href="https://github.com/fengshao1227/Open-Switch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between group py-1.5 -mx-2 px-2 rounded-md hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-muted-foreground group-hover:text-primary">GitHub</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary" />
                  </a>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSettingsOpen(false)}>
                {t("button.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
