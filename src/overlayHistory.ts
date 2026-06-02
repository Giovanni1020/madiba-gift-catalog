// Histórico compartilhado dos overlays (cart drawer, checkout, diálogo de extras).
//
// UMA entrada `{ overlay: true }` representa "tem um overlay aberto", para o
// "voltar" do celular fechar o overlay em vez de sair do site. A entrada é
// REAPROVEITADA nas transições entre overlays (extras → cart → checkout), então
// nunca empilha: a profundidade máxima é 1 overlay acima da base do catálogo.

export function pushOverlayOnce() {
  if (!window.history.state?.overlay) {
    window.history.pushState({ overlay: true }, "");
  }
}

// Fecha o overlay "voltando" no histórico (dispara popstate, que reseta o estado
// do overlay). Sem a entrada (caso de borda), cai no fallback direto.
export function popOverlayOr(fallback: () => void) {
  if (window.history.state?.overlay) {
    window.history.back();
  } else {
    fallback();
  }
}
