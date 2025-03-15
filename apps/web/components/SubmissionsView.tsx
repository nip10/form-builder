import React, { useState, useEffect, useCallback } from "react";
import {
  SubmissionDocument as BaseSubmissionDocument,
  ElementDocument,
} from "@repo/database/src/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Download, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Extend SubmissionDocument to ensure data is defined
interface SubmissionDocument extends BaseSubmissionDocument {
  data?: Record<string, any>;
}

// Ensure data is defined for EnhancedSubmissionDocument
interface EnhancedSubmissionDocument extends SubmissionDocument {
  data: Record<string, any>;
}

interface SubmissionsViewProps {
  formId: string;
  form: FormWithPages;
}

interface SubmissionViewProps {
  submission: EnhancedSubmissionDocument;
  form: FormWithPages;
}

// Helper to find element by id across all pages
const getElementById = (
  form: FormWithPages,
  elementId: string
): ElementDocument | null => {
  if (!form.pages) return null;

  for (const page of form.pages) {
    if (!page.elements) continue;

    const element = page.elements.find((e) => e._id.toString() === elementId);
    if (element) return element;
  }
  return null;
};

// Component to display a single submission
const SubmissionView: React.FC<SubmissionViewProps> = ({
  submission,
  form,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Submission Details</h3>
          <p className="text-sm text-gray-500">
            Submitted: {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <p className="text-sm">
          ID: <span className="font-mono">{submission._id.toString()}</span>
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Question</TableHead>
              <TableHead>Answer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(submission.data || {}).map(([elementId, value]) => {
              const element = getElementById(form, elementId);

              if (!element) return null;

              // Format the value based on element type
              let displayValue: React.ReactNode = value;

              if (element.type === "checkbox") {
                displayValue = value ? "Yes" : "No";
              } else if (
                value === null ||
                value === undefined ||
                value === ""
              ) {
                displayValue = (
                  <span className="text-gray-400">Not answered</span>
                );
              } else if (Array.isArray(value)) {
                displayValue = value.join(", ");
              } else if (typeof value === "object") {
                displayValue = JSON.stringify(value);
              }

              return (
                <TableRow key={elementId}>
                  <TableCell className="font-medium">
                    {element.label || ""}
                  </TableCell>
                  <TableCell>{displayValue}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Main submissions view component
const SubmissionsView: React.FC<SubmissionsViewProps> = ({ formId, form }) => {
  const [submissions, setSubmissions] = useState<SubmissionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDocument | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/${formId}/submissions`);

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err.message || "Error fetching submissions");
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("No submissions to export");
      return;
    }

    try {
      // Get all element labels for headers
      const elements: Record<string, string> = {};

      // Iterate through pages and elements
      if (form.pages) {
        form.pages.forEach((page) => {
          if (page.elements) {
            page.elements.forEach((element) => {
              if (element.type !== "text" && element.type !== "image") {
                elements[element._id.toString()] = element.label || "";
              }
            });
          }
        });
      }

      // Create CSV headers
      const headers = [
        "Submission ID",
        "Timestamp",
        ...Object.values(elements),
      ];

      // Create CSV rows
      const rows = submissions.map((submission) => {
        const row: string[] = [
          submission._id.toString(),
          new Date(submission.created_at).toISOString(),
        ];

        // Add data for each element
        Object.keys(elements).forEach((elementId) => {
          const value = submission.data
            ? submission.data[elementId]
            : undefined;

          if (value === null || value === undefined) {
            row.push("");
          } else if (typeof value === "boolean") {
            row.push(value ? "Yes" : "No");
          } else if (Array.isArray(value)) {
            row.push(`"${value.join(", ")}"`);
          } else if (typeof value === "object") {
            row.push(`"${JSON.stringify(value).replace(/"/g, '""')}"`);
          } else {
            row.push(`"${String(value).replace(/"/g, '""')}"`);
          }
        });

        return row;
      });

      // Combine headers and rows
      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n"
      );

      // Create a blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${form.title.replace(/\s+/g, "_")}_submissions.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${submissions.length} submissions exported to CSV`);
    } catch (err: any) {
      toast.error(err.message || "Error exporting submissions");
      console.error("Error exporting submissions:", err);
    }
  };

  // Filter submissions based on search query
  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in submission ID
    if (submission._id.toString().toLowerCase().includes(query)) return true;

    // Search in submission data
    if (submission.data) {
      for (const [elementId, value] of Object.entries(submission.data)) {
        const element = getElementById(form, elementId);

        if (!element) continue;

        // Check if element label matches
        if (element.label && element.label.toLowerCase().includes(query))
          return true;

        // Check if value matches
        if (value !== null && value !== undefined) {
          if (typeof value === "boolean") {
            const boolStr = value ? "yes" : "no";
            if (boolStr.includes(query)) return true;
          } else if (
            typeof value === "string" &&
            value.toLowerCase().includes(query)
          ) {
            return true;
          } else if (
            typeof value === "number" &&
            value.toString().includes(query)
          ) {
            return true;
          } else if (
            Array.isArray(value) &&
            value.some((v) => String(v).toLowerCase().includes(query))
          ) {
            return true;
          }
        }
      }
    }

    return false;
  });

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Form Submissions</CardTitle>
          <CardDescription>
            View and manage submissions for {form.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search submissions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchSubmissions}
              >
                Try Again
              </Button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>
                No submissions yet. Share your form to start collecting
                responses.
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>No submissions match your search criteria.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission._id.toString()}>
                      <TableCell>
                        {new Date(submission.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {submission.completed ? (
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                            Complete
                          </span>
                        ) : (
                          <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
                            Partial
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.data
                          ? Object.keys(submission.data).length
                          : 0}{" "}
                        answered fields
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review the details of this form submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <SubmissionView
              submission={
                {
                  ...selectedSubmission,
                  data: selectedSubmission.data || {},
                } as EnhancedSubmissionDocument
              }
              form={form}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionsView;
