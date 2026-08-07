"use client";

import { useRef, useState } from "react";
import { ImageOff, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/upload";
import { useToast } from "@/contexts/toast-context";

export function ImageUploadField({
  value,
  onChange,
  storagePath,
  label = "URL ảnh",
}: {
  value: string;
  onChange: (url: string) => void;
  storagePath: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadImage(file, `${storagePath}-${Date.now()}.${ext}`);
      onChange(url);
      setBroken(false);
    } catch {
      toast.error(
        "Tải ảnh lên thất bại — có thể Firebase Storage chưa được bật cho project. Bạn có thể dán URL ảnh trực tiếp thay thế."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="https://..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setBroken(false);
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm text-foreground hover:bg-surface-muted disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Tải ảnh
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {value && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt={label}
          onError={() => setBroken(true)}
          className="h-28 w-full max-w-xs rounded-lg border border-border object-cover"
        />
      ) : value && broken ? (
        <div className="flex h-28 w-full max-w-xs items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          <ImageOff className="h-4 w-4" /> Không tải được ảnh từ URL này
        </div>
      ) : null}
    </div>
  );
}
