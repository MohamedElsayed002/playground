import { useMutation } from "@tanstack/react-query";
import { uploadPDFPipeline } from "@/lib/pdf-upload";
import { useRouter } from "next/navigation";


export function usePDFUpload() {
    const router = useRouter()
    return useMutation({
        mutationFn: ({ file, idempotencyKey }: { file: File; idempotencyKey: string }) =>
            uploadPDFPipeline(file, idempotencyKey),
        onSuccess: (data) => {
            if("errors" in data) {
                throw new Error(`Error uploading PDF: ${data.file_id}`);
            }
            return router.push(`/extract-pdf-pipeline/${data.file_id}/status`)
        },
    });
}