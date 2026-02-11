"use client";

import { useState, type ComponentProps } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type InvoiceStatus = "approved" | "pending" | "rejected" | string;

type InvoiceData = {
  id: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  payment_type?: string;
  card_last_digits?: string;
  created_at: string;
};

type InvoiceDownloadButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick" | "children"
> & {
  invoice: InvoiceData;
  showLabel?: boolean;
};

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Rejeitado",
};

const paymentLabels: Record<string, string> = {
  credit_card: "Cartao de credito",
  boleto: "Boleto",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-BR");
}

function wrapText(text: string, maxChars = 64) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) {
        lines.push(current.trim());
      }
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) {
    lines.push(current.trim());
  }
  return lines.length ? lines : [text];
}

export function InvoiceDownloadButton({
  invoice,
  showLabel = false,
  variant = "ghost",
  size = "icon-sm",
  className,
  ...props
}: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const marginX = 48;
      let cursorY = height - 64;

      page.drawText("Payment Gateway", {
        x: marginX,
        y: cursorY,
        size: 18,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      cursorY -= 28;
      page.drawText("Resumo da Transacao", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      cursorY -= 20;
      page.drawText(`ID: ${invoice.id}`, {
        x: marginX,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      cursorY -= 20;
      const statusLabel = statusLabels[invoice.status] ?? invoice.status;
      page.drawText(`Status: ${statusLabel}`, {
        x: marginX,
        y: cursorY,
        size: 11,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });

      cursorY -= 20;
      page.drawText(`Valor: ${formatCurrency(invoice.amount)}`, {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      cursorY -= 20;
      page.drawText(`Data: ${formatDate(invoice.created_at)}`, {
        x: marginX,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      cursorY -= 28;
      page.drawText("Pagamento", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      cursorY -= 18;
      const paymentLabel =
        paymentLabels[invoice.payment_type ?? ""] ?? "Nao informado";
      page.drawText(`Metodo: ${paymentLabel}`, {
        x: marginX,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      cursorY -= 16;
      const lastDigits = invoice.card_last_digits
        ? `**** ${invoice.card_last_digits}`
        : "-";
      page.drawText(`Ultimos digitos: ${lastDigits}`, {
        x: marginX,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      cursorY -= 28;
      page.drawText("Descricao", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      cursorY -= 18;
      const descriptionLines = wrapText(invoice.description || "-", 72);
      descriptionLines.forEach((line) => {
        page.drawText(line, {
          x: marginX,
          y: cursorY,
          size: 10,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
        cursorY -= 14;
      });

      cursorY -= 16;
      page.drawText("Gerado automaticamente pelo Payment Gateway.", {
        x: marginX,
        y: cursorY,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Uint8Array.from(pdfBytes).buffer;
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transacao-${invoice.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={className}
      disabled={isGenerating}
      {...props}
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {showLabel && (isGenerating ? "Gerando..." : "Download PDF")}
    </Button>
  );
}
