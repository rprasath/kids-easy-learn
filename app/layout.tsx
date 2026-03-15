import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kidslearn.zybezone.com"),
  title: "zybezone - kids learn",
  description: "zybezone - kids learn is a playful geography learning app with flashcards, clues, and quizzes.",
  alternates: {
    canonical: "https://kidslearn.zybezone.com",
  },
  openGraph: {
    title: "zybezone - kids learn",
    description: "A playful geography learning app with flashcards, clues, and quizzes.",
    url: "https://kidslearn.zybezone.com",
    siteName: "zybezone - kids learn",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
