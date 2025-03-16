"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/ui/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import type { FormWithRelations } from "@/lib/repositories/form-repository";
import FormTreeView from "./form-tree-view";
import FormFlowView from "./form-flow-view";
import FormPreview from "./form-preview";

interface FormViewerProps {
  formData: FormWithRelations;
}

export type SelectedElementType = "form" | "group" | "page" | "element";

export interface SelectedElement {
  id: number;
  type: SelectedElementType;
}

export default function FormViewer({ formData }: FormViewerProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [activeTab, setActiveTab] = useState<string>("structure");

  const handleElementSelect = (type: SelectedElementType, id: number) => {
    setSelectedElement({ type, id });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* First column - Tree View */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full flex flex-col border-r">
            <div className="p-3 border-b">
              <h2 className="font-semibold">Form Structure</h2>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <FormTreeView
                formData={formData}
                selectedElement={selectedElement}
                onElementSelect={handleElementSelect}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Second column - Flow View */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col border-r">
            <div className="p-3 border-b">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="structure">Flow Diagram</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 overflow-auto">
              <TabsContent value="structure" className="h-full m-0 p-0">
                <FormFlowView
                  formData={formData}
                  selectedElement={selectedElement}
                  onElementSelect={handleElementSelect}
                />
              </TabsContent>
              <TabsContent value="preview" className="h-full m-0 p-0 md:hidden lg:hidden">
                <FormPreview formData={formData} selectedElement={selectedElement} />
              </TabsContent>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex" />

        {/* Third column - Preview */}
        <ResizablePanel defaultSize={40} minSize={30} className="hidden md:block">
          <div className="h-full flex flex-col">
            <div className="p-3 border-b">
              <h2 className="font-semibold">Form Preview</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <FormPreview formData={formData} selectedElement={selectedElement} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
