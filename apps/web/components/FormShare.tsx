import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import { Label } from "@repo/ui/components/ui/label";
import { Link, Copy, Share, QrCode, Check } from "lucide-react";
import { toast } from "sonner";

interface FormShareProps {
  formId: string;
  formTitle: string;
}

const FormShare: React.FC<FormShareProps> = ({ formId, formTitle }) => {
  const [copied, setCopied] = useState(false);
  const [formActive, setFormActive] = useState(true);

  const formUrl = `${window.location.origin}/forms/${formId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);

    toast.success("Form link copied to clipboard");

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareForm = () => {
    if (navigator.share) {
      navigator
        .share({
          title: formTitle,
          text: `Please fill out this form: ${formTitle}`,
          url: formUrl,
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Form</CardTitle>
        <CardDescription>
          Share your form with others to collect responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="form-active"
              checked={formActive}
              onCheckedChange={setFormActive}
            />
            <Label htmlFor="form-active">
              Form is {formActive ? "active" : "inactive"}
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="form-url">Form URL</Label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="form-url"
                  value={formUrl}
                  readOnly
                  className="pl-8 pr-20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            <Button className="flex-1 gap-2" onClick={handleShareForm}>
              <Share className="h-4 w-4" />
              Share Form
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Embed Options</h3>
            <p className="text-sm text-gray-500 mb-4">
              Embed this form on your website or share via email
            </p>

            <div className="grid gap-3">
              <Button variant="outline" className="gap-2 justify-start">
                <QrCode className="h-4 w-4" />
                Generate QR Code
              </Button>

              <div className="text-xs text-gray-500">
                <p>Direct form link:</p>
                <code className="bg-gray-100 p-1 rounded">{formUrl}</code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormShare;
