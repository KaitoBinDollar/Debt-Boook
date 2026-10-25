# Debt Book

Aplicação web progressiva (PWA) simples para registar dívidas e pagamentos.

## Ficheiros
- `index.html` — estrutura da aplicação
- `style.css` — interface escura com detalhes laranja
- `app.js` — registos, pagamentos, pesquisa, importação e exportação
- `manifest.json` e `sw.js` — instalação PWA e cache offline
- `icon.svg` — ícone

## Executar
Abre `index.html` num navegador para testar. Algumas funções PWA (instalação e modo offline com cache) precisam de HTTPS ou localhost; o GitHub Pages fornece HTTPS.

## Publicar no GitHub Pages
1. Entra no GitHub e abre o repositório `Debt-Book`.
2. Envia todos estes ficheiros para a raiz do repositório e faz commit.
3. Abre **Settings → Pages**.
4. Em **Build and deployment**, escolhe **Deploy from a branch**.
5. Seleciona a branch `main` e a pasta `/ (root)`, depois carrega em **Save**.
6. Quando a publicação terminar, abre `https://kaitobindollar.github.io/Debt-Book/`.

## Instalar no Android
1. Abre o endereço publicado no Chrome.
2. Abre o menu ⋮ e escolhe **Instalar app** ou **Adicionar ao ecrã inicial**.
3. Para dados importantes, usa **Exportar JSON** regularmente e guarda o ficheiro num local seguro.

## Importante sobre os dados
Os dados são guardados localmente no navegador do dispositivo. Não são sincronizados automaticamente entre dispositivos. Se limpares os dados do navegador ou perderes o dispositivo sem backup, os registos locais podem perder-se. Usa Exportar JSON para criar cópias e Importar JSON para restaurá-las.
