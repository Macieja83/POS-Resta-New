import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 font-[var(--font-plus-jakarta)]">
              Kontakt
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Skontaktuj się z nami w sprawie zamówień, rezerwacji lub pytań
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="glass shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Adres</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">Restauracja</p>
                    <p className="text-muted-foreground">
                      ul. Przykładowa 123<br />
                      00-000 Warszawa
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Telefon</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">+48 123 456 789</p>
                    <p className="text-muted-foreground text-sm">
                      Dostępny codziennie 11:00-23:00
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">kontakt@restauracja.pl</p>
                    <p className="text-muted-foreground text-sm">
                      Odpowiadamy w ciągu 24h
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Godziny otwarcia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Poniedziałek - Czwartek:</span>
                      <span className="text-foreground font-medium">11:00 - 22:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Piątek - Sobota:</span>
                      <span className="text-foreground font-medium">11:00 - 23:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Niedziela:</span>
                      <span className="text-foreground font-medium">12:00 - 21:00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="glass shadow-soft">
                <CardHeader>
                  <CardTitle>Wyślij wiadomość</CardTitle>
                  <CardDescription>
                    Masz pytania? Napisz do nas!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          Imię
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Nazwisko
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-1">
                        Temat
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1">
                        Wiadomość
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Wyślij wiadomość
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="glass shadow-soft mt-6">
                <CardHeader>
                  <CardTitle>Śledź nas</CardTitle>
                  <CardDescription>
                    Bądź na bieżąco z naszymi nowościami
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button variant="outline" size="icon" asChild>
                      <a href="#" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Facebook className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href="#" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href="#" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Twitter className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Map Placeholder */}
          <Card className="glass shadow-soft mt-8">
            <CardHeader>
              <CardTitle>Lokalizacja</CardTitle>
              <CardDescription>
                Znajdź nas na mapie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Mapa będzie dostępna wkrótce</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



