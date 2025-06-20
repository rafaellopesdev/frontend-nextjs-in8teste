"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FiltersChange } from "@/app/page"

interface ProductFiltersProps {
  onFiltersChange: (filters: FiltersChange) => void
  materials: string[]
  isLoading: boolean
  totalProducts: number
}

export function ProductFilters({ onFiltersChange, materials, isLoading, totalProducts }: ProductFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    hasDiscount: "",
    material: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const debounceSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (value: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          handleFilterChange("search", value)
        }, 500)
      }
    })(),
    [],
  )

  useEffect(() => {
    debounceSearch(searchValue)
  }, [searchValue, debounceSearch])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      minPrice: "",
      maxPrice: "",
      hasDiscount: "",
      material: "",
    }
    setFilters(clearedFilters)
    setSearchValue("")
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "") || searchValue !== ""
  const activeFiltersCount = Object.values(filters).filter((value) => value !== "").length + (searchValue ? 1 : 0)

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar produto"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {totalProducts} produto{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} ativo
              {activeFiltersCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          )}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Faixa de Preço (R$)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Preço mínimo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Preço máximo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Material</Label>
              <Select
                value={filters.material}
                onValueChange={(value) => handleFilterChange("material", value === "all" ? "" : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os materiais</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Promoção</Label>
              <Select
                value={filters.hasDiscount}
                onValueChange={(value) => handleFilterChange("hasDiscount", value === "all" ? "" : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por promoção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="true">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        PROMOÇÃO
                      </Badge>
                      Apenas em promoção
                    </div>
                  </SelectItem>
                  <SelectItem value="false">Preço normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
              <Button size="sm" onClick={() => setShowFilters(false)} className="flex-1">
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
