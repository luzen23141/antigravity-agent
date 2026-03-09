use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use pbkdf2::pbkdf2_hmac;
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

const V2_PREFIX: &str = "v2:";
const KDF_ITERATIONS: u32 = 210_000;
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const KEY_LEN: usize = 32;

#[derive(Serialize, Deserialize)]
struct EncryptedPayloadV2 {
    v: u8,
    alg: String,
    kdf: String,
    iter: u32,
    salt: String,
    nonce: String,
    ciphertext: String,
}

fn derive_key(password: &str, salt: &[u8], iterations: u32) -> [u8; KEY_LEN] {
    let mut key = [0u8; KEY_LEN];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, iterations, &mut key);
    key
}

fn encrypt_v2(json_data: &str, password: &str) -> Result<String, String> {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt, KDF_ITERATIONS);
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|_| "初始化加密器失败".to_string())?;

    let ciphertext = cipher
        .encrypt(Nonce::from_slice(&nonce_bytes), json_data.as_bytes())
        .map_err(|_| "加密失败".to_string())?;

    let payload = EncryptedPayloadV2 {
        v: 2,
        alg: "AES-256-GCM".to_string(),
        kdf: "PBKDF2-HMAC-SHA256".to_string(),
        iter: KDF_ITERATIONS,
        salt: BASE64.encode(salt),
        nonce: BASE64.encode(nonce_bytes),
        ciphertext: BASE64.encode(ciphertext),
    };

    let encoded_payload = serde_json::to_vec(&payload)
        .map_err(|_| "序列化加密数据失败".to_string())?;

    Ok(format!("{}{}", V2_PREFIX, BASE64.encode(encoded_payload)))
}

fn decrypt_v2(encrypted_data: &str, password: &str) -> Result<String, String> {
    let payload_b64 = encrypted_data
        .strip_prefix(V2_PREFIX)
        .ok_or_else(|| "加密格式版本不匹配".to_string())?;

    let payload_raw = BASE64
        .decode(payload_b64)
        .map_err(|_| "解密失败：无效的加密格式".to_string())?;

    let payload: EncryptedPayloadV2 = serde_json::from_slice(&payload_raw)
        .map_err(|_| "解密失败：加密载荷损坏".to_string())?;

    if payload.v != 2 || payload.alg != "AES-256-GCM" || payload.kdf != "PBKDF2-HMAC-SHA256" {
        return Err("解密失败：不支持的加密参数".to_string());
    }

    if payload.iter < 100_000 {
        return Err("解密失败：KDF 参数不安全".to_string());
    }

    let salt = BASE64
        .decode(payload.salt)
        .map_err(|_| "解密失败：salt 格式错误".to_string())?;
    if salt.len() != SALT_LEN {
        return Err("解密失败：salt 长度错误".to_string());
    }

    let nonce = BASE64
        .decode(payload.nonce)
        .map_err(|_| "解密失败：nonce 格式错误".to_string())?;
    if nonce.len() != NONCE_LEN {
        return Err("解密失败：nonce 长度错误".to_string());
    }

    let ciphertext = BASE64
        .decode(payload.ciphertext)
        .map_err(|_| "解密失败：ciphertext 格式错误".to_string())?;

    let key = derive_key(password, &salt, payload.iter);
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|_| "初始化解密器失败".to_string())?;

    let plain = cipher
        .decrypt(Nonce::from_slice(&nonce), ciphertext.as_ref())
        .map_err(|_| "解密失败：密码错误或数据已损坏".to_string())?;

    String::from_utf8(plain).map_err(|_| "解密失败：明文不是有效 UTF-8".to_string())
}

fn decrypt_legacy_xor(encrypted_data: &str, password: &str) -> Result<String, String> {
    let decoded = BASE64
        .decode(encrypted_data)
        .map_err(|_| "Base64 解码失败".to_string())?;

    let password_bytes = password.as_bytes();
    let mut result = Vec::with_capacity(decoded.len());

    for (i, byte) in decoded.iter().enumerate() {
        let key_byte = password_bytes[i % password_bytes.len()];
        result.push(byte ^ key_byte);
    }

    let decrypted =
        String::from_utf8(result).map_err(|_| "解密失败，数据可能已损坏".to_string())?;

    tracing::warn!(
        target: "crypto::legacy",
        "使用旧版 XOR 兼容解密；该格式不具备现代安全性，建议重新导出备份"
    );

    Ok(decrypted)
}

/// 加密配置数据（用于账户导出）
pub async fn encrypt_config_data(json_data: String, password: String) -> Result<String, String> {
    if password.is_empty() {
        return Err("密码不能为空".to_string());
    }

    encrypt_v2(&json_data, &password)
}

/// 解密配置数据（用于账户导入）
pub async fn decrypt_config_data(
    encrypted_data: String,
    password: String,
) -> Result<String, String> {
    if password.is_empty() {
        return Err("密码不能为空".to_string());
    }

    if encrypted_data.starts_with(V2_PREFIX) {
        return decrypt_v2(&encrypted_data, &password);
    }

    decrypt_legacy_xor(&encrypted_data, &password)
}

#[cfg(test)]
mod tests {
    use super::{decrypt_config_data, decrypt_legacy_xor, encrypt_config_data, V2_PREFIX};
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

    #[tokio::test]
    async fn encrypt_and_decrypt_v2_roundtrip() {
        let plain = r#"{"email":"user@example.com"}"#.to_string();
        let password = "strong-password".to_string();

        let encrypted = encrypt_config_data(plain.clone(), password.clone())
            .await
            .expect("encryption should succeed");
        let decrypted = decrypt_config_data(encrypted, password)
            .await
            .expect("decryption should succeed");

        assert_eq!(decrypted, plain);
    }

    #[tokio::test]
    async fn encrypt_rejects_empty_password() {
        let error = encrypt_config_data("{}".to_string(), "".to_string())
            .await
            .expect_err("empty password should fail");

        assert_eq!(error, "密码不能为空");
    }

    #[tokio::test]
    async fn decrypt_rejects_invalid_v2_payload() {
        let encrypted = format!("{}invalid-base64", V2_PREFIX);
        let error = decrypt_config_data(encrypted, "password".to_string())
            .await
            .expect_err("invalid payload should fail");

        assert!(error.contains("无效的加密格式"));
    }

    #[test]
    fn decrypt_legacy_xor_roundtrip() {
        let plain = "legacy-backup";
        let password = "pw";
        let encrypted_bytes: Vec<u8> = plain
            .as_bytes()
            .iter()
            .enumerate()
            .map(|(index, byte)| byte ^ password.as_bytes()[index % password.len()])
            .collect();
        let encrypted = BASE64.encode(encrypted_bytes);

        let decrypted = decrypt_legacy_xor(&encrypted, password)
            .expect("legacy decrypt should succeed");

        assert_eq!(decrypted, plain);
    }
}
