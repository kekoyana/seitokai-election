/** 型安全な querySelector ラッパー。要素が見つからない場合は null を返す */
export function $(parent: Element, selector: string): HTMLElement | null {
  return parent.querySelector<HTMLElement>(selector);
}

/** イベントリスナーを安全に登録する（要素が存在する場合のみ） */
export function on(parent: Element, selector: string, event: string, handler: (e: Event) => void): void {
  parent.querySelector(selector)?.addEventListener(event, handler);
}

/** data属性のボタンに一括でイベントを登録する */
export function onDataAttr(parent: Element, attr: string, handler: (value: string, e: Event) => void): void {
  parent.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => {
    el.addEventListener('pointerup', (e) => {
      const value = el.getAttribute(attr);
      if (value) handler(value, e);
    });
  });
}
