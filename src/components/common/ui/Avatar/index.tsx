import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import { EyeIcon, RotateCw, User2Icon, ZoomIn, ZoomOut } from "lucide-react";
import { ReactNode, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
interface Props {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  icon?: ReactNode;
}
import "react-photo-view/dist/react-photo-view.css";

export function AvatarWithBlank(props: Props) {
  const width = props?.width ?? 40; // Default width 40
  const height = props?.height ?? width; // Default height same as width if not provided

  const [hovered, setHovered] = useState(false);

  return props?.src ? (
    <PhotoProvider
      maskOpacity={0.5}
      toolbarRender={({ rotate, onRotate, onScale, scale }) => {
        return (
          <div className="flex gap-2">
            <RotateCw
              className="cursor-pointer"
              onClick={() => onRotate(rotate + 90)}
            />
            <ZoomIn
              className="cursor-pointer"
              onClick={() => onScale(scale + 1)}
            />
            <ZoomOut
              className="cursor-pointer"
              onClick={() => onScale(scale - 1)}
            />
          </div>
        );
      }}
    >
      <div
        className={props?.src && "cursor-pointer object-cover rounded"}
        onMouseLeave={() => setHovered(false)}
        onMouseEnter={(event) => {
          setHovered(true);
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <PhotoView src={props?.src}>
          <Avatar
            className="relative rounded-lg border-0 outline-0"
            style={{ width: `${width}px`, height: `${height}px` }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {props?.src && (
              <div
                className={`bg-black absolute bg-opacity-50 w-full h-full ${
                  hovered ? "opacity-75" : "opacity-0"
                } duration-500`}
              >
                <EyeIcon
                  width={width / 2}
                  height={height / 2}
                  className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] text-gray-300"
                />
              </div>
            )}
            <AvatarImage
              className="rounded-lg"
              style={{ width: `${width}px`, height: `${height}px` }}
              src={props?.src}
              alt={props?.alt}
            />
            <AvatarFallback
              className={clsx(
                "rounded-lg relative text-[#b01600] dark:text-red-400 bg-primary/10 dark:bg-primary/20 flex items-center justify-center",
              )}
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              {props?.icon ? (
                props?.icon
              ) : (
                <User2Icon width={width / 1.5} height={height / 1.5} />
              )}
            </AvatarFallback>
          </Avatar>
        </PhotoView>
      </div>
    </PhotoProvider>
  ) : (
    <Avatar
      className="rounded-lg relative flex items-center justify-center bg-primary/10 dark:bg-primary/20 shrink-0"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <AvatarFallback
        className={clsx(
          "rounded-lg relative text-primary bg-transparent flex items-center justify-center w-full h-full",
        )}
      >
        {props?.icon ? (
          props?.icon
        ) : (
          <User2Icon width={width / 1.5} height={height / 1.5} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
