# vids/ — vídeos dos produtos

Vídeos curtos (estilo GIF) que **substituem a imagem do produto dentro do diálogo de
adicionais** (`BuqueExtrasDialog`). Tocam em autoplay, em loop, mudos e sem controles —
o usuário não pausa, não abre e não há som.

## Como usar

1. Coloque o arquivo aqui, ex.: `public/vids/buque-5-rosas-importadas.mp4`.
2. No produto (`src/data/products.ts`), aponte o campo `video` para o caminho relativo a
   `/public`:

   ```ts
   {
     // ...
     image: "/images/buque-5-rosas-importadas.jpeg", // poster + fallback se o vídeo falhar
     video: "/vids/buque-5-rosas-importadas.mp4",
     lazyVideo: false, // false = carrega já; true = preload "metadata" (sob demanda)
   }
   ```

## Recomendações de codificação

- **Formato:** MP4 (H.264 + faixa de áudio removida ou silenciosa). É o que dá autoplay
  confiável em todos os navegadores, incluindo iOS.
- **Sem áudio:** o vídeo toca mudo de qualquer forma; remova a faixa para economizar peso.
- **Curto e leve:** alguns segundos em loop. Otimize o bitrate para a web.
- O campo `image` continua sendo usado como **poster** (frame inicial) e como **fallback**
  caso o vídeo não carregue.

## Cache em produção (Vercel)

`/vids/` é servido com `Cache-Control: public, max-age=31536000, immutable` (ver
[`vercel.json`](../../vercel.json)). Sem isso o navegador re-baixava o `.mp4` a cada abertura
do diálogo: o `<video>` faz range-requests (`206 Partial Content`) que o default da Vercel
(`max-age=0, must-revalidate`) não cacheia bem. (Card #42 no Trello.)

⚠️ **Para atualizar um vídeo:** como é `immutable`, trocar o arquivo mantendo o **mesmo
nome** não atualiza para quem já tem o cache. **Renomeie o arquivo** (ex.: `…-v2.mp4`) e
ajuste o campo `video` em `src/data/products.ts` — cache-busting por nome.
