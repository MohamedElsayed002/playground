import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadCsvPipeline } from "@/lib/csv-upload";
import { useRouter } from "next/navigation";

export function useCsvUpload() {
  const queryClient = useQueryClient();
  const router = useRouter()
  return useMutation({
    mutationFn: ({ file, idempotencyKey }: {file: File, idempotencyKey: string}) => uploadCsvPipeline(file, idempotencyKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
      router.push(`/extract-csv-pipeline/upload/${data.data.job_id}`)
    },
  });
}
