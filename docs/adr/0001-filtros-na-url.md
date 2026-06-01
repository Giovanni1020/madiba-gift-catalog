# ADR-0001 — Estado dos filtros na URL

- **Status:** Aceito — 2026-06-01
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), **sem router** e **sem lib de estado**.

## Contexto

O estado da filtragem hoje vive em `useState` dentro de `src/hooks/useFilter.ts`. Como
`useState` local, ele:

- não sobrevive a reload (o cliente recarrega no celular e perde a seleção);
- não é compartilhável por link;
- não conversa com o botão "voltar" do celular;
- corre risco de ser percebido como "perdido" quando a UI muda (gaveta do carrinho,
  checkout em tela cheia).

A jornada é majoritariamente mobile e sujeita a interrupções.

## Decisão

Tratar o filtro como **estado de NAVEGAÇÃO** e guardá-lo na **query string da URL**
(`?categoria=buque&cor=vermelho`), via `URLSearchParams` + `history.replaceState`.

- `useFilter.ts` passa a ser a **única fonte** que lê de e escreve na URL.
- Usar **`replaceState`** (não `pushState`) nas mudanças de filtro — para **não** empilhar
  um item de histórico a cada clique e manter o "voltar" útil.
- **Não** adicionar router. A superfície de History API que tocamos é mínima e delimitada.

Modelo mental dos **três baldes** que rege todo o estado do app:

| Balde | Exemplo | Onde mora |
|---|---|---|
| UI efêmero | gaveta aberta/fechada | `useState` local |
| Navegação | filtros aplicados | **URL (`URLSearchParams`)** |
| Domínio persistente | carrinho | Context + persistência (ver ADR-0002) |

## Consequências

**Positivas**
- Sobrevive a reload; links compartilháveis; integra com o "voltar" do mobile.
- Desacopla o filtro do ciclo de vida de overlays — abrir gaveta ou ir pro checkout em
  tela cheia **não** afeta o filtro.
- Remove a restrição de "perda de estado" da decisão drawer-vs-tela-cheia.
- Zero dependência nova; zero camada de persistência extra para filtros.

**Negativas / custos**
- Precisamos serializar/desserializar filtros para a query string.
- Precisamos validar params inválidos/adulterados de forma defensiva (URL é editável pelo usuário).
- Sem router, gerenciamos `replaceState` + listener de `popstate` na mão (escopo pequeno, aceitável).

## Alternativas consideradas

- **Subir o estado / Context:** resolve o compartilhamento, mas não dá URL compartilhável,
  sobrevivência a reload nem integração com o "voltar". Rejeitada.
- **`react-router-dom` + `useSearchParams`:** API mais limpa, mas adiciona dependência e um
  modelo de roteamento que um app de tela única + overlays não precisa. Rejeitada no v1;
  reavaliar se surgirem rotas reais (ex.: `/produto/:id`).
