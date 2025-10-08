# 🤖 Chatbot with RAG (Retrieval-Augmented Generation)

A full-stack AI chatbot powered by **Llama 3.1 (8B-Instruct Q5_K_M)** and a **Retrieval-Augmented Generation (RAG)** pipeline.  
Built with **Express.js** for the backend and **React** for the frontend, this project runs locally and connects directly to a locally-hosted Large Language Model via the Ollama runtime.

---

## 🧠 Overview

This chatbot serves as an interactive local AI assistant with retrieval capabilities — allowing it to answer queries based not only on its base model knowledge but also on additional contextual data through RAG.  
The system consists of:

- **Express backend** — Handles API routes and streams LLM responses.  
- **React frontend** — Static chat UI served by the backend.  
- **Ollama model runtime** — Hosts the local Llama 3.1 model and executes the actual inference.  

---

## ⚙️ Tech Stack

| Layer | Technology |
|:------|:------------|
| **Backend** | Node.js / Express |
| **Frontend** | React + Vite |
| **AI Runtime** | Ollama (Llama 3.1:8b-instruct-q5_K_M) |
| **RAG Component** | Custom vector retrieval and embedding logic |
| **Streaming** | Server-Sent Events (SSE) |

---

## 🚀 Features

- 🔄 **RAG endpoint** (`/rag/stream`) for streaming contextual responses  
- ⚡ **Real-time token streaming** to the UI using SSE  
- 💾 **Local inference** — no external API calls required  
- 🧩 **React chat interface** served by the same Express backend  
- 🛠️ **Easy local deployment** via Node scripts  
- 🧱 **Extendable architecture** for future data sources or models  

---

## 📁 Project Structure


