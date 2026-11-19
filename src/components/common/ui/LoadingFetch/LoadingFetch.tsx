import React from "react";
import { Lottie } from "lottie-react";
import animationData from "./Animation.json";

const FetchDataLoading = () => {
  return (
    <div className=" w-full h-full flex items-center justify-center">
      <Lottie src={animationData} loop autoplay />
    </div>
  );
};

export default FetchDataLoading;
