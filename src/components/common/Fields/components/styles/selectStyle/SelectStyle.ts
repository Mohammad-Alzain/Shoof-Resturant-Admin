import { StylesConfig } from "react-select";

export const reactSelectStyle: StylesConfig = {
  control: (styles, { isFocused }) => ({
    ...styles,
    width: "100%",
    backgroundColor: "oklch(var(--background))",
    borderColor: isFocused ? "oklch(var(--ring))" : "oklch(var(--input))",
    borderWidth: "1px",
    outline: "none",
    borderRadius: "var(--radius)",
    boxShadow: isFocused ? "0 0 0 3px oklch(var(--ring) / 0.3)" : "none",
    minHeight: "34px", // md variant
    fontSize: "0.8125rem",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "oklch(var(--input))",
    },
  }),
  option: (styles, { isSelected, isFocused }) => ({
    ...styles,
    backgroundColor: isSelected
      ? "oklch(var(--primary))"
      : isFocused
        ? "oklch(var(--muted))"
        : "oklch(var(--background))",
    color: isSelected
      ? "oklch(var(--primary-foreground))"
      : "oklch(var(--foreground))",
    fontSize: "0.8125rem",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "oklch(var(--primary) / 0.9)",
    },
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: "oklch(var(--background))",
    border: "1px solid oklch(var(--input))",
    borderRadius: "var(--radius)",
    boxShadow: "0 2px 8px oklch(var(--foreground) / 0.1)",
    zIndex: 9999,
  }),
  singleValue: (styles) => ({
    ...styles,
    color: "oklch(var(--foreground))",
  }),
  input: (styles) => ({
    ...styles,
    color: "oklch(var(--foreground))",
    "& input": {
      boxShadow: "none !important",
    },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: "oklch(var(--muted-foreground) / 0.8)",
  }),
  indicatorsContainer: (styles) => ({
    ...styles,
    color: "oklch(var(--muted-foreground))",
    "&:hover": {
      color: "oklch(var(--foreground))",
    },
  }),
  multiValue: (styles) => ({
    ...styles,
    backgroundColor: "oklch(var(--muted))",
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: "oklch(var(--foreground))",
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    color: "oklch(var(--muted-foreground))",
    "&:hover": {
      backgroundColor: "oklch(var(--destructive))",
      color: "oklch(var(--destructive-foreground))",
    },
  }),
};

// Variant-specific styles
export const getReactSelectStyles = (
  variant: "sm" | "md" | "lg" = "md"
): StylesConfig => {
  const sizes = {
    sm: {
      minHeight: "28px",
      fontSize: "0.75rem",
      padding: "0.125rem 0.5rem",
    },
    md: {
      minHeight: "34px",
      fontSize: "0.8125rem",
      padding: "0.25rem 0.75rem",
    },
    lg: {
      minHeight: "40px",
      fontSize: "0.875rem",
      padding: "0.375rem 1rem",
    },
  };

  return {
    ...reactSelectStyle,
    control: (styles, state) => ({
      ...reactSelectStyle.control?.(styles, state),
      minHeight: sizes[variant].minHeight,
      fontSize: sizes[variant].fontSize,
      padding: sizes[variant].padding,
    }),
    option: (styles, state) => ({
      ...reactSelectStyle.option?.(styles, state),
      fontSize: sizes[variant].fontSize,
      padding: `0.375rem ${sizes[variant].padding.split(" ")[1]}`,
    }),
    dropdownIndicator: (styles) => ({
      ...styles,
      padding: sizes[variant].padding.split(" ")[0],
    }),
    clearIndicator: (styles) => ({
      ...styles,
      padding: sizes[variant].padding.split(" ")[0],
    }),
    valueContainer: (styles) => ({
      ...styles,
      padding: `0 ${sizes[variant].padding.split(" ")[1]}`,
    }),
  };
};
