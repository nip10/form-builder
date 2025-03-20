"use client";

import { useState } from "react";
import { Input } from "@repo/ui/components/ui/input";
import { TranslationSelector } from "./translation-selector";
import { Dictionary } from "@repo/internationalization";
import { cn } from "@repo/ui/lib/utils";

interface TranslationInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  dictionary: Dictionary;
  onSelectTranslation?: (key: string) => void;
  containerClassName?: string;
  displayValue?: boolean;
}

export function TranslationInput({
  dictionary,
  onSelectTranslation,
  containerClassName,
  className,
  value,
  onChange,
  displayValue = false,
  ...props
}: TranslationInputProps) {
  // Handle selecting a translation key from the selector
  const handleSelectTranslation = (translationKey: string) => {
    if (onSelectTranslation) {
      onSelectTranslation(translationKey);
    } else if (onChange) {
      // Create a synthetic event to trigger onChange with the key
      const syntheticEvent = {
        target: {
          value: translationKey,
          name: props.name,
        },
        currentTarget: {
          value: translationKey,
          name: props.name,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    }
  };

  // If we need to display the translated value instead of the key
  const displayedValue =
    displayValue && typeof value === "string" && value in dictionary
      ? dictionary[value as keyof typeof dictionary]
      : value;

  return (
    <div className={cn("relative flex w-full items-center", containerClassName)}>
      <Input
        className={cn("pr-10", className)}
        value={displayedValue}
        onChange={onChange}
        {...props}
      />
      <div className="absolute right-2 flex items-center">
        <TranslationSelector
          dictionary={dictionary}
          onSelectTranslation={handleSelectTranslation}
          inputValue={value as string}
        />
      </div>
    </div>
  );
}
