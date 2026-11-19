import { useTranslation } from "react-i18next";
import { GazeLoader } from "@/components/common/Brand";
const ListLoading = () => {
  const styles = {
    borderRadius: "0.475rem",
    // boxShadow: "0 0 50px 0 rgb(82 63 105 / 15%)",
    // backgroundColor: "#fff",
    color: "var(--muted-foreground)",
    fontWeight: "500",
    margin: "0",
    width: "auto",
    padding: "1rem 2rem",
    top: "calc(50% - 2rem)",
    left: "calc(50% - 4rem)",
  };
  const { t } = useTranslation();
  return (
    <div
      style={{ ...styles, position: "absolute", textAlign: "center" }}
      className=""
    >
      <div className="flex flex-col items-center gap-2">
        <GazeLoader className="h-10" />
        <span>{t("loading")}</span>
      </div>
    </div>
  );
};

export { ListLoading };
