import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { FloatingWhatsAppButton } from "../components/FloatingWhatsAppButton";
import { Navbar } from "../components/Navbar";

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <FloatingWhatsAppButton />
      <Footer />
    </>
  );
}
