use crate::database::Database;
use crate::error::AppError;
use crate::prompt::Prompt;
use indexmap::IndexMap;
use std::path::PathBuf;
use std::sync::Arc;

fn get_unix_timestamp() -> Result<i64, AppError> {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .map_err(|e| AppError::Message(format!("Failed to get system time: {e}")))
}

fn get_agents_md_path() -> Result<PathBuf, AppError> {
    let home = dirs::home_dir()
        .ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
    Ok(home.join(".config").join("opencode").join("AGENTS.md"))
}

fn write_text_file(path: &PathBuf, content: &str) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
        }
    }
    
    let temp_path = path.with_extension("md.tmp");
    std::fs::write(&temp_path, content).map_err(|e| AppError::io(&temp_path, e))?;
    std::fs::rename(&temp_path, path).map_err(|e| AppError::io(path, e))?;
    Ok(())
}

pub struct PromptService;

impl PromptService {
    pub fn get_prompts(db: &Arc<Database>) -> Result<IndexMap<String, Prompt>, AppError> {
        db.get_prompts()
    }

    pub fn upsert_prompt(db: &Arc<Database>, prompt: Prompt) -> Result<(), AppError> {
        let is_enabled = prompt.enabled;
        db.save_prompt(&prompt)?;

        if is_enabled {
            let target_path = get_agents_md_path()?;
            write_text_file(&target_path, &prompt.content)?;
        }

        Ok(())
    }

    pub fn delete_prompt(db: &Arc<Database>, id: &str) -> Result<(), AppError> {
        let prompts = db.get_prompts()?;

        if let Some(prompt) = prompts.get(id) {
            if prompt.enabled {
                return Err(AppError::InvalidInput("Cannot delete enabled prompt".to_string()));
            }
        }

        db.delete_prompt(id)?;
        Ok(())
    }

    pub fn enable_prompt(db: &Arc<Database>, id: &str) -> Result<(), AppError> {
        let target_path = get_agents_md_path()?;
        
        if target_path.exists() {
            if let Ok(live_content) = std::fs::read_to_string(&target_path) {
                if !live_content.trim().is_empty() {
                    let prompts = db.get_prompts()?;

                    if let Some((enabled_id, enabled_prompt)) = prompts
                        .iter()
                        .find(|(_, p)| p.enabled)
                        .map(|(id, p)| (id.clone(), p.clone()))
                    {
                        let timestamp = get_unix_timestamp()?;
                        let mut updated_prompt = enabled_prompt;
                        updated_prompt.content = live_content.clone();
                        updated_prompt.updated_at = Some(timestamp);
                        log::info!("Backfill live content to enabled prompt: {enabled_id}");
                        db.save_prompt(&updated_prompt)?;
                    } else {
                        let content_exists = prompts
                            .values()
                            .any(|p| p.content.trim() == live_content.trim());
                        if !content_exists {
                            let timestamp = get_unix_timestamp()?;
                            let backup_id = format!("backup-{timestamp}");
                            let backup_prompt = Prompt {
                                id: backup_id.clone(),
                                name: format!(
                                    "Original Prompt {}",
                                    chrono::Local::now().format("%Y-%m-%d %H:%M")
                                ),
                                content: live_content,
                                description: Some("Auto-backup of original prompt".to_string()),
                                enabled: false,
                                created_at: Some(timestamp),
                                updated_at: Some(timestamp),
                            };
                            log::info!("Create backup prompt: {backup_id}");
                            db.save_prompt(&backup_prompt)?;
                        }
                    }
                }
            }
        }

        db.disable_all_prompts()?;

        let prompts = db.get_prompts()?;
        if let Some(prompt) = prompts.get(id) {
            write_text_file(&target_path, &prompt.content)?;
            db.enable_prompt(id)?;
        } else {
            return Err(AppError::InvalidInput(format!("Prompt {id} not found")));
        }

        Ok(())
    }

    pub fn import_from_file(db: &Arc<Database>) -> Result<String, AppError> {
        let file_path = get_agents_md_path()?;

        if !file_path.exists() {
            return Err(AppError::Message("AGENTS.md file not found".to_string()));
        }

        let content = std::fs::read_to_string(&file_path).map_err(|e| AppError::io(&file_path, e))?;
        let timestamp = get_unix_timestamp()?;

        let id = format!("imported-{timestamp}");
        let prompt = Prompt {
            id: id.clone(),
            name: format!(
                "Imported Prompt {}",
                chrono::Local::now().format("%Y-%m-%d %H:%M")
            ),
            content,
            description: Some("Imported from existing AGENTS.md".to_string()),
            enabled: false,
            created_at: Some(timestamp),
            updated_at: Some(timestamp),
        };

        db.save_prompt(&prompt)?;
        Ok(id)
    }

    pub fn get_current_file_content() -> Result<Option<String>, AppError> {
        let file_path = get_agents_md_path()?;
        if !file_path.exists() {
            return Ok(None);
        }
        let content = std::fs::read_to_string(&file_path).map_err(|e| AppError::io(&file_path, e))?;
        Ok(Some(content))
    }

    pub fn import_on_first_launch(db: &Arc<Database>) -> Result<usize, AppError> {
        let existing = db.get_prompts()?;
        if !existing.is_empty() {
            return Ok(0);
        }

        let file_path = get_agents_md_path()?;
        if !file_path.exists() {
            return Ok(0);
        }

        let content = match std::fs::read_to_string(&file_path) {
            Ok(c) => c,
            Err(e) => {
                log::warn!("Failed to read AGENTS.md: {e}");
                return Ok(0);
            }
        };

        if content.trim().is_empty() {
            return Ok(0);
        }

        log::info!("Auto-importing existing AGENTS.md");

        let timestamp = get_unix_timestamp()?;
        let id = format!("auto-imported-{timestamp}");
        let prompt = Prompt {
            id: id.clone(),
            name: format!(
                "Auto-imported Prompt {}",
                chrono::Local::now().format("%Y-%m-%d %H:%M")
            ),
            content,
            description: Some("Automatically imported on first launch".to_string()),
            enabled: true,
            created_at: Some(timestamp),
            updated_at: Some(timestamp),
        };

        db.save_prompt(&prompt)?;
        log::info!("Auto-import completed: {id}");
        Ok(1)
    }
}
