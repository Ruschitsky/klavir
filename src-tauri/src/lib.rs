use tauri::Manager;

/// Saves a progress backup into the Documents/Klavir folder and returns the file path.
/// The web view cannot download files by itself, so the page asks the app to do it.
#[tauri::command]
fn save_backup(app: tauri::AppHandle, name: String, contents: String) -> Result<String, String> {
    let dir = app
        .path()
        .document_dir()
        .map_err(|e| e.to_string())?
        .join("Klavir");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    // Only a plain file name is accepted, never a path.
    let safe: String = name
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
        .collect();
    let file_name = if safe.is_empty() || safe.starts_with('.') {
        "klavir-backup.json".to_string()
    } else {
        safe
    };

    let file = dir.join(file_name);
    std::fs::write(&file, contents).map_err(|e| e.to_string())?;
    Ok(file.to_string_lossy().into_owned())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_backup])
        .run(tauri::generate_context!())
        .expect("error while running Klavir");
}
