use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

// ============== MCP Server Configuration ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum McpServerType {
    Local,
    Remote,
}

impl Default for McpServerType {
    fn default() -> Self {
        McpServerType::Local
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    #[serde(rename = "type", default)]
    pub server_type: McpServerType,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub command: Option<Vec<String>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<HashMap<String, String>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u64>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub headers: Option<HashMap<String, String>>,
}

impl McpServer {
    #[cfg(target_os = "windows")]
    pub fn normalize_command_for_platform(command: Vec<String>) -> Vec<String> {
        if command.is_empty() {
            return command;
        }

        let first = command[0].to_lowercase();
        let needs_shell = first == "npx"
            || first == "npm"
            || first == "node"
            || first == "pnpm"
            || first == "yarn"
            || first == "bunx"
            || first == "bun"
            || first.ends_with(".cmd")
            || first.ends_with(".bat");

        if needs_shell {
            let mut wrapped = vec!["cmd".to_string(), "/c".to_string()];
            wrapped.extend(command);
            wrapped
        } else {
            command
        }
    }

    #[cfg(not(target_os = "windows"))]
    pub fn normalize_command_for_platform(command: Vec<String>) -> Vec<String> {
        command
    }
}

// ============== Provider Configuration ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenCodeModel {
    pub name: String,
    #[serde(default)]
    pub thinking: Option<bool>,
    #[serde(rename = "setCacheKey", default)]
    pub set_cache_key: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderOptions {
    #[serde(rename = "baseURL")]
    pub base_url: String,
    #[serde(rename = "apiKey", default, skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub headers: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub npm: String,
    pub name: String,
    pub options: ProviderOptions,
    pub models: HashMap<String, OpenCodeModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenCodeConfig {
    #[serde(rename = "$schema", default, skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub plugin: Option<Vec<String>>,

    #[serde(default)]
    pub provider: HashMap<String, ProviderConfig>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mcp: Option<HashMap<String, McpServer>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub instructions: Option<Vec<String>>,
}

impl Default for OpenCodeConfig {
    fn default() -> Self {
        Self {
            schema: Some("https://opencode.ai/config.json".to_string()),
            plugin: None,
            provider: HashMap::new(),
            mcp: None,
            instructions: None,
        }
    }
}

pub fn get_config_path() -> Result<PathBuf, AppError> {
    let home = dirs::home_dir().ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
    Ok(home.join(".config").join("opencode").join("opencode.json"))
}

pub fn get_opencode_config() -> Result<OpenCodeConfig, AppError> {
    let path = get_config_path()?;

    if !path.exists() {
        return Ok(OpenCodeConfig::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| AppError::io(&path, e))?;
    let config: OpenCodeConfig =
        serde_json::from_str(&content).map_err(|e| AppError::json(&path, e))?;

    Ok(config)
}

pub fn save_opencode_config(config: &OpenCodeConfig) -> Result<(), AppError> {
    let path = get_config_path()?;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
        }
    }

    let content =
        serde_json::to_string_pretty(config).map_err(|e| AppError::JsonSerialize { source: e })?;

    let temp_path = path.with_extension("json.tmp");
    fs::write(&temp_path, &content).map_err(|e| AppError::io(&temp_path, e))?;
    fs::rename(&temp_path, &path).map_err(|e| AppError::io(&path, e))?;

    Ok(())
}

// ============== Auth/Credentials Management ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    #[serde(rename = "type")]
    pub credential_type: String,
    pub key: String,
}

pub type AuthConfig = HashMap<String, Credential>;

pub fn get_auth_path() -> Result<PathBuf, AppError> {
    let home = dirs::home_dir().ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
    Ok(home.join(".local").join("share").join("opencode").join("auth.json"))
}

pub fn get_auth_config() -> Result<AuthConfig, AppError> {
    let path = get_auth_path()?;

    if !path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(&path).map_err(|e| AppError::io(&path, e))?;
    let config: AuthConfig =
        serde_json::from_str(&content).map_err(|e| AppError::json(&path, e))?;

    Ok(config)
}

pub fn save_auth_config(config: &AuthConfig) -> Result<(), AppError> {
    let path = get_auth_path()?;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
        }
    }

    let content =
        serde_json::to_string_pretty(config).map_err(|e| AppError::JsonSerialize { source: e })?;

    let temp_path = path.with_extension("json.tmp");
    fs::write(&temp_path, &content).map_err(|e| AppError::io(&temp_path, e))?;
    fs::rename(&temp_path, &path).map_err(|e| AppError::io(&path, e))?;

    Ok(())
}
