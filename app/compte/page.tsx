"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { ConversationHistory } from "@/components/account/conversation-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, User, Shield, LogOut, Edit, Key, Trash2, Save, X, BarChart3, Calendar, FileText } from "lucide-react"
import { tokenService } from "@/lib/token-service"

type AuthMode = "login" | "register" | "forgot-password"

interface TokenStats {
  currentUsage: number
  limit: number
  remaining: number
  percentageUsed: number
  resetDate: string
}

export default function ComptePage() {
  const { user, isLoading, logout } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [isLoadingTokenStats, setIsLoadingTokenStats] = useState(false)
  
  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || ""
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Charger les statistiques de tokens
  useEffect(() => {
    if (user) {
      loadTokenStats()
    }
  }, [user])

  const loadTokenStats = async () => {
    if (!user) return
    
    setIsLoadingTokenStats(true)
    try {
      const stats = await tokenService.getTokenStats(user.id, user.role)
      setTokenStats(stats)
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques de tokens:", error)
    } finally {
      setIsLoadingTokenStats(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12">
        <div className="w-full max-w-md px-4">
          {authMode === "login" && (
            <LoginForm
              onToggleMode={() => setAuthMode("register")}
              onForgotPassword={() => setAuthMode("forgot-password")}
            />
          )}
          {authMode === "register" && <RegisterForm onToggleMode={() => setAuthMode("login")} />}
          {authMode === "forgot-password" && <ForgotPasswordForm onBack={() => setAuthMode("login")} />}
        </div>
      </div>
    )
  }

  const handleUpdateProfile = async () => {
    setIsEditingProfile(true)
    try {
      // Ici vous ajouteriez la logique pour mettre à jour le profil
      // await updateUserProfile(profileData)
      console.log("Profil mis à jour:", profileData)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
    } finally {
      setIsEditingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }
    
    setIsChangingPassword(true)
    try {
      // Ici vous ajouteriez la logique pour changer le mot de passe
      // await changePassword(passwordData.currentPassword, passwordData.newPassword)
      console.log("Mot de passe changé")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      // Ici vous ajouteriez la logique pour supprimer le compte
      // await deleteAccount()
      console.log("Compte supprimé")
      logout()
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Mon Compte</CardTitle>
                    <CardDescription>Gérez vos informations et préférences</CardDescription>
                  </div>
                </div>
                <Button onClick={logout} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Informations personnelles</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier mes informations</DialogTitle>
                          <DialogDescription>
                            Mettez à jour vos informations personnelles
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                              id="name"
                              value={profileData.name}
                              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              placeholder="Votre nom complet"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                              placeholder="votre@email.com"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setProfileData({ name: user.name, email: user.email })}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                          <Button onClick={handleUpdateProfile} disabled={isEditingProfile}>
                            {isEditingProfile ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Enregistrer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Nom :</span>
                      <div className="font-medium">{user.name}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Email :</span>
                      <div className="font-medium">{user.email}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Catégorie :</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? (
                            <>
                              <Shield className="mr-1 h-3 w-3" />
                              Administrateur
                            </>
                          ) : user.role === "premium" ? (
                            "Premium"
                          ) : (
                            "Gratuit"
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Compte créé</h3>
                  <div className="text-muted-foreground mb-6">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  
                  {/* Actions du compte */}
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/politiques" target="_blank">
                        <FileText className="mr-2 h-4 w-4" />
                        Politiques et conditions
                      </a>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Key className="mr-2 h-4 w-4" />
                          Changer le mot de passe
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Changer le mot de passe</DialogTitle>
                          <DialogDescription>
                            Entrez votre mot de passe actuel et votre nouveau mot de passe
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              placeholder="Votre mot de passe actuel"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              placeholder="Votre nouveau mot de passe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              placeholder="Confirmez votre nouveau mot de passe"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                          <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                            {isChangingPassword ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Key className="mr-2 h-4 w-4" />
                            )}
                            Changer le mot de passe
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive border-muted-foreground/20 hover:border-destructive/50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer mon compte
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte
                            et toutes vos données associées de nos serveurs.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeletingAccount ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Supprimer définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Usage Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Utilisation des Tokens IA</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadTokenStats} disabled={isLoadingTokenStats}>
                  {isLoadingTokenStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Actualiser"
                  )}
                </Button>
              </div>
              <CardDescription>
                Suivi de votre consommation de tokens pour l'assistant IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTokenStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tokenStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Utilisation ce mois-ci</span>
                    <span className="text-sm text-muted-foreground">
                      {tokenStats.currentUsage.toLocaleString()} / {tokenStats.limit === Infinity ? "∞" : tokenStats.limit.toLocaleString()}
                    </span>
                  </div>
                  
                  {tokenStats.limit !== Infinity && (
                    <Progress value={tokenStats.percentageUsed} className="h-2" />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tokens restants :</span>
                      <div className="font-medium">
                        {tokenStats.limit === Infinity ? "∞" : tokenStats.remaining.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Réinitialisation :</span>
                      <div className="font-medium">
                        {new Date(tokenStats.resetDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {user.role === "gratuit" && tokenStats.percentageUsed > 80 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-800">
                          Vous approchez de votre limite de tokens. Passez à Premium pour plus de tokens.
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <a href="/compte">Passer Premium</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Impossible de charger les statistiques de tokens
                </div>
              )}
            </CardContent>
          </Card>

          <ConversationHistory />
        </div>
      </div>
    </div>
  )
}
