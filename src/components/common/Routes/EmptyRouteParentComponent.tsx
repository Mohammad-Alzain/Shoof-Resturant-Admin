import { Outlet } from "@tanstack/react-router";
import React from "react";

function EmptyRouteParentComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default EmptyRouteParentComponent;
