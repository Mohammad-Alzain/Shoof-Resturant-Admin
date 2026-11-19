import { useMutation } from "@tanstack/react-query";
import {
  ChangePasswordApi,
  ForgotPasswordApi,
  ResetPasswordApi,
  SignInApi,
} from "./api-auth";

export const useSignInPost = () => useMutation({ mutationFn: SignInApi });
export const useChangePassword = () => useMutation({ mutationFn: ChangePasswordApi });
export const useForgotPassword = () => useMutation({ mutationFn: ForgotPasswordApi });
export const useResetPassword = () => useMutation({ mutationFn: ResetPasswordApi });
