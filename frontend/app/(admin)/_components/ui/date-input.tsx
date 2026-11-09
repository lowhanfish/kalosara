"use client";

import React from "react";
import { Calendar } from "lucide-react";

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
  showTodayShortcut?: boolean;
}

export function DateInput({
  label,
  error,
  helperText,
  showTodayShortcut = true,
  className = "",
  onChange,
  ...props
}: DateInputProps) {
  const id = React.useId();

  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (onChange) {
      const syntheticEvent = {
        target: { value: today },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        {showTodayShortcut && (
          <button
            type="button"
            onClick={handleSetToday}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
          >
            <Calendar size={11} /> Hari Ini
          </button>
        )}
      </div>
      <input
        id={id}
        type="date"
        onChange={onChange}
        className={`cms-input w-full ${error ? "!border-rose-400" : ""} ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] font-semibold text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
