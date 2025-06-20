"use client"

import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { RegisterModal } from "@/components/register-modal"
import { ProductCarousel } from "@/components/product-carousel"
import { ProductFilters } from "@/components/product-filters"
import { Pagination } from "@/components/pagination"
import Link from "next/link"
import toast from "react-hot-toast"

interface Product {
  id: string
  name: string
  gallery: string[]
  description: string
  price: string
  hasDiscount: boolean
  discountValue: string
  details: {
    adjective: string
    material: string
  }
}

export interface FiltersChange {
  search: string
  minPrice: string
  maxPrice: string
  hasDiscount: string
  material: string
}

interface ApiResponse {
  products: Product[]
  pagination: {
    currentPage: number
    totalPages: number
    totalProducts: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
  filters: {
    materials: string[]
  }
}

export default function HomePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    hasDiscount: "",
    material: "",
  })
  const { addToCart, cartItems } = useCart()
  const { user, logout, isLoading: authLoading } = useAuth()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "8",
      })

      if (filters.search.trim()) params.append("search", filters.search.trim())
      if (filters.minPrice) params.append("minPrice", filters.minPrice)
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice)
      if (filters.hasDiscount) params.append("hasDiscount", filters.hasDiscount)
      if (filters.material) params.append("material", filters.material)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/find-all?${params}`)
      const apiData = await response.json()
      setData(apiData)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast.error("Erro ao carregar produtos")
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleFiltersChange = (newFilters: FiltersChange) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const addSelectedToCart = async () => {
    if (!user) {
      toast.error("Faça login para adicionar produtos ao carrinho")
      setShowLoginModal(true)
      return
    }

    if (!data) return

    const selectedProductsData = data.products.filter((product) => selectedProducts.includes(product.id))

    try {
      for (const product of selectedProductsData) {
        await addToCart(product)
      }
      toast.success(`${selectedProducts.length} produtos adicionados ao carrinho!`)
      setSelectedProducts([])
    } catch (error) {
      console.log(error)
      toast.error("Erro ao adicionar produtos ao carrinho")
    }
  }

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error("Faça login para adicionar produtos ao carrinho")
      setShowLoginModal(true)
      return
    }

    try {
      await addToCart(product)
      toast.success("Produto adicionado ao carrinho!")
    } catch (error) {
      console.log(error)
      toast.error("Erro ao adicionar produto ao carrinho")
    }
  }

  const formatPrice = (price: string, hasDiscount: boolean, discountValue: string) => {
    const originalPrice = Number.parseFloat(price)
    const discount = hasDiscount ? Number.parseFloat(discountValue) : 0
    const finalPrice = originalPrice * (1 - discount)

    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

    if (hasDiscount) {
      return (
        <div className="space-y-1">
          <div className="text-xl font-bold text-green-600">{formatter.format(finalPrice)}</div>
          <div className="text-sm text-gray-500 line-through">{formatter.format(originalPrice)}</div>
        </div>
      )
    }

    return <div className="text-xl font-bold text-green-600">{formatter.format(originalPrice)}</div>
  }

  const handleLogout = () => {
    logout()
    setSelectedProducts([])
    toast.success("Logout realizado com sucesso!")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">in8store</h1>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Olá, <b>{user.name}</b></span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
                    Login
                  </Button>
                  <Button size="sm" onClick={() => setShowRegisterModal(true)}>
                    Cadastrar
                  </Button>
                </div>
              )}
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartItems.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            materials={data?.filters.materials || []}
            isLoading={loading}
            totalProducts={data?.pagination.totalProducts || 0}
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-lg">Carregando produtos...</p>
            </div>
          </div>
        ) : data?.products.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-4">Tente ajustar os filtros de busca ou limpar todos os filtros</p>
              <Button
                variant="outline"
                onClick={() =>
                  handleFiltersChange({
                    search: "",
                    minPrice: "",
                    maxPrice: "",
                    hasDiscount: "",
                    material: "",
                  })
                }
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.products.map((product) => {
                const isSelected = selectedProducts.includes(product.id)
                return (
                  <Card
                    key={product.id}
                    className={`overflow-hidden hover:shadow-lg transition-all duration-200 group relative ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ paddingTop: '0px', paddingBottom: '0px' }}
                  >
                    <div className="relative">
                      <ProductCarousel images={product.gallery} productName={product.name} />

                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleProductSelect(product.id)}
                          className="bg-white shadow-lg border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </div>

                      {product.hasDiscount && (
                        <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1">
                          -{Math.round(Number.parseFloat(product.discountValue) * 100)}%
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>

                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{product.description}</p>

                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-medium">
                          {product.details.material}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium">
                          {product.details.adjective}
                        </Badge>
                      </div>

                      <div className="pt-2 h-[60px] flex items-center">
                        {formatPrice(product.price, product.hasDiscount, product.discountValue)}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5"
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Adicionar ao Carrinho
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            )}
          </>
        )}
      </main>

      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-black text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {selectedProducts.length}
              </div>
              <span className="font-medium">
                produto{selectedProducts.length > 1 ? "s" : ""} selecionado{selectedProducts.length > 1 ? "s" : ""}
              </span>
            </div>
            <Button
              onClick={addSelectedToCart}
              size="sm"
              className="bg-white text-black hover:bg-gray-100 font-medium px-4 py-2"
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </div>
  )
}
