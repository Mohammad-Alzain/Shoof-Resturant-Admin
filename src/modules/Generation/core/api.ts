import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudApi } from "@/Api/crud";
import { http } from "@/Api/httpClient";

/** 0 Pending (queued), 1 Processing, 2 Ready, 3 Failed, 4 Cancelled */
export enum JobStatus {
  Pending = 0,
  Processing = 1,
  Ready = 2,
  Failed = 3,
  Cancelled = 4,
}
/** 0 3D model, 1 AI photo */
export enum JobKind {
  Model = 0,
  Image = 1,
}

export interface IJob {
  id: string;
  menuItemId: string;
  menuItemName?: string | null;
  status: JobStatus;
  kind: JobKind;
  externalProviderName?: string | null;
  retryCount: number;
  errorMessage?: string | null;
  batchId?: string | null;
  submittedAt?: string | null;
  finishedAt?: string | null;
  isLibraryMatch: boolean;
  queuePosition?: number | null;
  resultThumbnailUrl?: string | null;
  creationDateTime?: string | null;
}

export const jobsApi = createCrudApi<IJob>("model-generation-jobs", "model-generation-jobs", { serverSearch: true });

export interface IQuota {
  dailyRemaining?: number | null;
  monthlyRemaining?: number | null;
  isApiKeyPool?: boolean;
  extraCreditsRemaining: number;
  extraCreditsNearestExpiryUtc?: string | null;
}
export const useQuota = () =>
  useQuery({ queryKey: ["model-generation-jobs", "quota"], queryFn: () => http.get<IQuota>("model-generation-jobs/quota"), staleTime: 15_000, refetchInterval: 60_000 });

/** How many generations can still be started right now (null = no cap). */
export const remainingCap = (q?: IQuota): number | null => {
  if (!q) return null;
  const caps: number[] = [];
  if (q.dailyRemaining != null) caps.push(q.dailyRemaining);
  if (q.monthlyRemaining != null) caps.push(q.monthlyRemaining + (q.extraCreditsRemaining ?? 0));
  return caps.length ? Math.max(0, Math.min(...caps)) : null;
};

export const useGenerate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { menuItemId: string; forceNew?: boolean }) => http.post<IJob>("model-generation-jobs", { menuItemId: v.menuItemId, forceNew: !!v.forceNew }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["model-generation-jobs"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};

export interface IBulkResult {
  batchId?: string;
  created: IJob[];
  skipped: { menuItemId: string; reason: string }[];
}
export const useBulkGenerate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { menuItemIds: string[]; forceNew?: boolean }) => http.post<IBulkResult>("model-generation-jobs/bulk", { menuItemIds: v.menuItemIds, forceNew: !!v.forceNew }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["model-generation-jobs"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};

export const useCancelJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.post<IJob>(`model-generation-jobs/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["model-generation-jobs"] }),
  });
};
export const useCancelBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => http.post<number>(`model-generation-jobs/batches/${batchId}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["model-generation-jobs"] }),
  });
};
