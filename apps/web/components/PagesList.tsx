import React, { useState } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { PlusCircle, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import ElementsList from "./ElementsList";
import {
  ElementInstance,
  ElementTemplate,
  PageInstance,
  PageTemplate,
} from "@repo/database/src/schema";

// Define the extended page type with template
type PageWithTemplate = PageInstance & {
  template?: PageTemplate;
  elements?: (ElementInstance & { template?: ElementTemplate })[];
};

interface PagesListProps {
  form: {
    id: number;
    pages: PageWithTemplate[];
  };
}

const PagesList: React.FC<PagesListProps> = ({ form }) => {
  const { addPage, updatePage, deletePage } = useFormBuilder();

  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);
  const [editPageDialogOpen, setEditPageDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageWithTemplate | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");

  // Sort pages by order
  const sortedPages = form.pages
    ? [...form.pages].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    : [];

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) {
      toast.error("Page title is required");
      return;
    }

    const newPage = await addPage(newPageTitle, undefined);

    if (newPage) {
      toast.success("Page added successfully");
      setNewPageDialogOpen(false);
      setNewPageTitle("");
      setNewPageDescription("");
    } else {
      toast.error("Failed to add page");
    }
  };

  const handleEditPage = async () => {
    if (!currentPage) return;

    if (!newPageTitle.trim()) {
      toast.error("Page title is required");
      return;
    }

    const success = await updatePage(currentPage.id, {
      titleOverride: newPageTitle,
      descriptionOverride: newPageDescription,
    });

    if (success) {
      toast.success("Page updated successfully");
      setEditPageDialogOpen(false);
      setCurrentPage(null);
    } else {
      toast.error("Failed to update page");
    }
  };

  const handleDeletePage = async (pageId: number) => {
    if (confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      const success = await deletePage(pageId);

      if (success) {
        toast.success("Page deleted successfully");
      } else {
        toast.error("Failed to delete page");
      }
    }
  };

  const handleMovePageUp = async (page: PageWithTemplate) => {
    if ((page.orderIndex || 0) <= 1) return;

    const pageToSwap = sortedPages.find(
      (p: PageWithTemplate) => (p.orderIndex || 0) === (page.orderIndex || 0) - 1,
    );
    if (!pageToSwap) return;

    const success1 = await updatePage(page.id, {
      orderIndex: (page.orderIndex || 0) - 1,
    });
    const success2 = await updatePage(pageToSwap.id, {
      orderIndex: (pageToSwap.orderIndex || 0) + 1,
    });

    if (success1 && success2) {
      toast.success("Page moved up successfully");
    } else {
      toast.error("Failed to move page");
    }
  };

  const handleMovePageDown = async (page: PageWithTemplate) => {
    if ((page.orderIndex || 0) >= sortedPages.length) return;

    const pageToSwap = sortedPages.find(
      (p: PageWithTemplate) => (p.orderIndex || 0) === (page.orderIndex || 0) + 1,
    );
    if (!pageToSwap) return;

    const success1 = await updatePage(page.id, {
      orderIndex: (page.orderIndex || 0) + 1,
    });
    const success2 = await updatePage(pageToSwap.id, {
      orderIndex: (pageToSwap.orderIndex || 0) - 1,
    });

    if (success1 && success2) {
      toast.success("Page moved down successfully");
    } else {
      toast.error("Failed to move page");
    }
  };

  const openEditPageDialog = (page: PageWithTemplate) => {
    setCurrentPage(page);
    setNewPageTitle(page.titleOverride || "");
    setNewPageDescription(page.descriptionOverride || "");
    setEditPageDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Form Pages</h2>

        <Dialog open={newPageDialogOpen} onOpenChange={setNewPageDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Page</DialogTitle>
              <DialogDescription>Create a new page for your form</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="page-description">Description (Optional)</Label>
                <Textarea
                  id="page-description"
                  value={newPageDescription}
                  onChange={(e) => setNewPageDescription(e.target.value)}
                  placeholder="Enter page description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPage}>Add Page</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editPageDialogOpen} onOpenChange={setEditPageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Page</DialogTitle>
              <DialogDescription>Update page information</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-page-title">Page Title</Label>
                <Input
                  id="edit-page-title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-page-description">Description (Optional)</Label>
                <Textarea
                  id="edit-page-description"
                  value={newPageDescription}
                  onChange={(e) => setNewPageDescription(e.target.value)}
                  placeholder="Enter page description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditPageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPage}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Accordion
        type="multiple"
        defaultValue={sortedPages.map((page: PageWithTemplate) => page.id.toString())}
      >
        {sortedPages.map((page: PageWithTemplate) => (
          <AccordionItem key={page.id.toString()} value={page.id.toString()}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full mr-4">
                <div className="flex items-center">
                  <span className="font-medium">{page.titleOverride || "Untitled"}</span>
                  {page.propertiesOverride?.active === false && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePageUp(page)}
                    disabled={(page.orderIndex || 0) <= 1}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePageDown(page)}
                    disabled={(page.orderIndex || 0) >= sortedPages.length}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditPageDialog(page)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePage(page.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Page Elements</CardTitle>
                  {page.descriptionOverride && (
                    <CardDescription>{page.descriptionOverride}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ElementsList pageId={page.id} elements={page.elements || []} />
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {sortedPages.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <p className="text-gray-500 mb-4">
                No pages yet. Add your first page to get started.
              </p>
              <Button onClick={() => setNewPageDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PagesList;
