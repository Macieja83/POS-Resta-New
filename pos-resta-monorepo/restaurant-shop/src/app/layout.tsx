import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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
          {/* Modern Minimalist Header */}
          <header className="glass sticky top-0 z-50 border-b border-border/50">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-soft">
                    <span className="text-lg">🍕</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground font-[var(--font-plus-jakarta)]">Restauracja</h1>
                    <p className="text-xs text-muted-foreground">Zamów online</p>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                  <Link 
                    href="/" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
                  >
                    Strona główna
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                  <Link 
                    href="/menu" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
                  >
                    Menu
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                  <Link 
                    href="/checkout" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
                  >
                    Zamówienie
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </Link>
                </nav>

                {/* Cart & Actions */}
                <div className="flex items-center space-x-3">
                  <button className="relative p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/50">
                    <span className="text-lg">🛒</span>
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                      0
                    </span>
                  </button>
                  
                  <Link
                    href="/checkout"
                    className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:shadow-medium transition-all duration-200 transform hover:scale-105"
                  >
                    Zamów teraz
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <span className="text-lg">☰</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

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