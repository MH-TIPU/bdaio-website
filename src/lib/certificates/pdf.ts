import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Certificates are rendered on demand from the database record rather than
// stored as files: nothing to back up, and a revoked certificate stops being
// downloadable immediately.
//
// pdf-lib is used instead of @react-pdf/renderer to avoid coupling PDF output
// to a React version while React 19 / Next 16 are still settling.

export type CertificateData = {
  serial: string;
  recipientName: string;
  title: string;
  detail: string | null;
  eventTitle: string | null;
  issuedAt: Date;
  verifyUrl: string;
};

const BLUE = rgb(0.118, 0.353, 0.541); // #1e5a8a — BdAIO blue
const EMERALD = rgb(0.063, 0.725, 0.506);
const SLATE = rgb(0.28, 0.33, 0.41);
const LIGHT = rgb(0.85, 0.88, 0.91);

export async function renderCertificate(
  data: CertificateData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${data.title} — ${data.recipientName}`);
  pdf.setSubject(`BdAIO certificate ${data.serial}`);
  pdf.setProducer("BdAIO Platform");

  // A4 landscape.
  const page = pdf.addPage([842, 595]);
  const { width, height } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const centre = (
    text: string,
    y: number,
    size: number,
    font = serif,
    color = SLATE,
  ) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  // Border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: BLUE,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: LIGHT,
    borderWidth: 1,
  });

  centre("BANGLADESH ARTIFICIAL INTELLIGENCE OLYMPIAD", height - 92, 13, sansBold, BLUE);
  centre("BdAIO", height - 122, 26, serifBold, BLUE);

  page.drawLine({
    start: { x: width / 2 - 60, y: height - 140 },
    end: { x: width / 2 + 60, y: height - 140 },
    thickness: 2,
    color: EMERALD,
  });

  centre(data.title, height - 190, 22, serifBold, SLATE);
  centre("This certificate is presented to", height - 226, 12, sans, SLATE);

  // Recipient name — the visual focus.
  centre(data.recipientName, height - 274, 34, serifBold, BLUE);
  page.drawLine({
    start: { x: 180, y: height - 288 },
    end: { x: width - 180, y: height - 288 },
    thickness: 0.75,
    color: LIGHT,
  });

  if (data.eventTitle) {
    centre(`for participation in ${data.eventTitle}`, height - 318, 13, sans, SLATE);
  }
  if (data.detail) {
    centre(data.detail, height - 340, 12, sans, SLATE);
  }

  // Footer: date, serial, verification pointer.
  const issued = data.issuedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Issued ${issued}`, { x: 72, y: 88, size: 10, font: sans, color: SLATE });
  page.drawText(`Certificate no. ${data.serial}`, {
    x: 72,
    y: 72,
    size: 10,
    font: sansBold,
    color: BLUE,
  });

  const verifyLabel = "Verify at";
  page.drawText(verifyLabel, { x: width - 300, y: 88, size: 9, font: sans, color: SLATE });
  page.drawText(data.verifyUrl, {
    x: width - 300,
    y: 74,
    size: 9,
    font: sans,
    color: BLUE,
  });

  return pdf.save();
}

/** Human-readable, hard to guess, and unique: BDAIO-2026-XXXXXXXX. */
export function certificateSerial(year: number, random: string): string {
  return `BDAIO-${year}-${random.toUpperCase()}`;
}
