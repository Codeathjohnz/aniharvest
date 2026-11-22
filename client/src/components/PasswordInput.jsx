import { useState } from 'react';

/** Password field with an eye button to show / hide what was typed. */
export default function PasswordInput({ value, onChange, name, required, minLength, autoComplete = 'current-password', placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw-field">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          // eye with a slash = currently visible, click to hide
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.4 3.8M6.2 6.2C4.2 7.5 2.7 9.6 2 12c1 3 5 7 10 7 1.9 0 3.6-.5 5.1-1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7S3 15 2 12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
        )}
      </button>
    </span>
  );
}
