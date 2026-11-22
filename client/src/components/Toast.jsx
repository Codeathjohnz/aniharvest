import { useEffect, useState } from 'react';

// Tiny global toast: call toast('message') or toast('message', 'error') from anywhere
let push = () => {};
export const toast = (text, type = 'ok') => push({ text, type, id: Date.now() + Math.random() });

export default function Toast() {
  const [list, setList] = useState([]);

  useEffect(() => {
    push = (t) => {
      setList((l) => [...l, t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 3000);
    };
    return () => { push = () => {}; };
  }, []);

  return (
    <div className="toasts">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.text}</div>
      ))}
    </div>
  );
}
