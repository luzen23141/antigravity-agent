use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;
use std::sync::OnceLock;
use std::time::SystemTime;

/// 备份数据收集结构
#[derive(Serialize, Deserialize, Debug)]
pub struct AccountExportedData {
    filename: String,
    #[serde(rename = "content")]
    content: Value,
    #[serde(rename = "timestamp")]
    timestamp: u64,
}

/// 恢复结果
#[derive(Serialize, Deserialize, Debug)]
pub struct RestoreResult {
    #[serde(rename = "restoredCount")]
    restored_count: u32,
    failed: Vec<FailedAccountExportedData>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FailedAccountExportedData {
    filename: String,
    error: String,
}

fn backup_filename_regex() -> &'static Regex {
    static BACKUP_FILENAME_RE: OnceLock<Regex> = OnceLock::new();
    BACKUP_FILENAME_RE.get_or_init(|| {
        Regex::new(r"^[A-Za-z0-9._-]+\.json$").expect("backup filename regex must be valid")
    })
}

fn backup_name_regex() -> &'static Regex {
    static BACKUP_NAME_RE: OnceLock<Regex> = OnceLock::new();
    BACKUP_NAME_RE.get_or_init(|| {
        Regex::new(r"^[A-Za-z0-9._-]+$").expect("backup name regex must be valid")
    })
}

fn validate_restore_filename(filename: &str) -> Result<(), String> {
    if filename.is_empty() {
        return Err("文件名不能为空".to_string());
    }

    if filename.contains('/') || filename.contains('\\') {
        return Err("文件名包含非法路径分隔符".to_string());
    }

    if filename.starts_with('.') || filename.contains("..") {
        return Err("文件名包含非法路径片段".to_string());
    }

    if !backup_filename_regex().is_match(filename) {
        return Err("文件名格式非法，仅允许 [A-Za-z0-9._-] 且必须为 .json".to_string());
    }

    Ok(())
}

fn validate_delete_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("名称不能为空".to_string());
    }

    if name.contains('/') || name.contains('\\') {
        return Err("名称包含非法路径分隔符".to_string());
    }

    if name.starts_with('.') || name.contains("..") {
        return Err("名称包含非法路径片段".to_string());
    }

    if !backup_name_regex().is_match(name) {
        return Err("名称格式非法，仅允许 [A-Za-z0-9._-]".to_string());
    }

    Ok(())
}

fn ensure_safe_restore_target(path: &Path) -> Result<(), String> {
    if let Ok(meta) = fs::symlink_metadata(path) {
        if meta.file_type().is_symlink() {
            return Err("目标路径是符号链接，已拒绝写入".to_string());
        }
    }

    Ok(())
}

/// 收集所有账户文件的完整内容, 用于导出
pub async fn collect_contents(
    config_dir: &std::path::Path,
) -> Result<Vec<AccountExportedData>, String> {
    let mut backups_with_content = Vec::new();

    // 读取Antigravity账户目录中的JSON文件
    let antigravity_dir = config_dir.join("antigravity-accounts");

    for entry in fs::read_dir(&antigravity_dir).map_err(|e| format!("读取用户目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();

        if path.extension().is_some_and(|ext| ext == "json") {
            let filename = path
                .file_name()
                .and_then(|name| name.to_str())
                .map(|s| s.to_string())
                .unwrap_or_default();

            if filename.is_empty() {
                continue;
            }

            match fs::read_to_string(&path).map_err(|e| format!("读取文件失败 {}: {}", filename, e))
            {
                Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(json_value) => {
                        backups_with_content.push(AccountExportedData {
                            filename,
                            content: json_value,
                            timestamp: SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                        });
                    }
                    Err(e) => {
                        tracing::warn!(target: "backup::scan", filename = %filename, error = %e, "跳过损坏的备份文件");
                    }
                },
                Err(_) => {
                    tracing::warn!(target: "backup::scan", filename = %filename, "跳过无法读取的文件");
                }
            }
        }
    }

    Ok(backups_with_content)
}

/// 恢复备份文件到本地
pub async fn restore_files(
    config_dir: &std::path::Path,
    account_file_data: Vec<AccountExportedData>,
) -> Result<RestoreResult, String> {
    let mut results = RestoreResult {
        restored_count: 0,
        failed: Vec::new(),
    };

    // 获取目标目录
    let antigravity_dir = config_dir.join("antigravity-accounts");

    // 确保目录存在
    if let Err(e) = fs::create_dir_all(&antigravity_dir) {
        return Err(format!("创建目录失败: {}", e));
    }

    // 遍历每个备份
    for account_file in account_file_data {
        if let Err(err) = validate_restore_filename(&account_file.filename) {
            results.failed.push(FailedAccountExportedData {
                filename: account_file.filename,
                error: format!("非法文件名: {}", err),
            });
            continue;
        }

        let file_path = antigravity_dir.join(&account_file.filename);
        if let Err(err) = ensure_safe_restore_target(&file_path) {
            results.failed.push(FailedAccountExportedData {
                filename: account_file.filename,
                error: err,
            });
            continue;
        }

        match fs::write(
            &file_path,
            serde_json::to_string_pretty(&account_file.content).unwrap_or_default(),
        )
        .map_err(|e| format!("写入文件失败: {}", e))
        {
            Ok(_) => {
                results.restored_count += 1;
            }
            Err(e) => {
                results.failed.push(FailedAccountExportedData {
                    filename: account_file.filename,
                    error: e,
                });
            }
        }
    }

    Ok(results)
}

/// 删除指定备份
pub async fn delete(config_dir: &std::path::Path, name: String) -> Result<String, String> {
    validate_delete_name(&name).map_err(|e| format!("非法名称: {}", e))?;

    // 只删除Antigravity账户JSON文件
    let antigravity_dir = config_dir.join("antigravity-accounts");
    let antigravity_file = antigravity_dir.join(format!("{}.json", name));

    fs::remove_file(&antigravity_file).map_err(|e| format!("删除用户文件失败: {}", e))?;
    Ok(format!("删除用户成功: {}", name))
}

/// 清空所有备份
pub async fn clear_all(config_dir: &std::path::Path) -> Result<String, String> {
    let antigravity_dir = config_dir.join("antigravity-accounts");

    // 读取目录中的所有文件
    let mut deleted_count = 0;
    for entry in fs::read_dir(&antigravity_dir).map_err(|e| format!("读取用户目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();

        // 只删除 JSON 文件
        if path.extension().is_some_and(|ext| ext == "json") {
            fs::remove_file(&path)
                .map_err(|e| format!("删除文件 {} 失败: {}", path.display(), e))?;
            deleted_count += 1;
        }
    }

    Ok(format!(
        "已清空所有用户备份，共删除 {} 个文件",
        deleted_count
    ))
}
