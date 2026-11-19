import React, { FC, ReactNode, useEffect } from "react";

import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { useTranslation } from "react-i18next";
import SplashScreen from "@/components/common/ui/SplashScreen";
//import { useNavigate } from "@tanstack/react-router";
type WithChildren = {
  children?: ReactNode;
};

const AuthInit: FC<WithChildren> = ({ children }) => {
  const { permissionsIsFetching } = useAuthStore();
  const { i18n } = useTranslation();
  useEffect(() => {

    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir();
  }, [i18n.language]);
  // We should request user by authToken (IN OUR EXAMPLE IT'S API_TOKEN) before rendering the application

  return permissionsIsFetching ? <SplashScreen /> : <>{children}</>;
};

export { AuthInit };
