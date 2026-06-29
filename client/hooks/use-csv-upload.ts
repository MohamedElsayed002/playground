import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadCsvPipeline } from "@/lib/csv-upload";


export function useCsvUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, idempotencyKey }: {file: File, idempotencyKey: string}) => uploadCsvPipeline(file, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
    },
  });
}
