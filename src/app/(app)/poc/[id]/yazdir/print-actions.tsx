"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  backHref: string;
};

/**
 * Yazdirma penceresi acilista tetiklenir (PDF olarak kaydet buradan yapilir).
 * Kullanici pencereyi kapatirsa butondan tekrar acabilir.
 */
export function PrintActions({ backHref }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        href={backHref}
        className="press inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Düzenlemeye dön
      </Link>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Yazdırma penceresinde hedef olarak &quot;PDF olarak kaydet&quot;
          seçiniz.
        </p>
        <Button
          type="button"
          size="lg"
          className="press h-10 gap-2"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Yazdır
        </Button>
      </div>
    </div>
  );
}
