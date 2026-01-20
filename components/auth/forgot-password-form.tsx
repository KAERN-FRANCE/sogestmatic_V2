"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email) {
      setError("Veuillez saisir votre email")
      setIsLoading(false)
      return
    }

    const result = await resetPassword(email)
    setIsLoading(false)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Erreur lors de la réinitialisation")
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email envoyé</CardTitle>
          <CardDescription>
            Si un compte existe avec cet email, vous recevrez un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>Saisissez votre email pour recevoir un lien de réinitialisation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Button onClick={onBack} variant="ghost" className="text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
          <div>
            <a href="/politiques" target="_blank" className="text-xs text-muted-foreground hover:text-primary">
              Politiques et conditions d'utilisation
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
