# ADR-0002 — Estado e persistência do carrinho

- **Status:** Aceito — 2026-06-01
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), sem lib de estado.
  Já existe `src/context/CartContext.tsx`.

## Contexto

O carrinho precisa ser:

- **compartilhado** entre componentes (badge no `Header`, `CartDrawer`, checkout);
- **resistente a reload acidental** no mobile (a jornada sofre interrupções: o cliente sai
  para buscar o endereço, olha outra coisa, etc.).

Os produtos vêm de um `src/data/products.ts` estático (sem backend). O pedido também carrega
dados de cliente e de entrega — parte deles é PII que queremos lembrar entre sessões, mas só
com consentimento.

## Decisão

**Compartilhamento de estado:** Context + `useReducer`, evoluindo o `CartContext.tsx` atual.
Actions previstas: `add`, `remove`, `updateQty`, `clear` (e tratamento de `extras`).

**Persistência do carrinho:** `sessionStorage`.
- Sobrevive a reload acidental; **morre ao fechar a aba** → elimina o problema de carrinho
  velho (item sazonal / preço defasado), que assim **não existe** no v1.
- Hidratar na inicialização; sincronizar a cada mudança; **guardar contra `JSON.parse`
  quebrado/ausente**.

**Persistência dos dados de cliente/entrega:** `localStorage`, **opt-in** via checkbox
"lembrar meus dados". Só grava quando o usuário marca; expõe forma de limpar.

**Modelo do pedido** (consequência dos extras e do toggle retirada/entrega):

```
item    = { produto, qtd, extras[] }
pedido  = { itens: item[], total, cliente: { nome, telefone },
            entrega: { tipo: 'retirada' | 'entrega', endereco? } }
endereco = { cep, rua, numero, bairro }   // sem complemento
```

## Consequências

**Positivas**
- Zero dependência nova; reaproveita o Context existente.
- Carrinho sobrevive a reload acidental sem arrastar dado velho.
- PII opt-in: privacidade respeitada, implementação trivial (um checkbox controla o write).

**Negativas / custos**
- Context re-renderiza todos os consumidores a cada mudança — aceitável nesta escala e
  frequência (carrinho muda pouco). Se virar gargalo, migrar para Zustand depois.
- Fiação manual de persistência (efeito de hidratar/sincronizar) e parsing defensivo.

## Alternativas consideradas

- **Zustand + middleware `persist`:** menos boilerplate (estado + persistência) e re-render
  seletivo. Rejeitada no v1 para evitar dependência e manter o código didático; reavaliar se
  o boilerplate ou a performance incomodarem.
- **Carrinho inteiro em `localStorage`:** rejeitada — reintroduz o problema de carrinho velho
  (item sazonal/preço) por um ganho marginal. `sessionStorage` casa com a necessidade real
  (só reload acidental).
