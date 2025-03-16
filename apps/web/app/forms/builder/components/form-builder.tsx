"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Tabs, TabsContent } from "@repo/ui/components/ui/tabs";
import { formSchema } from "@/lib/schemas/form-schema";
import FormStep from "./steps/form-step";
import GroupsStep from "./steps/groups-step";
import PagesStep from "./steps/pages-step";
import ElementsStep from "./steps/elements-step";
import ReviewStep from "./steps/review-step";
import StepIndicator from "./step-indicator";

// Define the form data type based on our schema
export type FormBuilderData = z.infer<typeof formSchema>;

const steps = [
  { id: "form", label: "Form" },
  { id: "groups", label: "Groups" },
  { id: "pages", label: "Pages" },
  { id: "elements", label: "Elements" },
  { id: "review", label: "Review" },
];

export default function FormBuilder() {
  const [currentStep, setCurrentStep] = useState<string>("form");

  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<FormBuilderData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      form: {
        title: "",
        description: "",
        status: "draft",
      },
      groups: [],
      pages: [],
      elements: [],
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isValid },
  } = methods;
  const formData = watch();

  // Handle form submission
  const onSubmit = async (data: FormBuilderData) => {
    console.log("Form submitted:", data);
    // Here you would typically send the data to your API
    try {
      // Example API call (replace with your actual implementation)
      // const response = await fetch('/api/forms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();
      alert("Form created successfully!");
    } catch (error) {
      console.error("Error creating form:", error);
    }
  };

  // Navigate to the next step
  const handleNext = async () => {
    const isStepValid = await trigger(currentStep as any);

    if (isStepValid) {
      const currentIndex = steps.findIndex((step) => step.id === currentStep);
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  // Navigate to the previous step
  const handlePrevious = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    const prevStep = steps[currentIndex - 1];
    if (prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  // Navigate to a specific step
  const goToStep = (stepId: string) => {
    setCurrentStep(stepId);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              goToStep={goToStep}
              formData={formData}
            />

            <div className="mt-8">
              <Tabs value={currentStep} onValueChange={setCurrentStep}>
                <TabsContent value="form">
                  <FormStep />
                </TabsContent>
                <TabsContent value="groups">
                  <GroupsStep />
                </TabsContent>
                <TabsContent value="pages">
                  <PagesStep />
                </TabsContent>
                <TabsContent value="elements">
                  <ElementsStep />
                </TabsContent>
                <TabsContent value="review">
                  <ReviewStep />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === "form"}
              >
                Previous
              </Button>

              {currentStep === "review" ? (
                <Button type="submit">Create Form</Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
