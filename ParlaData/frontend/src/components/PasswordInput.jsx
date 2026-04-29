// src/components/PasswordInput.jsx
import { useState } from 'react';

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Digite sua senha",
  required = true,
  autoComplete = "off"
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group password-wrapper">
      <label>{label}</label>
      <div className="password-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />
        {value && (
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 2l20 20" />
                <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PasswordInput;