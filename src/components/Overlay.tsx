import { useState, useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface Props {
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ComponentChildren;
}

export function Overlay({ minimized, onMinimize, onClose, children }: Props) {
  const [pos, setPos] = useState({ x: Math.max(0, window.innerWidth - 540), y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.mx;
      const dy = e.clientY - dragRef.current.my;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 520, dragRef.current.ox + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.oy + dy)),
      });
    };

    const onUp = () => setDragging(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const onDragStart = (e: MouseEvent) => {
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    setDragging(true);
  };

  return (
    <div
      class="ifa-overlay"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
    >
      <div
        class="ifa-title-bar"
        onMouseDown={onDragStart}
      >
        <span class="ifa-title-bar__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:-3px">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          IFA
        </span>
        <div class="ifa-title-bar__actions">
          <button class="ifa-title-btn" onClick={onMinimize} title={minimized ? 'Restore' : 'Minimize'}>
            {minimized ? '+' : '-'}
          </button>
          <button class="ifa-title-btn ifa-title-btn--close" onClick={onClose} title="Close">
            x
          </button>
        </div>
      </div>

      {!minimized && (
        <div class="ifa-overlay__content">
          {children}
        </div>
      )}
    </div>
  );
}
