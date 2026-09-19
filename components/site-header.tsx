import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-8 py-3 text-sm">
        <Link href="/" className="font-bold">
          生态商机雷达
        </Link>
        <Link href="/accounts" className="text-muted-foreground hover:text-foreground">
          账户库
        </Link>
        <Link href="/pipeline" className="text-muted-foreground hover:text-foreground">
          Pipeline 看板
        </Link>
      </nav>
    </header>
  );
}
