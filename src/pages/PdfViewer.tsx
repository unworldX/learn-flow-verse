import { useLocation, useNavigate, useParams } from "react-router-dom";
import PdfViewerContent from "@/components/resources/PdfViewerContent";
import { Resource } from "@/hooks/useRealResources";

interface LocationState {
  resource?: Resource;
}

const PdfViewer = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/resources");
    }
  };

  if (!resourceId) {
    handleClose();
    return null;
  }

  return (
    <PdfViewerContent
      resourceId={resourceId}
      initialResource={state?.resource ?? null}
      onClose={handleClose}
      mode="page"
    />
  );
};

export default PdfViewer;
