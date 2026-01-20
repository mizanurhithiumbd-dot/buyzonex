import { useEffect, useRef, useState } from 'react';
import { MessageCircle, MessagesSquare, X } from 'lucide-react';
import styles from './floating-chat.module.css';

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root} aria-label="Chat options">
      {open && (
        <div className={styles.panel} role="menu" aria-label="Chat options">
          <a href="#" className={styles.item} role="menuitem">
            <MessageCircle size={18} aria-hidden />
            <span>WhatsApp</span>
          </a>
          <a href="#" className={styles.item} role="menuitem">
            <MessagesSquare size={18} aria-hidden />
            <span>Facebook Messenger</span>
          </a>
        </div>
      )}

      <button
        type="button"
        className={styles.fab}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Close chat options' : 'Open chat options'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} aria-hidden /> : <MessageCircle size={20} aria-hidden />}
      </button>
    </div>
  );
}
