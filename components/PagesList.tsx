import React, { useState } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import { PageWithElements, FormWithValidations } from "@/types/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import ElementsList from "./ElementsList";

interface PagesListProps {
  form: FormWithValidations;
}

const PagesList: React.FC<PagesListProps> = ({ form }) => {
  const { addPage, updatePage, deletePage } = useFormBuilder();

  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);
  const [editPageDialogOpen, setEditPageDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageWithElements | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");

  // Sort pages by order
  const sortedPages =
    form.pages?.toSorted((a, b) => (a.order || 0) - (b.order || 0)) || [];

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

    const success = await updatePage(currentPage._id.toString(), {
      title: newPageTitle,
      description: newPageDescription,
    });

    if (success) {
      toast.success("Page updated successfully");
      setEditPageDialogOpen(false);
      setCurrentPage(null);
    } else {
      toast.error("Failed to update page");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this page? This action cannot be undone."
      )
    ) {
      const success = await deletePage(pageId);

      if (success) {
        toast.success("Page deleted successfully");
      } else {
        toast.error("Failed to delete page");
      }
    }
  };

  const handleMovePageUp = async (page: PageWithElements) => {
    if ((page.order || 0) <= 1) return;

    const pageToSwap = sortedPages.find(
      (p) => (p.order || 0) === (page.order || 0) - 1
    );
    if (!pageToSwap) return;

    const success1 = await updatePage(page._id.toString(), {
      order: (page.order || 0) - 1,
    });
    const success2 = await updatePage(pageToSwap._id.toString(), {
      order: (pageToSwap.order || 0) + 1,
    });

    if (success1 && success2) {
      toast.success("Page moved up successfully");
    } else {
      toast.error("Failed to move page");
    }
  };

  const handleMovePageDown = async (page: PageWithElements) => {
    if ((page.order || 0) >= sortedPages.length) return;

    const pageToSwap = sortedPages.find(
      (p) => (p.order || 0) === (page.order || 0) + 1
    );
    if (!pageToSwap) return;

    const success1 = await updatePage(page._id.toString(), {
      order: (page.order || 0) + 1,
    });
    const success2 = await updatePage(pageToSwap._id.toString(), {
      order: (pageToSwap.order || 0) - 1,
    });

    if (success1 && success2) {
      toast.success("Page moved down successfully");
    } else {
      toast.error("Failed to move page");
    }
  };

  const openEditPageDialog = (page: PageWithElements) => {
    setCurrentPage(page as any);
    setNewPageTitle(page.title);
    setNewPageDescription(page.description || "");
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
              <DialogDescription>
                Create a new page for your form
              </DialogDescription>
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
              <Button
                variant="outline"
                onClick={() => setNewPageDialogOpen(false)}
              >
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
                <Label htmlFor="edit-page-description">
                  Description (Optional)
                </Label>
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
              <Button
                variant="outline"
                onClick={() => setEditPageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditPage}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Accordion
        type="multiple"
        defaultValue={sortedPages.map((page) => page._id.toString())}
      >
        {sortedPages.map((page) => (
          <AccordionItem key={page._id.toString()} value={page._id.toString()}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full mr-4">
                <div className="flex items-center">
                  <span className="font-medium">{page.title}</span>
                  {!page.active && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                      Inactive
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePageUp(page)}
                    disabled={(page.order || 0) <= 1}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePageDown(page)}
                    disabled={(page.order || 0) >= sortedPages.length}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditPageDialog(page)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePage(page._id.toString())}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Page Elements</CardTitle>
                  {page.description && (
                    <CardDescription>{page.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ElementsList
                    pageId={page._id.toString()}
                    elements={page.elements || []}
                  />
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
