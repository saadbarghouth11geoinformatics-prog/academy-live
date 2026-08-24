import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://academy-live.vercel.app";

const config: CapacitorConfig = {
  appId: "com.obaida.academy",
  appName: "منصة الأستاذ عُبيدة",
  // TanStack Start is server-rendered. This local shell is only a safe fallback;
  // the Android build should be synced with CAPACITOR_SERVER_URL set to production.
  webDir: "capacitor-web",
  backgroundColor: "#f4faff",
  android: {
    backgroundColor: "#f4faff",
    allowMixedContent: false,
  },
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
