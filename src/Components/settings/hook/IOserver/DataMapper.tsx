// src/types/importMeta.d.ts

declare interface ImportMeta {
  readonly env: {
    [key: string]: string | boolean | undefined;
  };

  /**
   * Optional: giả lập import.meta.glob cho TypeScript
   * ⚠️ Parcel không hỗ trợ thật — chỉ để khỏi báo lỗi khi code tham chiếu tới nó.
   */
  glob?: (
    pattern: string,
    options?: { eager?: boolean },
  ) => Record<string, () => Promise<unknown>>;
}
