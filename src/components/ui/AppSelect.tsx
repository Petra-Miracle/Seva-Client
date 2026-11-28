"use client";

import { Label, ListBox, Select } from "@heroui/react";

export type SelectItem = { id: string; label: string; description?: string };

/** Thin wrapper around HeroUI v3 Select for the common single-select case. */
export default function AppSelect({
  label,
  ariaLabel,
  items,
  value,
  onChange,
  placeholder = "Pilih…",
  isDisabled,
  className = "",
  triggerClassName = "",
}: {
  label?: string;
  ariaLabel?: string;
  items: SelectItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <Select
      aria-label={label ? undefined : ariaLabel}
      placeholder={placeholder}
      value={value || null}
      onChange={(key) => onChange(key == null ? "" : String(key))}
      isDisabled={isDisabled}
      className={className}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger className={triggerClassName}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{item.label}</span>
                {item.description && <span className="truncate text-xs text-muted">{item.description}</span>}
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
