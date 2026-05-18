import Navbar from "@/components/Navbar";
import HeroSplit from "@/components/HeroSplit";
import MarqueeBar from "@/components/MarqueeBar";
import Catalog from "@/components/Catalog";
import FeaturesBar from "@/components/FeaturesBar";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/CartDrawer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSplit />
        <MarqueeBar />
        <Catalog />
        <FeaturesBar />
      </main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
