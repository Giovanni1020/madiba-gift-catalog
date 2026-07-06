import { test, expect } from "@jest/globals";
import { frete } from "./frete";

// Exemplo do enunciado da regra: 17 km → 34 → arredonda pra 35.
test("exemplo da regra: 17 km → R$35", () => {
  expect(frete(17)).toEqual({ dentroDoRaio: true, valor: 35, km: 17 });
});

// Piso de R$10: distâncias curtas não caem abaixo do piso (1 km → 2 → 0 → 10).
test("aplica o piso de R$10 em distâncias curtas", () => {
  expect(frete(0).dentroDoRaio && frete(0).valor).toBe(10);
  expect(frete(1).dentroDoRaio && frete(1).valor).toBe(10);
  expect(frete(3).dentroDoRaio && frete(3).valor).toBe(10); // 6 → 5 → sobe pro piso
  expect(frete(6).dentroDoRaio && frete(6).valor).toBe(10); // 12 → 10
});

// Empate de arredondamento resolve pra cima (múltiplo de 5 mais próximo).
test("empate arredonda pra cima", () => {
  expect(frete(6.25).dentroDoRaio && frete(6.25).valor).toBe(15); // 12.5 → 15
  expect(frete(11.25).dentroDoRaio && frete(11.25).valor).toBe(25); // 22.5 → 25
});

// Borda do raio: 25 km ainda entrega (teto R$50); acima disso, fora da cobertura.
test("25 km entrega no teto de R$50", () => {
  expect(frete(25)).toEqual({ dentroDoRaio: true, valor: 50, km: 25 });
});

test("acima de 25 km fica fora do raio (sem valor)", () => {
  expect(frete(25.1)).toEqual({ dentroDoRaio: false, km: 25.1 });
  expect(frete(40)).toEqual({ dentroDoRaio: false, km: 40 });
});

// O valor nunca ultrapassa o teto nem fica abaixo do piso dentro do raio.
test("valor fica sempre entre piso e teto dentro do raio", () => {
  for (let km = 0; km <= 25; km += 0.5) {
    const r = frete(km);
    if (r.dentroDoRaio) {
      expect(r.valor).toBeGreaterThanOrEqual(10);
      expect(r.valor).toBeLessThanOrEqual(50);
      expect(r.valor % 5).toBe(0); // sempre múltiplo de 5
    }
  }
});
