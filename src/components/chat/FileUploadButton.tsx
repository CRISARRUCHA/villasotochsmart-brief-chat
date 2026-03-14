import { useRef, useState } from "react";
import { Paperclip, X, FileIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadButtonProps {
  briefId: string | null;
  onFilesUploaded: (files: UploadedFile[]) => void;
  pendingFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPT = [
  "image/*",
  "application/pdf",
  "image/vnd.adobe.photoshop",
  "application/x-photoshop",
  "application/postscript",
  "image/x-eps",
  "application/illustrator",
  "video/mp4",
  "video/quicktime",
  "application/zip",
  "application/x-rar-compressed",
  ".psd,.ai,.eps,.svg,.pdf",
].join(",");

export const FileUploadButton = ({ briefId, onFilesUploaded, pendingFiles, onRemoveFile }: FileUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList);
    const tooBig = files.filter(f => f.size > MAX_FILE_SIZE);
    if (tooBig.length) {
      toast.error(`Archivo(s) demasiado grande(s). Máximo 50MB.`);
      return;
    }

    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (const file of files) {
      const folder = briefId || "unassigned";
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const path = `${folder}/${safeName}`;

      const { error } = await supabase.storage
        .from("brief-files")
        .upload(path, file, { upsert: false });

      if (error) {
        console.error("Upload error:", error);
        toast.error(`Error subiendo ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("brief-files")
        .getPublicUrl(path);

      uploaded.push({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
      });
    }

    if (uploaded.length) {
      onFilesUploaded(uploaded);
      toast.success(`${uploaded.length} archivo(s) subido(s)`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
        title="Adjuntar archivo"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>

      {pendingFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 p-2 flex flex-wrap gap-2 mb-1">
          {pendingFiles.map((f, i) => (
            <div
              key={i}
              className="relative group flex items-center gap-2 bg-accent rounded-lg px-3 py-2 text-xs text-foreground ring-1 ring-white/[0.06] max-w-[200px]"
            >
              {isImage(f.type) ? (
                <img src={f.url} alt={f.name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileIcon size={16} className="text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{f.name}</span>
              <button
                onClick={() => onRemoveFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
