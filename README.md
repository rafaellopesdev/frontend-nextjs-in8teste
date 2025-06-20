## Descrição

Este é um projeto front-end desenvolvido com **React**, **Next.js** e **ShadCN UI**, utilizando uma infraestrutura simplificada com **Docker** para facilitar a execução e o desenvolvimento local.

> ⚙️ Este projeto consome as APIs do repositório back-end: [backend-nestjs-in8teste](https://github.com/rafaellopesdev/backend-nestjs-in8teste)

---

## Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas na sua máquina:

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* Repositório de backend rodando localmente:
  🔗 `https://github.com/rafaellopesdev/backend-nestjs-in8teste`

---

## Configuração do Ambiente

1. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

---

## Executando a aplicação

Com o Docker instalado e configurado corretamente:

```bash
sudo docker-compose up --build
```

A aplicação estará disponível em:
🌐 `http://localhost:3000`

---

## Documentação da API

A aplicação consome uma API RESTful documentada com Swagger/OpenAPI.
Acesse a documentação da API através do link:

```bash
http://localhost:3001/api/v1/documentation
```
