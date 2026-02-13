import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Restauracja - Zamów online",
  description: "Zamów jedzenie online z dostawą lub odbiorem osobistym",
  keywords: ["restauracja", "zamówienia", "dostawa", "jedzenie", "pizza", "burgery"],
  authors: [{ name: "Restauracja" }],
  openGraph: {
    title: "Restauracja - Zamów online",
    description: "Zamów jedzenie online z dostawą lub odbiorem osobistym",
    type: "website",
    locale: "pl_PL",
  },
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restauracja",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Restauracja" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Cart Drawer */}
          <CartDrawer />

          {/* Modern Minimalist Footer */}
          <footer className="bg-muted/30 border-t border-border/50">
            <div className="container mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                      <span className="text-lg">🍕</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground font-[var(--font-plus-jakarta)]">Restauracja</h3>
                      <p className="text-sm text-muted-foreground">Zamów online</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 max-w-md leading-relaxed text-sm">
                    Jesteśmy lokalną restauracją, która serwuje pyszną pizzę, świeże burgery i sałatki. 
                    Dostarczamy z pasją i dbałością o każdy szczegół.
                  </p>
                  <div className="flex space-x-3">
                    <a href="#" className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                      <span className="text-sm">📘</span>
                    </a>
                    <a href="#" className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                      <span className="text-sm">📷</span>
                    </a>
                    <a href="#" className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                      <span className="text-sm">🐦</span>
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-4 text-foreground">Menu</h4>
                  <ul className="space-y-2">
                    <li><Link href="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Pizza</Link></li>
                    <li><Link href="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Burgery</Link></li>
                    <li><Link href="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Sałatki</Link></li>
                    <li><Link href="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Napoje</Link></li>
                    <li><Link href="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Desery</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-4 text-foreground">Kontakt</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2 text-sm text-muted-foreground">
                      <span className="mt-0.5">📍</span>
                      <span>ul. Przykładowa 123<br />00-000 Warszawa</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>📞</span>
                      <span>+48 123 456 789</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>✉️</span>
                      <span>kontakt@restauracja.pl</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>🕒</span>
                      <span>Pon-Nie: 11:00-23:00</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-border/50 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
                <p className="text-muted-foreground text-xs">
                  © 2024 Restauracja. Wszystkie prawa zastrzeżone.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
                    Polityka prywatności
                  </Link>
                  <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
                    Regulamin
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}