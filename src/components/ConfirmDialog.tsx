import type { ConfirmOptions } from '../types';

interface Props extends ConfirmOptions {
  onCancel: () => void;
}

export function ConfirmDialog({ message, detail, onConfirm, onCancel }: Props) {
  return (
    <div class="ifa-modal-backdrop">
      <div class="ifa-modal">
        <p class="ifa-modal__message">{message}</p>
        {detail && <p class="ifa-modal__detail">{detail}</p>}
        <div class="ifa-modal__actions">
          <button class="ifa-btn ifa-btn--ghost" onClick={onCancel}>Cancel</button>
          <button class="ifa-btn ifa-btn--danger" onClick={() => { onConfirm(); onCancel(); }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
