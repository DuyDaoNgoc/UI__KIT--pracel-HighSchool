declare interface ImportMeta {
  readonly env: {
    [key: string]: string | boolean | undefined;
  };

  // Chỉ để TS không báo lỗi — Parcel không thực sự có hàm này
  glob?: (
    pattern: string,
    options?: { eager?: boolean },
  ) => Record<string, () => Promise<unknown>>;
}
