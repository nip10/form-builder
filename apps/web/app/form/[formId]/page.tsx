import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import FormViewer from "./components/form-viewer";
import { getFormById } from "@/lib/form-service";
import { getDictionary } from "@repo/internationalization";
import type { Dictionary } from "@repo/internationalization";

async function FormContent({ formId }: { formId: string }) {
  try {
    // Fetch form data
    const form = await getFormById(Number.parseInt(formId, 10), true);

    if (!form) {
      notFound();
    }

    // Get dictionary for translations
    const dictionary = (await getDictionary("en")) as Dictionary;

    return (
      <main className="h-screen flex flex-col">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <p className="text-muted-foreground">{form.description}</p>
        </div>
        <FormViewer formData={form} dictionary={dictionary} />
      </main>
    );
  } catch (error) {
    console.error("Error loading form:", error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load form data. Please try again later.</AlertDescription>
      </Alert>
    );
  }
}

export default async function FormViewPage({ params }: { params: { formId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading form...</span>
        </div>
      }
    >
      <FormContent formId={params.formId} />
    </Suspense>
  );
}
