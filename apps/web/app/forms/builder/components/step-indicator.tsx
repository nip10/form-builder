"use client"

import { Check, CircleDashed } from "lucide-react"
import type { FormBuilderData } from "./form-builder"

interface StepIndicatorProps {
  steps: { id: string; label: string }[]
  currentStep: string
  goToStep: (stepId: string) => void
  formData: FormBuilderData
}

export default function StepIndicator({ steps, currentStep, goToStep, formData }: StepIndicatorProps) {
  // Check if a step is complete based on form data
  const isStepComplete = (stepId: string): boolean => {
    switch (stepId) {
      case "form":
        return !!formData.form.title
      case "groups":
        return formData.groups.length > 0
      case "pages":
        return formData.pages.length > 0
      case "elements":
        return formData.elements.length > 0
      default:
        return false
    }
  }

  return (
    <div className="flex justify-between">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isComplete = isStepComplete(step.id)

        return (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-green-100 text-green-600 border border-green-600"
                      : "bg-muted text-muted-foreground"
                }
                cursor-pointer
              `}
              onClick={() => goToStep(step.id)}
            >
              {isComplete ? <Check className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
            </div>
            <span className={`mt-2 text-sm ${isActive ? "font-medium" : ""}`}>{step.label}</span>

            {index < steps.length - 1 && (
              <div
                className="hidden sm:block absolute left-0 w-full h-0.5 bg-muted"
                style={{
                  top: "1.25rem",
                  left: `calc(${((index + 0.5) * 100) / steps.length}%)`,
                  width: `${100 / steps.length}%`,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

