"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"

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

interface CartItem extends Product {
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotal: () => number
  loadCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      setCartItems([])
    }
  }, [user])

  const loadCart = async () => {
    if (!user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/list`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items || [])
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error)
    }
  }

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

  const addToCart = async (product: Product) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId: product.id, product }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items)
      } else {
        throw new Error("Erro ao adicionar produto ao carrinho")
      }
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error)
      throw error
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/delete-product`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items)
      }
    } catch (error) {
      console.error("Erro ao remover do carrinho:", error)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return

    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/update-quantity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId, quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items)
      }
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error)
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/clear`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      if (response.ok) {
        setCartItems([])
      }
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error)
    }
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number.parseFloat(item.price)
      const discount = item.hasDiscount ? Number.parseFloat(item.discountValue) : 0
      const finalPrice = price * (1 - discount)
      return total + finalPrice * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
