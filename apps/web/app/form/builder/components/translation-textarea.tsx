"use client";

import { useState } from "react";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { TranslationSelector } from "./translation-selector";
import { Dictionary } from "@repo/internationalization";
import { cn } from "@repo/ui/lib/utils";

interface TranslationTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  dictionary: Dictionary;
  onSelectTranslation?: (key: string) => void;
  containerClassName?: string;
  displayValue?: boolean;
}

export function TranslationTextarea({
  dictionary,
  onSelectTranslation,
  containerClassName,
  className,
  value,
  onChange,
  displayValue = false,
  ...props
}: TranslationTextareaProps) {
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
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onChange(syntheticEvent);
    }
  };

  // If we need to display the translated value instead of the key
  const displayedValue =
    displayValue && typeof value === "string" && value in dictionary
      ? dictionary[value as keyof typeof dictionary]
      : value;

  return (
    <div className={cn("relative", containerClassName)}>
      <Textarea
        className={cn("pr-10", className)}
        value={displayedValue}
        onChange={onChange}
        {...props}
      />
      <div className="absolute top-2 right-2 flex items-center">
        <TranslationSelector
          dictionary={dictionary}
          onSelectTranslation={handleSelectTranslation}
          inputValue={value as string}
        />
      </div>
    </div>
  );
}
