import { useEffect } from 'preact/hooks';
import type { ToastItem } from '../types';

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: Props) {
  return (
    <div class="ifa-toast-container">
      {toasts.map(t => (
        <div key={t.id} class={`ifa-toast ifa-toast--${t.type}`}>
          <span>{t.message}</span>
          <button class="ifa-toast__close" onClick={() => onDismiss(t.id)}>x</button>
        </div>
      ))}
    </div>
  );
}
