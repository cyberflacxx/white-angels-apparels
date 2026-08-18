import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";
import { Navbar } from "../components/Navbar";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <PwaInstallPrompt />
      <FloatingWhatsAppButton />
      <Footer />
    </>
  );
}
