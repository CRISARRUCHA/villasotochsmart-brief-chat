import { FileIcon, Download } from "lucide-react";
import type { UploadedFile } from "./FileUploadButton";

interface FileAttachmentsProps {
  files: UploadedFile[];
}

export const FileAttachments = ({ files }: FileAttachmentsProps) => {
  if (!files.length) return null;

  const isImage = (type: string) => type.startsWith("image/") && !type.includes("photoshop");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((f, i) =>
        isImage(f.type) ? (
          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={f.url}
              alt={f.name}
              className="max-w-[200px] max-h-[150px] rounded-lg object-cover ring-1 ring-white/[0.08] hover:ring-primary/40 transition-all"
            />
          </a>
        ) : (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-accent/60 rounded-lg px-3 py-2 text-xs text-foreground ring-1 ring-white/[0.06] hover:ring-primary/30 transition-all max-w-[220px]"
          >
            <FileIcon size={16} className="text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{f.name}</p>
              <p className="text-muted-foreground">{formatSize(f.size)}</p>
            </div>
            <Download size={14} className="text-muted-foreground shrink-0" />
          </a>
        )
      )}
    </div>
  );
};
