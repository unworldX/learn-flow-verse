import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSupabaseStorageUrl } from "@/lib/utils";
import { getSignedUrl } from "@/lib/signedUrlCache";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string; // storage path
  file_name?: string | null;
}

interface PdfViewerContentProps {
  resourceId?: string; // explicit id (preferred)
  initialResource?: Resource | null; // optional pre-fetched resource
  onClose?: () => void; // optional close handler
  mode?: 'page' | 'dialog';
}
const enhancePdfViewerUrl = (url: string) => {
  const [base, hash = ""] = url.split("#");
  const params = new URLSearchParams(hash);
  params.set("toolbar", "1");
  params.set("navpanes", "1");
  params.set("view", "FitH");
  return `${base}#${params.toString()}`;
};

export default function PdfViewerContent({ resourceId, initialResource, onClose, mode = 'page' }: PdfViewerContentProps) {
  // Support both patterns: a route param named resourceId OR a prop
  const params = useParams<{ resourceId?: string; id?: string }>();
  const inferredId = resourceId || params.resourceId || params.id; // fallback for legacy param name
  const { toast } = useToast();

  const [resource, setResource] = useState<Resource | null>(initialResource || null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  // 1️⃣ Fetch resource metadata from DB
  useEffect(() => {
    if (resource || !inferredId) { setIsLoading(false); return; }
    const fetchResource = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('id', inferredId)
          .single();
        if (error) throw error;
        setResource(data as Resource);
      } catch (error) {
        console.error('❌ Error fetching resource:', error);
        toast({
          title: 'Failed to load resource',
          description: 'Could not find the requested file',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchResource();
  }, [inferredId, resource, toast]);

  // 2️⃣ Generate signed URL for the PDF
  useEffect(() => {
    const loadPdf = async () => {
      if (!resource?.file_url) return;
      setIsPdfLoading(true);

      try {
        let fileRef = resource.file_url.trim();
        // Normalize accidental duplicated prefixes like uploads/uploads/
        if (/^uploads\/uploads\//.test(fileRef)) {
          fileRef = fileRef.replace(/^uploads\//, '');
        }
        // Remove any leading slashes
        fileRef = fileRef.replace(/^\/+/, '');
        const isAbsolute = /^https?:\/\//i.test(fileRef);

        if (isAbsolute) {
          const parsed = parseSupabaseStorageUrl(fileRef);
          if (parsed) {
            let objectPath = parsed.path.replace(/^uploads\//, "");
            objectPath = objectPath.replace(/^\/+/, "");
            const signed = await getSignedUrl(parsed.bucket, objectPath, { lifetimeSeconds: 3600 });
            console.log('[PDF] signed private URL (parsed absolute):', signed);
            setPdfUrl(signed);
            return;
          } else {
            // Non-Supabase absolute URL (external) - cannot sign
            setPdfUrl(fileRef);
            return;
          }
        }

        // Relative (stored) path inside the uploads bucket
        // If the path still begins with the bucket name, strip it for signing
        if (fileRef.startsWith('uploads/')) {
          fileRef = fileRef.replace(/^uploads\//, '');
        }

        console.log('[PDF Debug] Original file_url:', resource.file_url);
        console.log('[PDF Debug] Normalized fileRef before signing:', fileRef);
        console.log('[PDF Debug] Bucket:', 'uploads');
        
        const signed = await getSignedUrl('uploads', fileRef, { lifetimeSeconds: 3600 });
        console.log('[PDF] signed private URL (relative path):', signed);
        setPdfUrl(signed);
      } catch (error) {
        console.error('❌ Error generating signed URL:', error);
        toast({
          title: 'File Access Error',
          description: 'Could not access this PDF. It may have been deleted or moved.',
          variant: 'destructive'
        });
      } finally {
        setIsPdfLoading(false);
      }
    };

    if (resource) loadPdf();
  }, [resource, toast]);

  // 3️⃣ Render states
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        ❌ Resource not found.
      </div>
    );
  }

  const containerClassName = mode === 'dialog'
    ? 'flex h-full flex-col gap-4 p-6'
    : 'p-6 space-y-4';

  const viewerWrapperClassName = mode === 'dialog'
    ? 'flex-1 border rounded-lg overflow-hidden bg-muted/20'
    : 'mt-6 border rounded-lg overflow-hidden bg-muted/20';

  const viewerHeightClassName = mode === 'dialog'
    ? 'h-full'
    : 'h-[83vh]';

  return (
    <div className={containerClassName}>
      <div className={viewerWrapperClassName}>
        {isPdfLoading ? (
          <Skeleton className={`w-full ${viewerHeightClassName}`} />
        ) : pdfUrl ? (
          <iframe
            src={enhancePdfViewerUrl(pdfUrl)}
            title={resource.title}
            className={`w-full ${viewerHeightClassName}`}
            style={{ border: 'none' }}
          />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            ❌ Unable to load PDF. It might be missing or access is denied.
          </div>
        )}
      </div>
    </div>
  );
}
