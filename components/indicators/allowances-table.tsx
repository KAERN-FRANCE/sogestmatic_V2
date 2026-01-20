"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Calendar, FileText } from "lucide-react"

type AllowanceItem = {
  id: string
  category: string
  type: string
  amount: string
  conditions: string
  source: string
  lastUpdate: string
  region?: string
}

export function AllowancesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [items, setItems] = useState<AllowanceItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sogestmatic_allowances')
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return []
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/indicators/allowances')
        const json = await res.json()
        if (json?.ok && Array.isArray(json.data)) {
          setItems(json.data as AllowanceItem[])
          try { localStorage.setItem('sogestmatic_allowances', JSON.stringify(json.data)) } catch {}
        }
      } catch {}
    })()
  }, [])

  const visibleItems = useMemo(() => {
    return items.filter((it) => {
      const cat = (it.category || '').toLowerCase()
      const type = (it.type || '').toLowerCase()
      const cond = (it.conditions || '').toLowerCase()
      const amt = (it.amount || '').toLowerCase()

      const isKilometric = cat === 'kilométrique' || /kilom|\bkm\b/i.test(type) || /\bkm\b/i.test(amt)
      const isRegional = cat === 'régional' || /région|régional|régionaux/i.test(cat) || /région/i.test(type)
      const isSanitary = /sanitaire/i.test(type) || /sanitaire/i.test(cond)

      return !isKilometric && !isRegional && !isSanitary
    })
  }, [items])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(visibleItems.map((item) => item.category)))
    return cats.sort()
  }, [visibleItems])

  const filteredData = useMemo(() => {
    return visibleItems.filter((item) => {
      const matchesSearch =
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.conditions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [visibleItems, searchTerm, categoryFilter])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Repas: "bg-blue-100 text-blue-800",
      Découcher: "bg-green-100 text-green-800",
      "Grand déplacement": "bg-purple-100 text-purple-800",
      Kilométrique: "bg-orange-100 text-orange-800",
      "Transport spécialisé": "bg-red-100 text-red-800",
      Régional: "bg-yellow-100 text-yellow-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Grille officielle des indemnités</CardTitle>
            <CardDescription>
              Barèmes officiels pour le transport routier - {filteredData.length} indemnité
              {filteredData.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Données officielles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une indemnité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type d'indemnité</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Conditions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="font-medium">{item.type}</div>
                      <Badge variant="secondary" className={`text-xs ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </Badge>
                      {item.region && (
                        <Badge variant="outline" className="text-xs">
                          {item.region}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-primary">{item.amount}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs">{item.conditions}</div>
                  </TableCell>
                  {/* MAJ retirée */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune indemnité trouvée pour "{searchTerm}"</p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
              }}
              className="mt-2"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
