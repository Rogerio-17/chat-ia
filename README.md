# Chat IA - ChatGPT Clone

Uma aplicação de chat inteligente construída com React, TypeScript, Firebase e OpenAI API.

## 🚀 Funcionalidades

- 💬 Chat em tempo real com IA (GPT-4o-mini)
- 📱 Design responsivo (mobile e desktop)
- 🖼️ Upload e análise de imagens
- 🔐 Autenticação com Firebase Auth
- 💾 Armazenamento de conversas no Firestore
- 🗂️ Sidebar com histórico de conversas
- 🎨 Interface moderna com Tailwind CSS

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Storage)
- **IA**: OpenAI API (GPT-4o-mini)
- **Formulários**: React Hook Form + Zod
- **Icones**: React Icons

## 📋 Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Conta no Firebase
- API Key da OpenAI

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/Rogerio-17/chat-ia.git
cd chat-ia
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Preencha as variáveis no arquivo `.env`:

```env
VITE_ENVIRONMENT = development

# Firebase Configuration
VITE_API_KEY = sua_firebase_api_key
VITE_AUTH_DOMAIN = seu_projeto.firebaseapp.com
VITE_PROJECT_ID = seu_project_id
VITE_STORAGE_BUCKET = seu_projeto.firebasestorage.app
VITE_MESSAGING_SENDER_ID = seu_messaging_sender_id
VITE_APP_ID = seu_app_id
VITE_MEASUREMENT_ID = seu_measurement_id

# OpenAI Configuration
VITE_OPENAI_API_KEY = sua_openai_api_key
```

### 4. Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication (Email/Password)
3. Crie um banco Firestore
4. Configure Storage
5. Copie as credenciais para o `.env`

### 5. Configure a OpenAI

1. Crie uma conta na [OpenAI](https://openai.com)
2. Gere uma API Key
3. Adicione a chave no `.env`

## 🚀 Executando

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📱 Recursos Mobile

- Sidebar responsiva (drawer no mobile)
- Header mobile com menu hamburger
- Imagens redimensionadas para mobile
- Layout otimizado para toque

## 🔒 Segurança

- ✅ API Keys protegidas por variáveis de ambiente
- ✅ Validação de formulários com Zod
- ✅ Autenticação obrigatória
- ✅ Rules de segurança no Firebase

## 📝 Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se você tiver alguma dúvida, abra uma [issue](https://github.com/Rogerio-17/chat-ia/issues) no GitHub.

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
