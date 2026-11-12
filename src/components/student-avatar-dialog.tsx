import { useRef, useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  Check,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateStudentAvatar } from "@/lib/academy.functions";

const PRESET_AVATARS = [
  "/images/avatars/abouelghar.jpg",
  "/images/avatars/ali_farag.jpg",
  "/images/avatars/batta.jpg",
  "/images/avatars/hania_hammamy.jpg",
  "/images/avatars/jana.jpg",
  "/images/avatars/mahmoud.jpg",
  "/images/avatars/maram.jpg",
  "/images/avatars/menna_hamed.jpg",
  "/images/avatars/mostafa_asal.jpg",
  "/images/avatars/nouran_gohar.jpg",
  "/images/avatars/nour_sherbini.jpg",
  "/images/avatars/omar.jpg",
];

interface StudentAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: string | null;
  studentId?: string | null;
  studentName?: string;
  onSuccess?: (newUrl: string | null) => void;
}

function processImageFile(file: File, maxDimension = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الصورة"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("ملف الصورة غير صالح"));
      image.onload = () => {
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;
        const targetSize = Math.min(sourceSize, maxDimension);
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(reader.result as string);
          return;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          targetSize,
          targetSize,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function StudentAvatarDialog({
  open,
  onOpenChange,
  currentAvatar,
  studentId,
  studentName,
  onSuccess,
}: StudentAvatarDialogProps) {
  const queryClient = useQueryClient();
  const updateAvatar = useServerFn(updateStudentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPreview(currentAvatar);
      setSelectedPreset(null);
    }
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (PNG أو JPEG أو WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)");
      return;
    }
    try {
      setPreview(await processImageFile(file));
      setSelectedPreset(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذرت معالجة الصورة");
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const saveAvatar = () => {
    startTransition(async () => {
      try {
        const result = await updateAvatar({
          data: { student_id: studentId ?? null, avatar_data: preview },
        });
        toast.success(preview ? "تم تحديث الصورة الشخصية بنجاح" : "تم حذف الصورة الشخصية");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["student-portal"] }),
          queryClient.invalidateQueries({ queryKey: ["students"] }),
          queryClient.invalidateQueries({ queryKey: ["student-details"] }),
        ]);
        onSuccess?.(result.avatar_url);
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        toast.error(`تعذر تحديث الصورة الشخصية${message ? `: ${message}` : ""}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir="rtl" className="max-w-md overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">تغيير الصورة الشخصية</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {studentName
                  ? `تعديل صورة الطالب ${studentName}`
                  : "اختر صورة مناسبة لحسابك الدراسي"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-cyan-500/10 to-primary/5 shadow-md">
                {preview ? (
                  <img src={preview} alt="معاينة الصورة" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-muted-foreground/60" />
                )}
              </div>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setSelectedPreset(null);
                  }}
                  disabled={isPending}
                  className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-destructive text-white shadow-md transition hover:bg-destructive/90"
                  title="حذف الصورة"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {preview
                ? "معاينة صورتك الشخصية الجديدة"
                : "ستظهر الحروف الأولى من اسمك عند عدم إضافة صورة"}
            </p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                رفع من الجهاز
              </TabsTrigger>
              <TabsTrigger value="presets" className="gap-2">
                <UserRound className="h-3.5 w-3.5" />
                صور جاهزة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h4 className="mt-2 text-sm font-semibold text-foreground">
                  اضغط لاختيار صورة من جهازك
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  أو اسحب ملف الصورة وأفلته هنا (JPG أو PNG أو WebP حتى 10 ميجابايت)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="mt-4">
              <p className="mb-3 text-xs text-muted-foreground">اختر صورة جاهزة بنقرة واحدة:</p>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((url, index) => {
                  const isSelected = selectedPreset === url || preview === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(url);
                        setPreview(url);
                      }}
                      className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 ring-offset-1"
                          : "border-border/70 hover:scale-105 hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`صورة جاهزة ${index + 1}`}
                        className="h-full w-full object-cover transition group-hover:scale-110"
                        loading="lazy"
                      />
                      {isSelected && (
                        <span className="absolute inset-0 grid place-items-center bg-primary/30 text-white backdrop-blur-[1px]">
                          <Check className="h-5 w-5 stroke-[3] drop-shadow-md" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/20 px-6 py-3 sm:justify-start">
          <Button
            type="button"
            onClick={saveAvatar}
            disabled={isPending}
            className="flex-1 gap-2 sm:flex-initial"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isPending ? "جاري الحفظ..." : "حفظ الصورة"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
