import { onKeyActivate } from "@/helpers/a11y";
import React, { useState, useMemo, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { Search, X, Check, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";

// Curated list of commonly used Lucide icons for UI/UX purposes
const ICON_LIST = [
  "Star", "Heart", "Home", "User", "Users", "Settings", "Search", "Bell",
  "Mail", "Phone", "Map", "MapPin", "Globe", "Shield", "Lock", "Unlock",
  "Eye", "EyeOff", "Camera", "Image", "Video", "Music", "Headphones",
  "Mic", "Volume2", "Play", "Pause", "ChevronRight", "ChevronLeft",
  "ChevronUp", "ChevronDown", "ArrowRight", "ArrowLeft", "ArrowUp",
  "ArrowDown", "Check", "X", "Plus", "Minus", "Edit", "Trash2",
  "Download", "Upload", "Share2", "Copy", "Clipboard", "Link",
  "ExternalLink", "Bookmark", "Tag", "Flag", "Award", "Trophy",
  "Zap", "Flame", "Sparkles", "Lightbulb", "Target", "Crosshair",
  "BarChart", "BarChart2", "PieChart", "TrendingUp", "TrendingDown",
  "Activity", "Calendar", "Clock", "Timer", "AlarmClock", "Hourglass",
  "Coffee", "ShoppingCart", "ShoppingBag", "Package", "Box", "Gift",
  "CreditCard", "Wallet", "DollarSign", "Percent", "Calculator",
  "FileText", "File", "Folder", "FolderOpen", "Database", "Server",
  "Cloud", "CloudUpload", "CloudDownload", "Wifi", "Bluetooth",
  "Cpu", "Monitor", "Smartphone", "Tablet", "Laptop", "Printer",
  "Layout", "Grid", "List", "Columns", "AlignLeft", "AlignCenter",
  "AlignRight", "Bold", "Italic", "Underline", "Type", "Code",
  "MessageSquare", "MessageCircle", "Send", "Inbox", "AtSign",
  "Building", "Building2", "Briefcase", "GraduationCap", "Book",
  "BookOpen", "Newspaper", "Pencil", "Pen", "Eraser",
  "Layers", "Sliders", "Toggle", "ToggleLeft", "ToggleRight",
  "Sun", "Moon", "Cloud", "Umbrella", "Snowflake", "Wind",
  "Leaf", "Flower", "Tree", "Anchor", "Compass", "Navigation",
  "Car", "Bus", "Train", "Plane", "Bike", "Truck",
  "Key", "KeyRound", "Fingerprint", "Scan", "QrCode", "Barcode",
  "ThumbsUp", "ThumbsDown", "Smile", "Frown", "Meh",
  "Headphones", "Radio", "Cast", "Airplay", "ChromeCast",
  "MoreHorizontal", "MoreVertical", "Menu", "AlignJustify",
  "Info", "HelpCircle", "AlertCircle", "AlertTriangle",
  "CheckCircle", "XCircle", "PlusCircle", "MinusCircle",
  "RefreshCw", "RotateCw", "RotateCcw", "Repeat", "Shuffle",
  "Filter", "Funnel", "SortAsc", "SortDesc", "ChevronRightSquare",
  "Power", "Battery", "BatteryCharging", "Plug",
  "Maximize", "Minimize", "Expand", "Shrink", "Move",
  "Crop", "Scissors", "Paperclip", "Pin", "MapPinned",
  "Rocket", "Satellite", "Telescope", "Microscope", "Flask",
  "Stethoscope", "Pill", "Heart", "Activity", "Syringe",
  "Wrench", "Hammer", "Screwdriver", "Construction", "HardHat",
  "PaintBucket", "Palette", "Wand", "Magic", "Brush",
  "ZoomIn", "ZoomOut", "Focus", "Aperture", "Flash",
];

const UNIQUE_ICONS = [...new Set(ICON_LIST)];

interface LucideIconPickerProps {
  value?: string;
  onChange?: (iconName: string) => void;
  label?: string;
  placeholder?: string;
}

const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return UNIQUE_ICONS;
    return UNIQUE_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const SelectedIconComponent = useMemo(() => {
    if (!value) return null;
    return (LucideIcons as any)[value] as React.FC<any> | null;
  }, [value]);

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange?.(iconName);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.("");
    },
    [onChange],
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-input bg-background hover:bg-accent/30 transition-all duration-200 group text-start"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/15">
          {SelectedIconComponent ? (
            <SelectedIconComponent
              size={20}
              className="text-primary"
            />
          ) : (
            <Smile size={20} className="text-muted-foreground" />
          )}
        </div>
        <span className={`flex-1 text-sm ${value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {value || placeholder || t("select_icon")}
        </span>
        {value && (
          <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
            onClick={handleClear}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 rounded-2xl border border-border bg-background shadow-xl shadow-black/10 overflow-hidden z-50 relative">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search_icon")}
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-7 gap-1 p-3 max-h-56 overflow-y-auto custom-scrollbar">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((iconName) => {
                const IconComp = (LucideIcons as any)[iconName] as React.FC<any> | undefined;
                if (!IconComp) return null;
                const isSelected = value === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelect(iconName)}
                    title={iconName}
                    className={`relative flex items-center justify-center w-full aspect-square rounded-lg transition-all duration-150 group hover:scale-110 ${
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <IconComp size={18} />
                    {isSelected && (
                      <span className="absolute -top-1 -end-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="col-span-7 py-6 text-center text-sm text-muted-foreground">
                {t("no_icon_found")}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredIcons.length} {t("icons")}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LucideIconPicker;
