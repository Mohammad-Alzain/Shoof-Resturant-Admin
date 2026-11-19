import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  primaryColor?: string;
  secondaryColor?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  primaryColor = "border-black",
  secondaryColor = "border-gray-200 dark:border-gray-700",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-4",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-8",
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeClasses[size]} ${secondaryColor} ${primaryColor}`}
      style={{ borderTopColor: "currentColor" }}
    ></div>
  );
};

export default Spinner;
