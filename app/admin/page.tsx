"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useMemo, useState } from "react"
import { Plus, Check, X, Users, Database, BarChart3, Upload, Link, Trash2 } from "lucide-react"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where, limit } from "firebase/firestore"
import type { User as AppUser } from "@/lib/auth"

type BillingAddress = {
  company?: string
  country?: string
  siret?: string
  vat?: string
  address1?: string
  address2?: string
  postalCode?: string
  city?: string
  phone?: string
}

type AdminUser = AppUser & {
  premiumUntil?: string
  civility?: string
  firstName?: string
  lastName?: string
  consent?: boolean
  billing?: BillingAddress
}

export default function AdminPage() {
  const { user } = useAuth()
  const [newSource, setNewSource] = useState({ title: "", url: "", category: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingSources] = useState([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [roleEdits, setRoleEdits] = useState<Record<string, AdminUser["role"]>>({})
  const [durationEdits, setDurationEdits] = useState<Record<string, string>>({})
  const [userStats, setUserStats] = useState<Record<string, { totalQuestions?: number; totalTokens?: number; lastQuestionAt?: string }>>({})
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; userId: string; createdAt: string; message: string; responsePreview?: string; approxTokens?: number }>>([])
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState<AdminUser["role"] | "tous">("tous")

  // Firebase init (client)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!getApps().length) {
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }
    const db = getFirestore()
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(usersQuery, (snap) => {
      const list: AdminUser[] = []
      snap.forEach((doc) => {
        const data = doc.data() as any
        list.push({
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          role: (data.role as AppUser["role"]) || "gratuit",
          createdAt: data.createdAt || new Date().toISOString(),
          premiumUntil: data.premiumUntil,
          civility: data.civility,
          firstName: data.firstName,
          lastName: data.lastName,
          consent: data.consent,
          billing: data.billing,
        })
      })
      setAllUsers(list)
    })
    // user_stats (one doc per user)
    const statsUnsub = onSnapshot(collection(db, "user_stats"), (snap) => {
      const map: Record<string, { totalQuestions?: number; totalTokens?: number; lastQuestionAt?: string }> = {}
      snap.forEach((d) => {
        const s = d.data() as any
        map[d.id] = {
          totalQuestions: s.totalQuestions || 0,
          totalTokens: s.totalTokens || 0,
          lastQuestionAt: s.lastQuestionAt || undefined,
        }
      })
      setUserStats(map)
    })
    // recent logs (latest 50)
    const logsQuery = query(collection(db, "user_usage_logs"), orderBy("createdAt", "desc"), limit(50))
    const logsUnsub = onSnapshot(logsQuery, (snap) => {
      const logs: Array<{ id: string; userId: string; createdAt: string; message: string; responsePreview?: string; approxTokens?: number }> = []
      snap.forEach((d) => {
        const v = d.data() as any
        logs.push({
          id: d.id,
          userId: v.userId,
          createdAt: v.createdAt,
          message: v.message,
          responsePreview: v.responsePreview,
          approxTokens: v.approxTokens,
        })
      })
      setRecentLogs(logs)
    })
    return () => { unsub(); statsUnsub(); logsUnsub() }
  }, [])

  const handleRoleChange = (userId: string, role: AdminUser["role"]) => {
    setRoleEdits((prev) => ({ ...prev, [userId]: role }))
  }

  const handleDurationChange = (userId: string, duration: string) => {
    setDurationEdits((prev) => ({ ...prev, [userId]: duration }))
  }

  const computePremiumUntil = (duration: string): string | null => {
    const now = new Date()
    switch (duration) {
      case "1-month":
        now.setMonth(now.getMonth() + 1)
        return now.toISOString()
      case "3-months":
        now.setMonth(now.getMonth() + 3)
        return now.toISOString()
      case "6-months":
        now.setMonth(now.getMonth() + 6)
        return now.toISOString()
      case "12-months":
        now.setMonth(now.getMonth() + 12)
        return now.toISOString()
      case "unlimited":
        return "2099-12-31T00:00:00.000Z"
      default:
        return null
    }
  }

  const handleSaveUser = async (userId: string) => {
    const db = getFirestore()
    const ref = doc(db, "users", userId)
    const role = roleEdits[userId]
    if (!role) return
    const update: any = { role }
    if (role === "premium") {
      const duration = durationEdits[userId] || "12-months"
      update.premiumUntil = computePremiumUntil(duration)
    } else {
      update.premiumUntil = null
    }
    await updateDoc(ref, update)
  }

  const csvEscape = (val: unknown): string => {
    const s = val === undefined || val === null ? "" : String(val)
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const handleDownloadPremiumCsv = () => {
    const header = [
      "id",
      "email",
      "name",
      "role",
      "createdAt",
      "premiumUntil",
      "civility",
      "firstName",
      "lastName",
      "consent",
      "company",
      "country",
      "siret",
      "vat",
      "address1",
      "address2",
      "postalCode",
      "city",
      "phone",
    ]

    const rows = allUsers
      .filter((u) => u.role === "premium")
      .map((u) => [
        u.id,
        u.email,
        u.name,
        u.role,
        u.createdAt,
        u.premiumUntil || "",
        u.civility || "",
        u.firstName || "",
        u.lastName || "",
        u.consent === true ? "true" : u.consent === false ? "false" : "",
        u.billing?.company || "",
        u.billing?.country || "",
        u.billing?.siret || "",
        u.billing?.vat || "",
        u.billing?.address1 || "",
        u.billing?.address2 || "",
        u.billing?.postalCode || "",
        u.billing?.city || "",
        u.billing?.phone || "",
      ])

    const csv = [header, ...rows]
      .map((cols) => cols.map(csvEscape).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `utilisateurs-premium-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const total = allUsers.length
    const premium = allUsers.filter((u) => u.role === "premium").length
    const admins = allUsers.filter((u) => u.role === "admin").length
    const last7 = allUsers.filter((u) => {
      const created = new Date(u.createdAt).getTime()
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return created >= sevenDaysAgo
    }).length
    return { total, premium, admins, last7 }
  }, [allUsers])

  const handleAddSource = () => {
    if (newSource.title && (newSource.url || selectedFile)) {
      console.log("Adding source:", newSource, selectedFile)
      setNewSource({ title: "", url: "", category: "" })
      setSelectedFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    }
  }

  const handleApproveSource = (id: number) => {
    console.log("Approving source:", id)
  }

  const handleRejectSource = (id: number) => {
    console.log("Rejecting source:", id)
  }

  const handleApproveUser = (id: number, duration: string) => {
    console.log("Approving user:", id, "Duration:", duration)
  }

  const handleRejectUser = (id: number) => {
    console.log("Rejecting user:", id)
  }

  const handleRemoveSubscription = (id: number) => {
    console.log("Removing subscription for user:", id)
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Panneau d'Administration</h1>
            <p className="text-gray-600 mt-2">Gérez les sources IA, les utilisateurs et les statistiques du site</p>
          </div>

          <Tabs defaultValue="sources" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sources" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sources IA
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistiques
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Usage IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-6">
              {/* Add New Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Ajouter une nouvelle source
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des PDFs et/ou des URLs pour enrichir les réponses de l'IA avec des sources complètes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Titre de la source"
                      value={newSource.title}
                      onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                    />
                    <Input
                      placeholder="Catégorie (ex: réglementation, indemnités)"
                      value={newSource.category}
                      onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de référence (optionnel)
                      </label>
                      <Input
                        placeholder="URL de la source (ex: https://transport.gouv.fr/...)"
                        value={newSource.url}
                        onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fichier PDF (optionnel)</label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {selectedFile && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            {selectedFile.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p>
                      <strong>Conseil :</strong> Ajoutez à la fois une URL et un PDF pour permettre à l'IA de mieux
                      citer ses sources. L'URL servira de référence publique et le PDF fournira le contenu détaillé.
                    </p>
                  </div>

                  <Button onClick={handleAddSource} className="bg-green-accent hover:bg-green-accent-dark">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la source
                  </Button>
                </CardContent>
              </Card>

              {/* Pending Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Sources en attente de validation</CardTitle>
                  <CardDescription>Approuvez ou rejetez les sources soumises par les utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingSources.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Aucune source en attente</p>
                        <p className="text-sm">Les sources soumises par les utilisateurs apparaîtront ici</p>
                      </div>
                    ) : (
                      pendingSources.map((source) => (
                        <div key={source.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {source.type === "pdf" ? <Upload className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                                {source.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {source.type === "pdf" ? "Fichier: " : "URL: "}
                                {source.url}
                              </p>
                              <p className="text-sm text-gray-600">
                                Soumis par {source.submittedBy} le {source.date}
                              </p>
                            </div>
                            <Badge variant="outline">En attente</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveSource(source.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectSource(source.id)}>
                              <X className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              {/* Liste des utilisateurs (données Firestore) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>Utilisateurs</CardTitle>
                      <CardDescription>Liste issue de Firestore (`users`)</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Rechercher par nom ou email"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-[220px]"
                      />
                      <Select value={userRoleFilter} onValueChange={(v) => setUserRoleFilter(v as any)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filtrer par rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Tous</SelectItem>
                          <SelectItem value="gratuit">Gratuit</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleDownloadPremiumCsv} className="bg-primary text-white hover:bg-primary/90">
                        Télécharger CSV Premium
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allUsers.length === 0 ? (
                      <div className="text-sm text-gray-500">Aucun utilisateur</div>
                    ) : (
                      allUsers
                        .filter((u) => {
                          const q = userSearch.trim().toLowerCase()
                          const matchesSearch = !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
                          const matchesRole = userRoleFilter === "tous" || u.role === userRoleFilter
                          return matchesSearch && matchesRole
                        })
                        .map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg gap-4">
                          <div className="min-w-0">
                            <div className="font-medium">{u.name || u.email}</div>
                            <div className="text-sm text-gray-600">{u.email}</div>
                            <div className="text-xs text-gray-500">Créé le {new Date(u.createdAt).toLocaleDateString("fr-FR")}</div>
                            {u.premiumUntil && (
                              <div className="text-xs text-purple-700 mt-1">
                                Expire le {new Date(u.premiumUntil).toLocaleDateString("fr-FR")}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={roleEdits[u.id] || u.role} onValueChange={(v) => handleRoleChange(u.id, v as AdminUser["role"]) }>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gratuit">Gratuit</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            {(roleEdits[u.id] || u.role) === "premium" && (
                              <Select value={durationEdits[u.id]} onValueChange={(v) => handleDurationChange(u.id, v)}>
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Durée" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-month">1 mois</SelectItem>
                              <SelectItem value="3-months">3 mois</SelectItem>
                              <SelectItem value="6-months">6 mois</SelectItem>
                              <SelectItem value="12-months">12 mois</SelectItem>
                              <SelectItem value="unlimited">Illimité</SelectItem>
                            </SelectContent>
                          </Select>
                            )}

                            <Button size="sm" onClick={() => handleSaveUser(u.id)} className="bg-green-600 hover:bg-green-700">
                              Enregistrer
                          </Button>
                          </div>
                        </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{stats.premium}</p>
                        <p className="text-sm text-gray-600">Abonnés premium</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.admins}</p>
                        <p className="text-sm text-gray-600">Administrateurs</p>
                      </div>
                      <Database className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{stats.last7}</p>
                        <p className="text-sm text-gray-600">Nouveaux (7 jours)</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage global (IA)</CardTitle>
                  <CardDescription>Métriques cumulées à partir de la collecte client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="text-sm text-gray-600">Questions totales</div>
                      <div className="text-2xl font-semibold">{
                        Object.values(userStats).reduce((acc, s) => acc + (s.totalQuestions || 0), 0)
                      }</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="text-sm text-gray-600">Tokens estimés</div>
                      <div className="text-2xl font-semibold">{
                        Object.values(userStats).reduce((acc, s) => acc + (s.totalTokens || 0), 0)
                      }</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="text-sm text-gray-600">Utilisateurs actifs</div>
                      <div className="text-2xl font-semibold">{
                        Object.values(userStats).filter((s) => !!s.lastQuestionAt).length
                      }</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage par utilisateur</CardTitle>
                  <CardDescription>Questions, tokens, dernière activité</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allUsers.length === 0 ? (
                      <div className="text-sm text-gray-500">Aucun utilisateur</div>
                    ) : (
                      allUsers.map((u) => {
                        const s = userStats[u.id] || {}
                        return (
                          <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg gap-4">
                            <div className="min-w-0">
                              <div className="font-medium">{u.name || u.email}</div>
                              <div className="text-sm text-gray-600">{u.email}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">Questions</div>
                                <div className="font-semibold">{s.totalQuestions || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Tokens</div>
                                <div className="font-semibold">{s.totalTokens || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Dernière question</div>
                                <div className="font-semibold">{s.lastQuestionAt ? new Date(s.lastQuestionAt).toLocaleString("fr-FR") : "—"}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactions récentes</CardTitle>
                  <CardDescription>50 dernières requêtes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Utilisateur</th>
                          <th className="py-2 pr-4">Message</th>
                          <th className="py-2 pr-4">Réponse (aperçu)</th>
                          <th className="py-2 pr-4">Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLogs.map((l) => {
                          const u = allUsers.find((x) => x.id === l.userId)
                          return (
                            <tr key={l.id} className="border-b align-top">
                              <td className="py-2 pr-4 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("fr-FR")}</td>
                              <td className="py-2 pr-4 whitespace-nowrap">{u ? (u.name || u.email) : l.userId}</td>
                              <td className="py-2 pr-4 max-w-[320px] truncate" title={l.message}>{l.message}</td>
                              <td className="py-2 pr-4 max-w-[320px] truncate" title={l.responsePreview}>{l.responsePreview || ""}</td>
                              <td className="py-2 pr-4 whitespace-nowrap text-right">{l.approxTokens || 0}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
