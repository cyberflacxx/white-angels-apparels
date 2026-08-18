import { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "wa-install-prompt-dismissed-at";
const REPROMPT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => isRecentlyDismissed());
  const [iosEligible, setIosEligible] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());

  const canShow = useMemo(() => {
    if (installed || dismissed) return false;
    return Boolean(deferredPrompt || iosEligible);
  }, [deferredPrompt, dismissed, installed, iosEligible]);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      clearDismissal();
    }

    setIosEligible(isIosSafari() && !isStandalone() && !isRecentlyDismissed());
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      clearDismissal();
      return;
    }

    saveDismissal();
    setDismissed(true);
  }

  function dismiss() {
    saveDismissal();
    setDismissed(true);
  }

  if (!canShow) return null;

  return (
    <div className="install-prompt" role="status" aria-live="polite">
      <img src="/images/site/white-angels-logo.png" alt="White Angels logo" className="install-prompt__logo" />
      <div className="install-prompt__body">
        <strong>Install White Angels</strong>
        <p>
          {iosEligible
            ? "Add White Angels to your Home Screen from Safari for faster access."
            : "Shop faster and access White Angels directly from your home screen."}
        </p>
      </div>
      <div className="install-prompt__actions">
        {deferredPrompt ? (
          <button type="button" className="btn btn--primary" onClick={() => void installApp()}>
            Install
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={dismiss}>
            Got It
          </button>
        )}
        {deferredPrompt && <button type="button" className="btn btn--secondary" onClick={dismiss}>Not Now</button>}
      </div>
    </div>
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isRecentlyDismissed() {
  if (typeof window === "undefined") return false;
  const value = window.localStorage.getItem(DISMISS_KEY);
  if (!value) return false;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp < REPROMPT_AFTER_MS;
}

function saveDismissal() {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

function clearDismissal() {
  window.localStorage.removeItem(DISMISS_KEY);
}
