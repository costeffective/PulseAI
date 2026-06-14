import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Plus_Jakarta_Sans,
} from "next/font/google";

export const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const instrumentSerif = Instrument_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
});

export const bricolage = Bricolage_Grotesque({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700"],
});
