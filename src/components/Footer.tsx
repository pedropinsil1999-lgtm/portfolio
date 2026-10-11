import BackToTop from "@/components/BackToTop";

export default function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-8 label text-[0.85rem] text-fg/50 sm:text-[0.95rem] md:px-12">
      <span>Pedro Henrique | Resende, RJ</span>
      <BackToTop />
    </footer>
  );
}
