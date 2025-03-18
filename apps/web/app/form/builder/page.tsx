import FormBuilder from "./components/form-builder";

export default function FormBuilderPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Form Builder
        </h1>
      </header>
      <main className="container mx-auto">
        <FormBuilder />
      </main>
    </div>
  );
}
