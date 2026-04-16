import Image from 'next/image';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Providers from '../../components/Providers';
import Header from '../../components/layout/Header';
import AuthModal from '../../components/auth/AuthModal';
import ContactModal from '../../components/contact/ContactModal';
import FooterContactButton from '../../components/contact/FooterContactButton';

const locales = ['en', 'ru', 'uk'];

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />

        <div className="relative z-10 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-white/[0.06] py-5">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 items-center gap-3">
              {/* Left: TavionTech logo */}
              <div className="flex items-center">
                <Image
                  src="/images/taviontech-logo.png"
                  alt="TavionTech"
                  width={110}
                  height={28}
                  className="h-6 w-auto"
                />
              </div>
              {/* Center: copyright */}
              <p className="text-sm text-slate-600 text-center">
                © 2026 TrackerHub · Built with ♥ by TavionTech
              </p>
              {/* Right: contact button */}
              <div className="flex justify-end">
                <FooterContactButton />
              </div>
            </div>
          </footer>
        </div>

        <AuthModal />
        <ContactModal />
      </Providers>
    </NextIntlClientProvider>
  );
}
