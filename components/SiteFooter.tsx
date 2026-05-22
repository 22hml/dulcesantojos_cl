const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-6 border-t border-border bg-theme-elevated px-[5%] py-12">
      <div>
        <span className="font-bebas text-lg tracking-widest text-theme">
          DULCES
        </span>
        <span className="font-script block text-[1.3rem] leading-[0.9] text-gold">
          Antojos
        </span>
        <p className="mt-2 text-[0.7rem] text-gray">
          Pastelería & Shop · Santiago · Desde 2015
        </p>
      </div>
      <p className="text-[0.76rem] leading-loose text-gray">
        dulcesantojos.cl · Santiago, Chile
        <br />
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            className="text-gold hover:underline"
          >
            +56 {waNumber.replace(/^56/, "")}
          </a>
        )}
        {" · "}
        <a
          href="https://instagram.com/dulcesantojos_cl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          @dulcesantojos_cl
        </a>
        {" · "}
        <a
          href="https://instagram.com/dulcesantojosshop"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          @dulcesantojosshop
        </a>
        <br />
      </p>
    </footer>
  );
}
