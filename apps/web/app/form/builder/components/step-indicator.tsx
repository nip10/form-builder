"use client";

import { Check, CircleDashed } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { FormBuilderData } from "./form-builder";
import type { Step } from "./form-builder";

interface StepIndicatorProps {
  steps: { id: Step; label: string }[];
  currentStep: string;
  goToStep: (stepId: Step) => void;
  formData: FormBuilderData;
}

export default function StepIndicator({
  steps,
  currentStep,
  goToStep,
  formData,
}: StepIndicatorProps) {
  // Check if a step is complete based on form data
  const isStepComplete = (stepId: string): boolean => {
    switch (stepId) {
      case "form":
        return !!formData.form.title;
      case "groups":
        return formData.groups.length > 0;
      case "pages":
        return formData.pages.length > 0;
      case "elements":
        return formData.elements.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="flex justify-between px-4">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isComplete = isStepComplete(step.id);

        return (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full cursor-pointer",
                isActive && "bg-primary text-primary-foreground",
                isComplete && "bg-green-100 text-green-600 border border-green-600",
                !isActive && !isComplete && "bg-muted text-muted-foreground",
              )}
              onClick={() => goToStep(step.id)}
            >
              {isComplete ? <Check className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
            </div>
            <span className={cn("mt-2 text-sm", isActive && "font-medium")}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
