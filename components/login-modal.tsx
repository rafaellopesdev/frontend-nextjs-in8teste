"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import toast from "react-hot-toast"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("=== FRONTEND LOGIN ATTEMPT ===")
    console.log("Tentando login com:", { email: formData.email })

    try {
      console.log("Fazendo requisição para /api/auth/login")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      console.log("Status da resposta:", response.status)
      console.log("Headers da resposta:", Object.fromEntries(response.headers.entries()))

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type")
      console.log("Content-Type:", contentType)

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Resposta não é JSON:", textResponse)
        throw new Error(`Servidor retornou resposta inválida: ${textResponse.substring(0, 100)}`)
      }

      const data = await response.json()
      console.log("Dados da resposta:", data)

      if (data.success && response.ok) {
        console.log("Login bem-sucedido!")
        login(data.user, data.token)
        toast.success(`Bem-vindo, ${data.user.name}!`)
        onClose()
        setFormData({ email: "", password: "" })
      } else {
        console.log("Erro no login:", data.message)
        setError(data.message || "Erro ao fazer login")
        toast.error(data.message || "Erro ao fazer login")
      }
    } catch (error) {
      console.error("Erro na requisição de login:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setError(`Erro: ${errorMessage}`)
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
      console.log("=== FIM FRONTEND LOGIN ATTEMPT ===")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Fazer Login</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2" htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <Label className="mb-2" htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-8">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <button type="button" onClick={onSwitchToRegister} className="text-primary hover:underline font-medium">
              Cadastre-se aqui
            </button>
          </p>
        </div>

      </DialogContent>
    </Dialog>
  )
}
