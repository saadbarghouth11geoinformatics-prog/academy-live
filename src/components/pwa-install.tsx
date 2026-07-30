import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, MonitorDown, Share2, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(false);

  const isIos = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInstalled(isStandalone());

    if (
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      const register = () =>
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      if (document.readyState === "complete") void register();
      else window.addEventListener("load", register, { once: true });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setGuideOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const dismissedAt = Number(localStorage.getItem("obaida-install-dismissed-at") || 0);
    const canShowAgain = Date.now() - dismissedAt > 7 * 24 * 60 * 60 * 1000;
    const timer = window.setTimeout(() => {
      if (!isStandalone() && canShowAgain) setVisible(true);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setInstallPrompt(null);
      return;
    }
    setGuideOpen(true);
  }

  function dismiss() {
    localStorage.setItem("obaida-install-dismissed-at", String(Date.now()));
    setVisible(false);
  }

  async function shareInstallLink() {
    const shareData = {
      title: "تطبيق منصة عُبيدة",
      text: "ثبّت منصة عُبيدة على موبايلك أو الكمبيوتر من هذا الرابط.",
      url: `${window.location.origin}/?install=1`,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyInstallLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/?install=1`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (installed || !visible) return null;

  return (
    <>
      <aside className="pwa-install-card" dir="rtl" aria-label="تثبيت تطبيق منصة عُبيدة">
        <button
          type="button"
          className="pwa-install-close"
          onClick={dismiss}
          aria-label="إخفاء رسالة التثبيت"
        >
          <X />
        </button>
        <span className="pwa-install-logo">
          <Download />
        </span>
        <div>
          <strong>ثبّت منصة عُبيدة</strong>
          <p>وصول أسرع وتجربة تطبيق كاملة على جهازك.</p>
        </div>
        <button type="button" className="pwa-install-action" onClick={install}>
          تثبيت
        </button>
      </aside>

      {guideOpen && (
        <div
          className="pwa-guide-overlay"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setGuideOpen(false)}
        >
          <section
            className="pwa-guide-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            dir="rtl"
          >
            <button
              type="button"
              className="pwa-guide-close"
              onClick={() => setGuideOpen(false)}
              aria-label="إغلاق"
            >
              <X />
            </button>
            <span className="pwa-guide-mark">
              <Download />
            </span>
            <h2 id="pwa-guide-title">نزّل المنصة على جهازك</h2>
            <p className="pwa-guide-intro">
              لا تحتاج لإرسال ملف مختلف لكل مستخدم؛ ابعت رابط المنصة على واتساب واتبع الخطوات
              المناسبة للجهاز.
            </p>

            <div className="pwa-guide-steps">
              <article className={isIos ? "is-current" : ""}>
                <span>
                  <Smartphone />
                </span>
                <div>
                  <strong>iPhone وiPad</strong>
                  <p>
                    افتح الرابط في Safari، اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية»
                    واضغط «إضافة».
                  </p>
                </div>
              </article>
              <article className={!isIos ? "is-current" : ""}>
                <span>
                  <Download />
                </span>
                <div>
                  <strong>Android</strong>
                  <p>
                    افتح الرابط في Chrome واضغط «تثبيت التطبيق». إن لم يظهر الزر، افتح قائمة ⋮ واختر
                    «تثبيت التطبيق».
                  </p>
                </div>
              </article>
              <article>
                <span>
                  <MonitorDown />
                </span>
                <div>
                  <strong>Windows وmacOS</strong>
                  <p>
                    افتح الرابط في Chrome أو Edge واضغط علامة التثبيت الموجودة بجوار عنوان الموقع.
                  </p>
                </div>
              </article>
            </div>

            <div className="pwa-guide-actions">
              <button type="button" onClick={shareInstallLink}>
                <Share2 /> مشاركة رابط التثبيت
              </button>
              <button type="button" className="is-secondary" onClick={copyInstallLink}>
                {copied ? <Check /> : <Copy />}
                {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
