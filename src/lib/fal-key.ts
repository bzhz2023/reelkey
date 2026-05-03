/**
 * localStorage 管理工具 - 用于存储用户的 fal.ai API Key
 * Key 只存储在用户浏览器本地。保存/生成时会随请求发送到服务端代理，
 * 但不会写入数据库或服务端持久化存储。
 */

const STORAGE_KEY = "reelkey_fal_api_key";
const VALIDATED_AT_KEY = "reelkey_fal_api_key_validated_at";

export const falKeyStorage = {
  /**
   * 获取存储的 API Key
   */
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  },

  /**
   * 保存 API Key 到 localStorage
   */
  set: (key: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, key);
    localStorage.setItem(VALIDATED_AT_KEY, new Date().toISOString());
  },

  /**
   * 删除存储的 API Key
   */
  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VALIDATED_AT_KEY);
  },

  /**
   * 获取最近一次保存成功后的校验时间
   */
  getValidatedAt: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(VALIDATED_AT_KEY);
  },

  /**
   * 检查是否已存储 Key
   */
  exists: (): boolean => {
    return !!falKeyStorage.get();
  },
};
