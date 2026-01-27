import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { MusicPlayer } from '@/components/MusicPlayer';

export const metadata: Metadata = {
  title: 'The Great Propeth',
  description: 'What does your future hold?',
  openGraph: {
    title: 'The Great Propeth',
    description: 'What does your future hold?',
    url: 'https://thegreatpropeth.com/',
    siteName: 'The Great Propeth',
    images: [{ url: 'https://thegreatpropeth.com/thegreatpropeth.jpg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Great Propeth',
    description: 'What does your future hold?',
    images: ['https://thegreatpropeth.com/thegreatpropeth.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Jacquard+12&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <MusicPlayer />
      </body>
    </html>
  );
}