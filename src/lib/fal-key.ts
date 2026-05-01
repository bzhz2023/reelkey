/**
 * localStorage 管理工具 - 用于存储用户的 fal.ai API Key
 * Key 只存储在用户浏览器本地，永远不发送到服务器
 */

const STORAGE_KEY = "reelkey_fal_api_key";

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
  },

  /**
   * 删除存储的 API Key
   */
  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * 检查是否已存储 Key
   */
  exists: (): boolean => {
    return !!falKeyStorage.get();
  },
};
