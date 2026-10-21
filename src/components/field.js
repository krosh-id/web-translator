import React from "react";

export default function Field({ label, value, onChange }) {
  return (
    <div>
      <label htmlFor="russian-word">{label}</label>
      <input id="russian-word" type="text" lang="ru" autoComplete="off"
        placeholder="Например, кошка" value={value}
        onChange={event => onChange(event.target.value)} />
    </div>
  );
}