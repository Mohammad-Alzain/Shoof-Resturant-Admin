import { FC, PropsWithChildren, Suspense } from "react";
import TopBarProgress from "react-topbar-progress-indicator";

export const SuspensedView: FC<PropsWithChildren> = ({ children }) => {
  TopBarProgress.config({
    // barColors: {
    //   "0": baseColor,
    // },
    barThickness: 1,
    shadowBlur: 5,
  });
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>;
};
