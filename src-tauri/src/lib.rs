mod config;
mod database;
mod error;
mod prompt;
mod prompt_service;

use std::sync::Arc;
use tauri::{Manager, State};

use database::Database;
use prompt::Prompt;
use prompt_service::PromptService;

pub use config::{
    get_opencode_config, save_opencode_config, OpenCodeConfig, OpenCodeModel, ProviderConfig,
    get_auth_config, save_auth_config, AuthConfig, Credential, McpServer, McpServerType,
};
pub use error::AppError;

pub struct AppState {
    pub db: Arc<Database>,
}

#[tauri::command]
fn get_config() -> Result<OpenCodeConfig, String> {
    get_opencode_config().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_config(config: OpenCodeConfig) -> Result<bool, String> {
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn add_provider(id: String, provider: ProviderConfig) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    config.provider.insert(id, provider);
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn update_provider(id: String, provider: ProviderConfig) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    if !config.provider.contains_key(&id) {
        return Err(format!("Provider '{}' not found", id));
    }
    config.provider.insert(id, provider);
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn delete_provider(id: String) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    if config.provider.remove(&id).is_none() {
        return Err(format!("Provider '{}' not found", id));
    }
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_config_path() -> Result<String, String> {
    config::get_config_path()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_credentials() -> Result<AuthConfig, String> {
    get_auth_config().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_credential(id: String, api_key: String) -> Result<bool, String> {
    let mut auth = get_auth_config().map_err(|e| e.to_string())?;
    auth.insert(id, Credential {
        credential_type: "api".to_string(),
        key: api_key,
    });
    save_auth_config(&auth).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn delete_credential(id: String) -> Result<bool, String> {
    let mut auth = get_auth_config().map_err(|e| e.to_string())?;
    if auth.remove(&id).is_none() {
        return Err(format!("Credential '{}' not found", id));
    }
    save_auth_config(&auth).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn has_credential(id: String) -> Result<bool, String> {
    let auth = get_auth_config().map_err(|e| e.to_string())?;
    Ok(auth.contains_key(&id))
}

#[tauri::command]
fn get_mcp_servers() -> Result<std::collections::HashMap<String, McpServer>, String> {
    let config = get_opencode_config().map_err(|e| e.to_string())?;
    Ok(config.mcp.unwrap_or_default())
}

#[tauri::command]
fn add_mcp_server(name: String, mut server: McpServer) -> Result<bool, String> {
    if let Some(cmd) = server.command.take() {
        server.command = Some(McpServer::normalize_command_for_platform(cmd));
    }
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    let mcp = config.mcp.get_or_insert_with(std::collections::HashMap::new);
    mcp.insert(name, server);
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn update_mcp_server(name: String, mut server: McpServer) -> Result<bool, String> {
    if let Some(cmd) = server.command.take() {
        server.command = Some(McpServer::normalize_command_for_platform(cmd));
    }
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    let mcp = config.mcp.get_or_insert_with(std::collections::HashMap::new);
    if !mcp.contains_key(&name) {
        return Err(format!("MCP server '{}' not found", name));
    }
    mcp.insert(name, server);
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn delete_mcp_server(name: String) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    if let Some(ref mut mcp) = config.mcp {
        if mcp.remove(&name).is_none() {
            return Err(format!("MCP server '{}' not found", name));
        }
        if mcp.is_empty() {
            config.mcp = None;
        }
    } else {
        return Err(format!("MCP server '{}' not found", name));
    }
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn toggle_mcp_server(name: String, enabled: bool) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    if let Some(ref mut mcp) = config.mcp {
        if let Some(server) = mcp.get_mut(&name) {
            server.enabled = Some(enabled);
        } else {
            return Err(format!("MCP server '{}' not found", name));
        }
    } else {
        return Err(format!("MCP server '{}' not found", name));
    }
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_instructions() -> Result<Vec<String>, String> {
    let config = get_opencode_config().map_err(|e| e.to_string())?;
    Ok(config.instructions.unwrap_or_default())
}

#[tauri::command]
fn add_instruction(path: String) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    let instructions = config.instructions.get_or_insert_with(Vec::new);
    if !instructions.contains(&path) {
        instructions.push(path);
    }
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn remove_instruction(path: String) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    if let Some(ref mut instructions) = config.instructions {
        instructions.retain(|p| p != &path);
        if instructions.is_empty() {
            config.instructions = None;
        }
    }
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn update_instructions(paths: Vec<String>) -> Result<bool, String> {
    let mut config = get_opencode_config().map_err(|e| e.to_string())?;
    config.instructions = if paths.is_empty() { None } else { Some(paths) };
    save_opencode_config(&config).map_err(|e| e.to_string())?;
    Ok(true)
}

// ============ Prompt Commands ============

#[tauri::command]
fn get_prompts(state: State<'_, AppState>) -> Result<indexmap::IndexMap<String, Prompt>, String> {
    PromptService::get_prompts(&state.db).map_err(|e| e.to_string())
}

#[tauri::command]
fn upsert_prompt(state: State<'_, AppState>, prompt: Prompt) -> Result<bool, String> {
    PromptService::upsert_prompt(&state.db, prompt).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn delete_prompt(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    PromptService::delete_prompt(&state.db, &id).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn enable_prompt(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    PromptService::enable_prompt(&state.db, &id).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn import_prompt_from_file(state: State<'_, AppState>) -> Result<String, String> {
    PromptService::import_from_file(&state.db).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_current_prompt_file_content() -> Result<Option<String>, String> {
    PromptService::get_current_file_content().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(any(target_os = "macos", target_os = "windows", target_os = "linux"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_log::{Target, TargetKind};
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .targets([Target::new(TargetKind::Stdout)])
                        .build(),
                )?;
            }

            let db = Database::new().expect("Failed to initialize database");
            let db = Arc::new(db);

            if let Err(e) = PromptService::import_on_first_launch(&db) {
                log::warn!("Failed to auto-import prompts: {e}");
            }

            app.manage(AppState { db });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            add_provider,
            update_provider,
            delete_provider,
            get_config_path,
            get_credentials,
            set_credential,
            delete_credential,
            has_credential,
            get_mcp_servers,
            add_mcp_server,
            update_mcp_server,
            delete_mcp_server,
            toggle_mcp_server,
            get_instructions,
            add_instruction,
            remove_instruction,
            update_instructions,
            get_prompts,
            upsert_prompt,
            delete_prompt,
            enable_prompt,
            import_prompt_from_file,
            get_current_prompt_file_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
