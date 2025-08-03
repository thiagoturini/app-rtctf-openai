import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RTCTF - Transformador de Prompts IA",
  description: "Transforme seus textos em prompts otimizados usando a metodologia RTCTF (Resultado, Tarefa, Contexto, Critérios, Formato). Melhore sua interação com LLMs e IA.",
  keywords: ["prompt engineering", "RTCTF", "IA", "LLM", "ChatGPT", "prompts", "inteligência artificial"],
  authors: [{ name: "Thiago Turini" }],
  creator: "Thiago Turini",
  openGraph: {
    title: "RTCTF - Transformador de Prompts IA",
    description: "Transforme seus textos em prompts otimizados usando a metodologia RTCTF",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "RTCTF - Transformador de Prompts IA",
    description: "Transforme seus textos em prompts otimizados usando a metodologia RTCTF",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
