# Como Abrir o App Gestor360

## Diagnóstico

**O que foi verificado:**
- Node.js v24 e npm 11.6 instalados
- Dependências instaladas (node_modules existe)
- Portas 5173 e 5174 já estavam em uso → **o servidor provavelmente já estava rodando**
- O problema: o navegador não abre automaticamente (limitação do Vite no Windows)

---

## Soluções

### Opção 1: Clicar duas vezes no `ABRIR-APP.bat`
1. Vá até a pasta do projeto
2. Dê duplo clique em **ABRIR-APP.bat**
3. Instala dependências (se necessário), inicia o servidor e abre o navegador após ~8 segundos

### Opção 2: Usar o PowerShell
```powershell
cd "d:\Users\eduka\Desktop\GESTÃO DE CONDOMNIO"
.\ABRIR-APP.ps1
```

### Opção 3: Comandos manuais
```cmd
cd /d "d:\Users\eduka\Desktop\GESTÃO DE CONDOMNIO"
npm install
npm run dev
```
Depois abra manualmente no navegador: **http://localhost:5173** (ou 5174, 5175... conforme mostrado no terminal)

### Opção 4: Atalho direto
Se o servidor já estiver rodando, abra:
- http://localhost:5173
- http://localhost:5174

---

## Se nada funcionar

1. **Feche** todos os terminais com `npm run dev` rodando (Ctrl+C em cada)
2. **Abra um novo terminal** e execute: `ABRIR-APP.bat` ou os comandos da Opção 3
3. **Copie e cole** no Chrome/Edge: `http://localhost:5173`
