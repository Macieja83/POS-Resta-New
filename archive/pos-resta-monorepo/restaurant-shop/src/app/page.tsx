import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <section className="relative gradient-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 text-6xl opacity-5">🍕</div>
          <div className="absolute top-40 right-20 text-4xl opacity-5">🍔</div>
          <div className="absolute bottom-20 left-1/4 text-5xl opacity-5">🥗</div>
          <div className="absolute bottom-40 right-1/3 text-3xl opacity-5">🍰</div>
        </div>
        
        <div className="relative container mx-auto px-6 py-20 text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight font-[var(--font-plus-jakarta)]">
            Witamy w naszej
            <span className="block text-yellow-200">restauracji!</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
            Zamów pyszną pizzę, świeże burgery i sałatki z dostawą do domu lub odbiorem osobistym. 
            Tylko najświeższe składniki i autorskie przepisy!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/menu"
              className="bg-background text-foreground px-8 py-3 rounded-lg font-semibold text-base hover:bg-muted transition-all duration-200 transform hover:scale-105 shadow-soft"
            >
              🍽️ Zobacz menu
            </Link>
            <Link
              href="/checkout"
              className="border-2 border-background/20 text-background px-8 py-3 rounded-lg font-semibold text-base hover:bg-background hover:text-foreground transition-all duration-200 transform hover:scale-105"
            >
              🚀 Zamów teraz
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-[var(--font-plus-jakarta)]">
              Dlaczego warto wybrać nas?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Jesteśmy dumni z naszej jakości, szybkości i dbałości o szczegóły
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group animate-slide-up">
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-[var(--font-plus-jakarta)]">Szybka dostawa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Dostarczamy zamówienia w ciągu 30-45 minut. Nasze kurierzy są najszybsi w mieście!
              </p>
            </div>
            
            <div className="text-center group animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <span className="text-2xl">🍅</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-[var(--font-plus-jakarta)]">Świeże składniki</h3>
              <p className="text-muted-foreground leading-relaxed">
                Używamy tylko najświeższych i najwyższej jakości składników z lokalnych dostawców.
              </p>
            </div>
            
            <div className="text-center group animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-[var(--font-plus-jakarta)]">Bezpieczne płatności</h3>
              <p className="text-muted-foreground leading-relaxed">
                Płatność online lub gotówką przy odbiorze. Twoje dane są w pełni bezpieczne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Items */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-[var(--font-plus-jakarta)]">
              Nasze bestsellery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sprawdź, co nasi klienci lubią najbardziej
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-scale-in">
              <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🍕</span>
                <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-semibold">
                  BESTSELLER
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2 font-[var(--font-plus-jakarta)]">Pizza Margherita</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                  Klasyczna pizza z pomidorami, mozzarellą i bazylią. Prosto z pieca do Twojego domu!
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-primary">25,99 zł</span>
                  <div className="flex items-center text-yellow-500">
                    <span className="text-xs text-muted-foreground mr-1">(4.9)</span>
                    <span className="text-sm">⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <Link
                  href="/menu"
                  className="w-full gradient-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold text-sm hover:shadow-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  🍽️ Zamów teraz
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-soft overflow-hidden group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🍔</span>
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-semibold">
                  POPULARNE
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2 font-[var(--font-plus-jakarta)]">Classic Burger</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                  Klasyczny burger z wołowiną, sałatą, pomidorem i cebulą. Soczysty i pyszny!
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-primary">24,99 zł</span>
                  <div className="flex items-center text-yellow-500">
                    <span className="text-xs text-muted-foreground mr-1">(4.8)</span>
                    <span className="text-sm">⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <Link
                  href="/menu"
                  className="w-full gradient-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold text-sm hover:shadow-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  🍽️ Zamów teraz
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-soft overflow-hidden group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🥗</span>
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                  ZDROWE
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2 font-[var(--font-plus-jakarta)]">Sałatka Cezar</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                  Sałatka z rukolą, parmezanem, grzankami i sosem cezar. Świeża i chrupiąca!
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-primary">18,99 zł</span>
                  <div className="flex items-center text-yellow-500">
                    <span className="text-xs text-muted-foreground mr-1">(4.7)</span>
                    <span className="text-sm">⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <Link
                  href="/menu"
                  className="w-full gradient-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold text-sm hover:shadow-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  🍽️ Zamów teraz
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold mb-2 font-[var(--font-plus-jakarta)]">5000+</div>
              <div className="text-base opacity-90">Zadowolonych klientów</div>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="text-4xl font-bold mb-2 font-[var(--font-plus-jakarta)]">15k+</div>
              <div className="text-base opacity-90">Dostarczonych zamówień</div>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="text-4xl font-bold mb-2 font-[var(--font-plus-jakarta)]">4.9</div>
              <div className="text-base opacity-90">Średnia ocena</div>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="text-4xl font-bold mb-2 font-[var(--font-plus-jakarta)]">30min</div>
              <div className="text-base opacity-90">Średni czas dostawy</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-[var(--font-plus-jakarta)] animate-fade-in">
            Gotowy na pyszne jedzenie?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Dołącz do tysięcy zadowolonych klientów i zamów już dziś!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/menu"
              className="gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-base hover:shadow-medium transition-all duration-200 transform hover:scale-105"
            >
              🍽️ Zobacz pełne menu
            </Link>
            <Link
              href="/checkout"
              className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold text-base hover:bg-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-105"
            >
              🚀 Zamów teraz
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}