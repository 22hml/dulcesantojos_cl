import Navbar from "@/components/Navbar";
import HeroFull from "@/components/HeroFull";
import TrustBar from "@/components/TrustBar";
import MarqueeBar from "@/components/MarqueeBar";
import Catalog from "@/components/Catalog";
import HowItWorks from "@/components/HowItWorks";
import FeaturesBar from "@/components/FeaturesBar";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/CartDrawer";
import AddToCartModal from "@/components/AddToCartModal";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroFull />
        <TrustBar />
        <MarqueeBar />
        <Catalog />
        <HowItWorks />
        <FeaturesBar />
      </main>
      <SiteFooter />
      <CartDrawer />
      <AddToCartModal />
    </>
  );
}
