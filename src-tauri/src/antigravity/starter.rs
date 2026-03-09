/// Antigravity 启动模块
///
/// 提供跨平台的 Antigravity 应用程序启动功能
/// 支持 Windows、macOS 和 Linux 系统
use std::path::PathBuf;
use std::process::Command;

/// 启动 Antigravity 应用程序（主入口函数）
///
/// # 返回值
///
/// * `Ok(String)` - 启动成功，返回成功消息
/// * `Err(String)` - 启动失败，返回错误信息
///
/// # 示例
///
/// ```rust
/// match antigravity_starter::start_antigravity() {
///     Ok(msg) => println!("启动成功: {}", msg),
///     Err(e) => println!("启动失败: {}", e),
/// }
/// ```
pub fn start_antigravity() -> Result<String, String> {
    // 优先使用用户配置的可执行文件路径
    if let Ok(Some(custom_exec)) = crate::antigravity::path_config::get_custom_executable_path() {
        let path = PathBuf::from(&custom_exec);
        if path.exists() && path.is_file() {
            tracing::info!("📁 使用自定义 Antigravity 可执行文件: {}", custom_exec);
            return try_start_from_path(&path)
                .map_err(|e| format!("无法启动自定义 Antigravity: {}. 请检查路径是否正确", e));
        } else {
            tracing::warn!("⚠️ 自定义可执行文件路径无效: {}", custom_exec);
        }
    }

    // 回退到自动检测
    match std::env::consts::OS {
        "windows" => start_antigravity_windows(),
        "macos" => start_antigravity_macos(),
        "linux" => start_antigravity_linux(),
        _ => Err("不支持的操作系统".to_string()),
    }
}

/// 在 Windows 平台启动 Antigravity
fn start_antigravity_windows() -> Result<String, String> {
    let mut errors = Vec::new();
    let antigravity_paths = crate::path_utils::AppPaths::antigravity_executable_paths();

    // 尝试所有推测的路径
    for path in &antigravity_paths {
        if path.exists() {
            match try_start_from_path(path) {
                Ok(_) => {
                    return Ok("Antigravity 已启动".to_string());
                }
                Err(e) => {
                    errors.push(format!("{}: {}", path.display(), e));
                }
            }
        } else {
            errors.push(format!("{}: 文件不存在", path.display()));
        }
    }

    // 尝试从系统 PATH 启动命令
    let commands = vec!["Antigravity", "antigravity"];
    match try_start_from_commands(commands) {
        Ok(msg) => Ok(msg),
        Err(e) => {
            errors.push(e);
            Err(format!(
                "无法启动Antigravity。请手动启动Antigravity应用。\n尝试的方法：\n{}",
                errors.join("\n")
            ))
        }
    }
}

/// 在 macOS 平台启动 Antigravity
fn start_antigravity_macos() -> Result<String, String> {
    let mut errors = Vec::new();
    let antigravity_paths = crate::path_utils::AppPaths::antigravity_executable_paths();

    // 尝试所有推测的路径
    for path in &antigravity_paths {
        if path.exists() {
            match try_start_from_path(path) {
                Ok(_) => {
                    return Ok("Antigravity 已启动".to_string());
                }
                Err(e) => {
                    errors.push(format!("{}: {}", path.display(), e));
                }
            }
        } else {
            errors.push(format!("{}: 文件不存在", path.display()));
        }
    }

    // 尝试系统 PATH 命令
    let commands = vec!["Antigravity", "antigravity"];
    match try_start_from_commands(commands) {
        Ok(msg) => Ok(msg),
        Err(e) => {
            errors.push(e);
            Err(format!(
                "无法启动Antigravity。\n\n建议解决方案:\n\
                1. 确保已正确安装 Antigravity 应用程序\n\
                2. 检查应用程序是否位于以下位置之一:\n\
                   - /Applications/Antigravity.app\n\
                   - ~/Applications/Antigravity.app\n\
                   - /Applications/Antigravity-electron.app\n\
                   - ~/Applications/Antigravity-electron.app\n\
                3. 尝试从 Finder 手动启动 Antigravity\n\
                4. 检查应用程序权限设置\n\n\
                尝试的方法:\n{}",
                errors.join("\n")
            ))
        }
    }
}

/// 在 Linux 平台启动 Antigravity
fn start_antigravity_linux() -> Result<String, String> {
    let antigravity_path = std::path::PathBuf::from("/usr/share/antigravity/antigravity");

    if !antigravity_path.exists() {
        return Err("Antigravity 未安装。请先安装 Antigravity 应用。".to_string());
    }

    let mut cmd = std::process::Command::new(&antigravity_path);

    // 设置桌面环境变量
    cmd.env("XDG_SESSION_TYPE", "wayland");

    // 如果当前有 DISPLAY，使用它；否则尝试常见值
    if let Ok(display) = std::env::var("DISPLAY") {
        cmd.env("DISPLAY", display);
    } else {
        cmd.env("DISPLAY", ":0");
    }

    // 设置其他必要的环境变量
    if let Ok(xauthority) = std::env::var("XAUTHORITY") {
        cmd.env("XAUTHORITY", xauthority);
    }

    match cmd.spawn() {
        Ok(_) => Ok("Antigravity 已启动".to_string()),
        Err(e) => Err(format!("启动 Antigravity 失败: {}", e)),
    }
}

/// 尝试从指定路径启动应用程序
fn try_start_from_path(path: &PathBuf) -> Result<String, String> {
    // macOS 需要特殊处理：使用 open 命令启动 .app 应用
    #[cfg(target_os = "macos")]
    {
        // 确保路径是 .app bundle 格式
        let app_bundle_path = if path.to_str().unwrap_or("").contains(".app") {
            path.clone()
        } else {
            return Err(format!("路径不是有效的 .app bundle: {}", path.display()));
        };

        // 方法1: 尝试不带 -n 参数的 open 命令（更兼容）
        match Command::new("open")
            .arg("-g") // 在后台启动应用
            .arg(&app_bundle_path)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
        {
            Ok(_) => {
                return Ok("Antigravity 已启动".to_string());
            }
            Err(_e1) => {
                // 方法2: 尝试直接执行可执行文件
                let exec_names = ["Electron", "Antigravity", "antigravity"];
                for exec_name in &exec_names {
                    let exec_path = app_bundle_path.join("Contents/MacOS").join(exec_name);
                    if exec_path.exists() {
                        match Command::new(&exec_path)
                            .stdout(std::process::Stdio::null())
                            .stderr(std::process::Stdio::null())
                            .spawn()
                        {
                            Ok(_) => {
                                return Ok("Antigravity 已启动".to_string());
                            }
                            Err(_) => {
                                continue; // 尝试下一个可执行文件
                            }
                        }
                    }
                }

                // 方法3: 最后尝试不带任何参数的 open 命令
                match Command::new("open")
                    .arg(&app_bundle_path)
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn()
                {
                    Ok(_) => {
                        return Ok("Antigravity 已启动".to_string());
                    }
                    Err(_e3) => {
                        return Err("启动 Antigravity 失败".to_string());
                    }
                }
            }
        }
    }

    // Windows 和 Linux 直接执行二进制文件（静默启动）
    #[cfg(not(target_os = "macos"))]
    {
        // Windows：重定向输出到 null 设备
        #[cfg(target_os = "windows")]
        {
            Command::new(path)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("启动失败: {}", e))?;
        }

        // Linux：重定向输出到 null 设备
        #[cfg(target_os = "linux")]
        {
            Command::new(path)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("启动失败: {}", e))?;
        }

        Ok("Antigravity 已启动".to_string())
    }
}

/// 尝试从系统命令启动应用程序（静默启动）
fn try_start_from_commands(commands: Vec<&str>) -> Result<String, String> {
    let mut errors = Vec::new();

    for cmd in commands {
        match Command::new(cmd)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
        {
            Ok(_) => {
                return Ok("Antigravity 已启动".to_string());
            }
            Err(e) => {
                errors.push(format!("{}命令: {}", cmd, e));
            }
        }
    }

    Err(format!("所有命令尝试失败: {}", errors.join(", ")))
}

/// 检测 Antigravity 可执行文件路径（不启动，只检测）
pub fn detect_antigravity_executable() -> Option<PathBuf> {
    tracing::info!("🔍 开始自动检测 Antigravity 可执行文件...");

    let paths = crate::path_utils::AppPaths::antigravity_executable_paths();

    let result = paths.into_iter().find(|p| {
        if p.exists() {
            tracing::info!("✅ 找到 Antigravity 可执行文件: {}", p.display());
            true
        } else {
            false
        }
    });

    if result.is_none() {
        tracing::warn!("⚠️ 未能自动检测到 Antigravity 可执行文件");
    }

    result
}
