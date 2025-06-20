"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface State {
  code: string
  name: string
}

const PRE_LOADED_STATES: State[] = [
  { code: "SP", name: "São Paulo" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "MG", name: "Minas Gerais" },
];

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotal } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [states, setStates] = useState<State[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [orderData, setOrderData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    zipcode: "",
    city: "",
    state: "",
    observation: "",
  })

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
    return null
  }

  const getToken = () => {
    return getCookie("auth-token")
  }

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true)
        const response = await fetch("/api/states")
        const data = await response.json()

        if (data.success) {
          setStates(data.states)
        } else {
          console.error("Erro ao carregar estados:", data.message)
          toast.error("Erro ao carregar lista de estados")
          setStates(PRE_LOADED_STATES)
        }
      } catch (error) {
        console.error("Erro na requisição de estados:", error)
        toast.error("Erro ao carregar estados")
        setStates(PRE_LOADED_STATES)
      } finally {
        setLoadingStates(false)
      }
    }

    fetchStates()
  }, [])

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.parseFloat(price))
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "zipcode") {
      const numericValue = value.replace(/\D/g, "")

      if (numericValue.length <= 5) {
        value = numericValue
      } else {
        value = `${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`
      }
    }

    setOrderData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitOrder = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    const requiredFields = ["name", "email", "phone", "street", "number", "neighborhood", "zipcode", "city", "state"]
    const missingFields = requiredFields.filter((field) => !orderData[field as keyof typeof orderData])

    if (missingFields.length > 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    const cepRegex = /^\d{5}-\d{3}$/
    if (!cepRegex.test(orderData.zipcode)) {
      toast.error("CEP inválido. Use o formato 00000-000")
      return
    }

    setLoading(true)
    try {
      const selectedState = states.find((state) => state.code === orderData.state)
      const stateName = selectedState ? selectedState.name : orderData.state

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          productsIds: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          phone: orderData.phone,
          street: orderData.street,
          number: orderData.number,
          neighborhood: orderData.neighborhood,
          zipCode: orderData.zipcode,
          city: orderData.city,
          state: orderData.state,
          stateName: stateName,
          observation: orderData.observation,
          total: getTotal(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Pedido realizado com sucesso!")
        clearCart()

        router.push(`/order-success?orderId=${data.orderId}`)
      } else {
        toast.error("Erro ao realizar pedido. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      toast.error("Erro ao realizar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h2>
          <p className="text-gray-600 mb-6">Adicione alguns produtos para continuar</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">Carrinho de Compras</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Itens do Carrinho ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="hidden sm:flex items-center space-x-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={item.gallery[0] || "/placeholder.svg?height=80&width=80"}
                            alt={item.name}
                            fill
                            className="rounded-md object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          <p className="font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="sm:hidden space-y-4">
                        <div className="flex space-x-3">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={item.gallery[0] || "/placeholder.svg?height=64&width=64"}
                              alt={item.name}
                              fill
                              className="rounded-md object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                            <p className="font-bold text-primary mt-2">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border space-y-3">
                          <div className="flex items-center space-x-3 justify-center">
                            <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-4"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              <span className="text-xs">Remover Item</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2" htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={orderData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label className="mb-2" htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orderData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label className="mb-2" htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={orderData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="mb-2" htmlFor="street">Rua/Avenida *</Label>
                    <Input
                      id="street"
                      value={orderData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      placeholder="Nome da rua ou avenida"
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={orderData.number}
                      onChange={(e) => handleInputChange("number", e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={orderData.neighborhood}
                      onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="zipcode">CEP *</Label>
                    <Input
                      id="zipcode"
                      value={orderData.zipcode}
                      onChange={(e) => handleInputChange("zipcode", e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={orderData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="state">Estado *</Label>
                    <Select
                      value={orderData.state}
                      onValueChange={(value) => handleInputChange("state", value)}
                      disabled={loadingStates}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione o estado"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStates ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Carregando estados...
                            </div>
                          </SelectItem>
                        ) : (
                          states.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name} ({state.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2" htmlFor="observation">Observações</Label>
                  <Textarea
                    id="observation"
                    value={orderData.observation}
                    onChange={(e) => handleInputChange("observation", e.target.value)}
                    placeholder="Observações sobre o pedido (opcional)"
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(getTotal().toString())}</span>
                  </div>
                </div>

                <Button onClick={handleSubmitOrder} disabled={loading || loadingStates} className="w-full" size="lg">
                  {loading ? "Processando..." : "Finalizar Pedido"}
                </Button>

                {!user && (
                  <p className="text-sm text-center text-gray-600">
                    <Link href="/login" className="text-primary hover:underline">
                      Faça login
                    </Link>{" "}
                    para finalizar seu pedido
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
