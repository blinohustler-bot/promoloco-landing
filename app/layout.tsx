import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';

// Barlow : dessinée d'après la signalisation routière californienne — le bon registre pour l'auto.
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow', display: 'swap' });
const barlowC = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-barlow-c', display: 'swap' });

export const metadata: Metadata = {
  title: 'Devenir partenaire — PromoLoco',
  description: 'Des clients du quartier, livrés chez vous. Payé à la performance : tu payes seulement pour les clients qui se présentent.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={`${barlow.variable} ${barlowC.variable}`}>
      <body>{children}</body>
    </html>
  );
}
