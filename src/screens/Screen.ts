/** 全画面クラスが実装するインターフェース */
export interface Screen {
  mount(parent: HTMLElement): void;
  unmount(): void;
}
