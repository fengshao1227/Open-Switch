use crate::error::AppError;
use crate::prompt::Prompt;
use indexmap::IndexMap;
use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self, AppError> {
        let db_path = Self::get_db_path()?;
        
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| AppError::io(parent, e))?;
            }
        }

        let conn = Connection::open(&db_path)
            .map_err(|e| AppError::Database(format!("Failed to open database: {e}")))?;

        let db = Self { conn: Mutex::new(conn) };
        db.init_schema()?;
        Ok(db)
    }

    fn get_db_path() -> Result<PathBuf, AppError> {
        let home = dirs::home_dir()
            .ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
        Ok(home.join(".open-switch").join("open-switch.db"))
    }

    fn init_schema(&self) -> Result<(), AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS prompts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                description TEXT,
                enabled INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER,
                updated_at INTEGER
            )",
            [],
        ).map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    pub fn get_prompts(&self) -> Result<IndexMap<String, Prompt>, AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        let mut stmt = conn.prepare(
            "SELECT id, name, content, description, enabled, created_at, updated_at 
             FROM prompts ORDER BY created_at DESC"
        ).map_err(|e| AppError::Database(e.to_string()))?;

        let rows = stmt.query_map([], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                name: row.get(1)?,
                content: row.get(2)?,
                description: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }).map_err(|e| AppError::Database(e.to_string()))?;

        let mut map = IndexMap::new();
        for row in rows {
            let prompt = row.map_err(|e| AppError::Database(e.to_string()))?;
            map.insert(prompt.id.clone(), prompt);
        }

        Ok(map)
    }

    pub fn save_prompt(&self, prompt: &Prompt) -> Result<(), AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        conn.execute(
            "INSERT OR REPLACE INTO prompts (id, name, content, description, enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                prompt.id,
                prompt.name,
                prompt.content,
                prompt.description,
                if prompt.enabled { 1 } else { 0 },
                prompt.created_at,
                prompt.updated_at,
            ],
        ).map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    pub fn delete_prompt(&self, id: &str) -> Result<(), AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        conn.execute("DELETE FROM prompts WHERE id = ?1", params![id])
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    pub fn disable_all_prompts(&self) -> Result<(), AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        conn.execute("UPDATE prompts SET enabled = 0", [])
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    pub fn enable_prompt(&self, id: &str) -> Result<(), AppError> {
        let conn = self.conn.lock()
            .map_err(|e| AppError::Database(format!("Lock error: {e}")))?;

        conn.execute("UPDATE prompts SET enabled = 1 WHERE id = ?1", params![id])
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}
