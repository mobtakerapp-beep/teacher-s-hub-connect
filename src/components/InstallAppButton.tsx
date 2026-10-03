import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDeferred(null);
      return;
    }
    // iOS / browsers without the install prompt
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast.info(
      isIos
        ? "من متصفح سفاري: اضغطي زر المشاركة ثم «إضافة إلى الشاشة الرئيسية» 🌸"
        : "من قائمة المتصفح (⋮) اختاري «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»",
      { duration: 6000 }
    );
  };

  return (
    <button
      onClick={install}
      className="inline-flex items-center gap-1.5 text-sm font-bold border border-border rounded-full px-3 py-1.5 bg-card hover:-translate-y-0.5 transition-transform"
      title="تثبيت المنصة على الجهاز"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">تثبيت التطبيق</span>
      <span className="sm:hidden">تثبيت</span>
    </button>
  );
}
