"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface RegisterFormProps {
  onToggleMode: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [civility, setCivility] = useState<string>("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [consent, setConsent] = useState(false)

  // Billing address
  const [company, setCompany] = useState("")
  const [country, setCountry] = useState("")
  const [siret, setSiret] = useState("")
  const [vat, setVat] = useState("")
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const { register, isLoading } = useAuth()

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères"
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*\d)/.test(password)) {
      return "Le mot de passe doit contenir au moins une majuscule et un chiffre, ou une minuscule et un chiffre"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!civility || !firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs")
      return
    }

    // Minimal required billing fields (TVA optionnel)
    if (!company || !country || !siret || !address1 || !postalCode || !city || !phone) {
      setError("Veuillez remplir les champs d'adresse de facturation requis")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!consent) {
      setError("Vous devez accepter le traitement de vos informations pour continuer")
      return
    }

    const fullName = `${firstName} ${lastName}`.trim()
    const result = await register(fullName, email, password, {
      civility,
      firstName,
      lastName,
      consent,
      billing: {
        company,
        country,
        siret,
        vat: vat || undefined,
        address1,
        address2: address2 || undefined,
        postalCode,
        city,
        phone,
      },
    })
    if (!result.success) {
      setError(result.error || "Erreur lors de l'inscription")
      if (typeof window !== "undefined") {
        console.error("[RegisterForm] register error", result.error)
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Inscription</CardTitle>
        <CardDescription>Créez votre compte Sogestmatic</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informations personnelles */}
          <div className="space-y-2">
            <Label>Civilité</Label>
            <Select value={civility} onValueChange={setCivility}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monsieur">Monsieur</SelectItem>
                <SelectItem value="madame">Madame</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Au moins 6 caractères avec majuscule et chiffre</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Adresse de facturation */}
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Adresse de facturation</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Société</Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="France"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="123 456 789 00010"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat">TVA intracommunautaire (facultatif)</Label>
                <Input
                  id="vat"
                  type="text"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  placeholder="FRXX999999999"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address1">Adresse 1</Label>
                <Input
                  id="address1"
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Numéro et voie"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Adresse 2</Label>
                <Input
                  id="address2"
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Bâtiment, appartement, etc. (optionnel)"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">CP</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    disabled={isLoading}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Consentement */}
          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
            <Label htmlFor="consent" className="text-sm font-normal">
              En soumettant ce formulaire, j'accepte que les informations saisies soient exploitées dans le cadre de la
              relation commerciale qui peut en découler.{" "}
              <a href="/politiques" target="_blank" className="text-primary hover:underline">
                Consulter nos politiques
              </a>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription...
              </>
            ) : (
              "S'inscrire"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <button onClick={onToggleMode} className="text-primary hover:underline">
              Se connecter
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
