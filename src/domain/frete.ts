// Regra de frete por distância viária — função PURA (sem React, sem I/O).
// Vive na camada de domínio: recebe a distância (km, só ida) e devolve o valor
// ou "fora do raio". Quem busca a distância real (geocode + rota) é a Vercel
// Function `/api/frete`; aqui só mora a regra de negócio, isolada e testável.
//
// Regra (ADR-0006): frete = arredonda5(km × 2), com piso R$10 e teto R$50;
// acima de 25 km (só ida) → fora da cobertura. Empate de arredondamento → pra cima.

const RAIO_KM = 25; // teto de cobertura (distância só ida)
const PISO = 10; // R$ — piso do frete (curtas distâncias não caem abaixo disso)
const TETO = 50; // R$ — coincide com a borda do raio (25 km × 2)

// Arredonda pro múltiplo de 5 mais próximo. Math.round já resolve o empate
// "pra cima" para positivos (Math.round(2.5) === 3): 22.5 → 25, 12.5 → 15.
const arredonda5 = (x: number) => Math.round(x / 5) * 5;

// `valor` está em REAIS (a regra é definida em reais). Ao integrar com o resto do
// app (que trabalha em centavos), converter na fronteira: valor * 100.
export type Frete =
  | { dentroDoRaio: true; valor: number; km: number }
  | { dentroDoRaio: false; km: number };

export function frete(km: number): Frete {
  if (km > RAIO_KM) return { dentroDoRaio: false, km };
  const valor = Math.min(Math.max(arredonda5(km * 2), PISO), TETO);
  return { dentroDoRaio: true, valor, km };
}
