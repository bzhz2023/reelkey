import { createHash, createHmac } from "node:crypto";
import { s3mini } from "s3mini";

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicDomain?: string;
}

export class Storage {
  private client: s3mini;
  private endpointWithBucket: string;
  private publicDomain?: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(config: StorageConfig) {
    const endpoint = config.endpoint.replace(/\/$/, "");
    this.endpointWithBucket = `${endpoint}/${config.bucket}`;
    this.publicDomain = config.publicDomain?.replace(/\/$/, "");
    this.region = config.region;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;

    this.client = new s3mini({
      endpoint: this.endpointWithBucket,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
  }

  /**
   * 上传文件到 R2/S3
   */
  async uploadFile(params: {
    key: string;
    body: Buffer;
    contentType?: string;
  }): Promise<{ url: string; key: string }> {
    const response = await this.client.putObject(
      params.key,
      params.body,
      params.contentType || "application/octet-stream"
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return { url: this.getPublicUrl(params.key), key: params.key };
  }

  /**
   * 生成浏览器直传 R2/S3 的预签名 PUT URL
   */
  getPresignedPutUrl(params: {
    key: string;
    expiresInSeconds?: number;
  }): { uploadUrl: string; publicUrl: string; key: string; expiresAt: string } {
    const expiresInSeconds = params.expiresInSeconds ?? 900;
    const url = new URL(this.endpointWithBucket);
    url.pathname =
      url.pathname === "/"
        ? `/${escapeS3Path(params.key)}`
        : `${url.pathname}/${escapeS3Path(params.key)}`;

    const now = new Date();
    const fullDatetime = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const shortDatetime = fullDatetime.slice(0, 8);
    const credentialScope = `${shortDatetime}/${this.region}/s3/aws4_request`;
    const query: Record<string, string> = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
      "X-Amz-Credential": `${this.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": fullDatetime,
      "X-Amz-Expires": String(expiresInSeconds),
      "X-Amz-SignedHeaders": "host",
    };

    const canonicalQuery = canonicalizeQuery(query);
    const canonicalRequest = [
      "PUT",
      url.pathname,
      canonicalQuery,
      `host:${url.host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      fullDatetime,
      credentialScope,
      sha256(canonicalRequest),
    ].join("\n");
    const signingKey = getSignatureKey(this.secretAccessKey, shortDatetime, this.region);
    const signature = hmac(signingKey, stringToSign, "hex");

    url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;

    return {
      uploadUrl: url.toString(),
      publicUrl: this.getPublicUrl(params.key),
      key: params.key,
      expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
    };
  }

  /**
   * 从 URL 下载文件并上传到 R2/S3
   */
  async downloadAndUpload(params: {
    sourceUrl: string;
    key: string;
    contentType?: string;
  }): Promise<{ url: string; key: string }> {
    const response = await fetch(params.sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      params.contentType ||
      response.headers.get("content-type") ||
      "video/mp4";

    return this.uploadFile({
      key: params.key,
      body: buffer,
      contentType,
    });
  }

  /**
   * 获取公开 URL
   */
  getPublicUrl(key: string): string {
    if (this.publicDomain) {
      return `${this.publicDomain}/${key}`;
    }
    return `${this.endpointWithBucket}/${key}`;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(
  key: string | Buffer,
  value: string,
  encoding?: "hex"
): string | Buffer {
  const digest = createHmac("sha256", key).update(value);
  return encoding ? digest.digest(encoding) : digest.digest();
}

function getSignatureKey(secretAccessKey: string, date: string, region: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, date) as Buffer;
  const regionKey = hmac(dateKey, region) as Buffer;
  const serviceKey = hmac(regionKey, "s3") as Buffer;
  return hmac(serviceKey, "aws4_request") as Buffer;
}

function escapeS3Path(path: string): string {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}

function canonicalizeQuery(query: Record<string, string>): string {
  return Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

// 单例工厂
let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY;
    const secretAccessKey = process.env.STORAGE_SECRET_KEY;
    const bucket = process.env.STORAGE_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "Storage configuration missing. Required: STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET"
      );
    }

    storageInstance = new Storage({
      endpoint,
      region: process.env.STORAGE_REGION || "auto",
      accessKeyId,
      secretAccessKey,
      bucket,
      publicDomain: process.env.STORAGE_DOMAIN,
    });
  }
  return storageInstance;
}
