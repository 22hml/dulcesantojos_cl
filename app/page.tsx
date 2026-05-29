import Navbar from "@/components/Navbar";
import HeroFull from "@/components/HeroFull";
import TrustBar from "@/components/TrustBar";
import MarqueeBar from "@/components/MarqueeBar";
import Catalog from "@/components/Catalog";
import HowItWorks from "@/components/HowItWorks";
import FeaturesBar from "@/components/FeaturesBar";
import SiteFooter from "@/components/SiteFooter";
import CartLayer from "@/components/CartLayer";
import { getHomeData } from "@/lib/home-data";

export const revalidate = 120;

export default async function Home() {
  const { products, heroItems, demoMode } = await getHomeData();

  return (
    <>
      <Navbar />
      <main>
        <HeroFull initialItems={heroItems} />
        <TrustBar />
        <MarqueeBar />
        <Catalog initialProducts={products} demoMode={demoMode} />
        <HowItWorks />
        <FeaturesBar />
      </main>
      <SiteFooter />
      <CartLayer />
    </>
  );
}
