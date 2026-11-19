import { useMutation, useQuery } from "@tanstack/react-query";
import { ChangePasswordApi, GetMeApi, UpdateMeApi } from "@/modules/Auth/core/api/api-auth";

export const useMe = () => useQuery({ queryKey: ["account", "me"], queryFn: GetMeApi });
export const useUpdateMe = () => useMutation({ mutationFn: UpdateMeApi });
export const useChangeMyPassword = () => useMutation({ mutationFn: ChangePasswordApi });
