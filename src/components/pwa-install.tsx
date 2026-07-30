import { useEffect, useState } from "react";
import { CheckCircle2, Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type DevicePlatform = "desktop" | "android" | "ios";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectPlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "desktop";
  const userAgent = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return "desktop";
}

const platformContent: Record<
  DevicePlatform,
  {
    badge: string;
    cardTitle: string;
    cardText: string;
    cardAction: string;
    title: string;
    intro: string;
    steps: string[];
  }
> = {
  desktop: {
    badge: "نسخة الكمبيوتر",
    cardTitle: "نزّل المنصة على الكمبيوتر",
    cardText: "افتحها كتطبيق مستقل من سطح المكتب.",
    cardAction: "تنزيل للكمبيوتر",
    title: "ثبّت منصة عُبيدة على الكمبيوتر",
    intro: "ستعمل المنصة في نافذة مستقلة، مع أيقونة على سطح المكتب ووصول أسرع لحسابك.",
    steps: [
      "استخدم Google Chrome أو Microsoft Edge.",
      "اضغط علامة التثبيت الموجودة بجوار عنوان الموقع.",
      "اختر «تثبيت» وستظهر المنصة كتطبيق مستقل.",
    ],
  },
  android: {
    badge: "تطبيق Android",
    cardTitle: "نزّل المنصة على موبايلك",
    cardText: "تطبيق كامل وسريع على شاشة هاتفك.",
    cardAction: "تنزيل للأندرويد",
    title: "ثبّت منصة عُبيدة على Android",
    intro: "لا تحتاج إلى ملف APK؛ يثبت Chrome المنصة كتطبيق آمن ومتكامل على هاتفك.",
    steps: [
      "افتح المنصة باستخدام Google Chrome.",
      "افتح قائمة ⋮ أعلى المتصفح.",
      "اختر «تثبيت التطبيق» ثم اضغط «تثبيت».",
    ],
  },
  ios: {
    badge: "iPhone وiPad",
    cardTitle: "أضف المنصة إلى الآيفون",
    cardText: "خطوات بسيطة من Safari إلى شاشتك الرئيسية.",
    cardAction: "طريقة التثبيت",
    title: "أضف منصة عُبيدة إلى iPhone",
    intro: "Apple لا تعرض زر تثبيت مباشر، لكن يمكنك إضافة المنصة كتطبيق من داخل Safari.",
    steps: [
      "افتح هذا الرابط في متصفح Safari.",
      "اضغط زر المشاركة الموجود أسفل الشاشة.",
      "اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».",
    ],
  },
};

export function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<DevicePlatform>("desktop");
  const [guideOpen, setGuideOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInstalled(isStandalone());
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

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
      setGuideOpen(false);
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
    const installRequested = new URLSearchParams(location.search).get("install") === "1";
    const fallbackDelay = detectedPlatform === "ios" ? 1200 : installRequested ? 1800 : 4500;
    const timer = window.setTimeout(() => {
      if (isStandalone() || (!canShowAgain && !installRequested)) return;
      setVisible(true);
    }, fallbackDelay);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setGuideOpen(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setGuideOpen(false);
      }
    } finally {
      setInstallPrompt(null);
    }
  }

  function dismiss() {
    localStorage.setItem("obaida-install-dismissed-at", String(Date.now()));
    setVisible(false);
    setGuideOpen(false);
  }

  if (installed || !visible) return null;

  const content = platformContent[platform];

  return (
    <>
      <aside className="pwa-install-card" dir="rtl" aria-label={content.cardTitle}>
        <button
          type="button"
          className="pwa-install-close"
          onClick={dismiss}
          aria-label="إخفاء رسالة التثبيت"
        >
          <X />
        </button>
        <span className="pwa-install-logo">
          <img src="/icons/icon-192.png?v=4" alt="" />
        </span>
        <div>
          <strong>{content.cardTitle}</strong>
          <p>{content.cardText}</p>
        </div>
        <button type="button" className="pwa-install-action" onClick={install}>
          <Download />
          {content.cardAction}
        </button>
      </aside>

      {guideOpen && (
        <div
          className="pwa-guide-overlay"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setGuideOpen(false)}
        >
          <section
            className="pwa-guide-sheet pwa-device-guide"
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
              <img src="/icons/icon-192.png?v=4" alt="" />
            </span>
            <span className="pwa-device-badge">{content.badge}</span>
            <h2 id="pwa-guide-title">{content.title}</h2>
            <p className="pwa-guide-intro">{content.intro}</p>

            <ol className="pwa-device-instructions">
              {content.steps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                  {index === content.steps.length - 1 && <CheckCircle2 aria-hidden="true" />}
                </li>
              ))}
            </ol>

            <div className="pwa-guide-actions is-single">
              {installPrompt ? (
                <button type="button" onClick={install}>
                  <Download /> تثبيت التطبيق الآن
                </button>
              ) : (
                <button type="button" onClick={() => setGuideOpen(false)}>
                  {platform === "ios" ? <Share /> : <CheckCircle2 />}
                  {platform === "ios" ? "اتبع الخطوات في Safari" : "تمام، عرفت طريقة التثبيت"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
