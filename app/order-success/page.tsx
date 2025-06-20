"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, MapPin, User, Phone, Mail, ArrowLeft, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"
import Image from "next/image"

interface OrderDetails {
  id: string
  items: Array<{
    id: string
    name: string
    price: string
    quantity: number
    gallery: string[]
  }>
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  total: number
  createdAt: string
  status: string
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (!orderId) {
      router.push("/")
      return
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setOrderDetails(data.order)
        } else {
          toast.error("Pedido não encontrado")
          router.push("/")
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do pedido:", error)
        toast.error("Erro ao carregar detalhes do pedido")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, router])

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numPrice)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const copyOrderId = async () => {
    if (!orderId) return

    try {
      await navigator.clipboard.writeText(orderId)
      setCopied(true)
      toast.success("Código do pedido copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.log(error)
      toast.error("Erro ao copiar código")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      processing: { label: "Processando", variant: "default" as const },
      shipped: { label: "Enviado", variant: "default" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: "Desconhecido",
      variant: "secondary" as const,
    }

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando detalhes do pedido...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h2>
          <Link href="/">
            <Button>Voltar à loja</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à loja
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">Pedido Confirmado</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pedido Realizado com Sucesso!</h2>
          <p className="text-gray-600 text-lg">
            Obrigado pela sua compra. Você receberá um email de confirmação em breve.
          </p>
        </div>

        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Código do Pedido</h3>
                <p className="text-2xl font-bold text-green-600">#{orderId}</p>
                <p className="text-sm text-gray-600 mt-1">Pedido realizado em {formatDate(orderDetails.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(orderDetails.status)}
                <Button variant="outline" size="sm" onClick={copyOrderId} className="flex items-center gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado!" : "Copiar código"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido ({orderDetails.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderDetails.items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.gallery[0] || "/placeholder.svg?height=64&width=64"}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-md"
                    ></Image>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Qtd: {item.quantity}</span>
                      <span className="font-semibold text-primary">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total do Pedido:</span>
                <span className="text-primary">{formatPrice(orderDetails.total)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{orderDetails.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{orderDetails.customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{orderDetails.customer.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{orderDetails.customer.address}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              Continuar Comprando
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => window.print()}>
            Imprimir Pedido
          </Button>
        </div>
      </main>
    </div>
  )
}
