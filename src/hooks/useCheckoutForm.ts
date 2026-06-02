import { useState } from "react";
import { Cliente, Entrega } from "../types/order";

// Rascunho do checkout. Mora ACIMA do <Checkout> (no pai que não desmonta),
// pra os dados sobreviverem ao "Voltar" e a add/remover itens.

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Autofill do Google traz o DDI 55 → 13 dígitos. Removemos o DDI só quando
// passa de 11, pra não estragar um DDD 55 (Santa Maria/RS) de número local.
function normalizePhone(raw: string): string {
  let d = onlyDigits(raw);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

export interface CheckoutForm {
  tipo: Entrega["tipo"];
  setTipo: (t: Entrega["tipo"]) => void;
  nome: string;
  setNome: (v: string) => void;
  telefone: string; // só dígitos, sem DDI
  setTelefone: (raw: string) => void;
  cep: string; // só dígitos
  setCep: (raw: string) => void;
  rua: string;
  setRua: (v: string) => void;
  numero: string;
  setNumero: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
  recebe: string; // nome de quem recebe (só entrega)
  setRecebe: (v: string) => void;
  horario: string; // janela de entrega (só entrega)
  setHorario: (v: string) => void;
  // derivados
  telefoneOk: boolean;
  valido: boolean;
  build: () => { cliente: Cliente; entrega: Entrega } | null;
}

export function useCheckoutForm(): CheckoutForm {
  const [tipo, setTipo] = useState<Entrega["tipo"]>("entrega");
  const [nome, setNome] = useState("");
  const [telefone, setTelefoneRaw] = useState("");
  const [cep, setCepRaw] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [recebe, setRecebe] = useState("");
  const [horario, setHorario] = useState(""); // escolha obrigatória (só entrega)

  const setTelefone = (raw: string) => setTelefoneRaw(normalizePhone(raw));
  const setCep = (raw: string) => setCepRaw(onlyDigits(raw).slice(0, 8));

  const nomeOk = nome.trim().length > 0;
  const telefoneOk = telefone.length === 10 || telefone.length === 11;
  // RS é só aviso (não trava): pedido fora do RS pode ser entrega p/ alguém na
  // região, resolvido com o atendente depois. Validamos só o formato (8 dígitos).
  const cepOk = cep.length === 8;
  const enderecoOk =
    tipo === "retirada" ||
    (cepOk &&
      rua.trim().length > 0 &&
      numero.trim().length > 0 &&
      bairro.trim().length > 0 &&
      recebe.trim().length > 0 &&
      horario.trim().length > 0);
  const valido = nomeOk && telefoneOk && enderecoOk;

  const build = () => {
    if (!valido) return null;
    const cliente: Cliente = { nome: nome.trim(), telefone };
    const entrega: Entrega =
      tipo === "entrega"
        ? {
            tipo: "entrega",
            recebe: recebe.trim(),
            horario,
            endereco: {
              cep,
              rua: rua.trim(),
              numero: numero.trim(),
              bairro: bairro.trim(),
            },
          }
        : { tipo: "retirada" };
    return { cliente, entrega };
  };

  return {
    tipo, setTipo,
    nome, setNome,
    telefone, setTelefone,
    cep, setCep,
    rua, setRua,
    numero, setNumero,
    bairro, setBairro,
    recebe, setRecebe,
    horario, setHorario,
    telefoneOk, valido, build,
  };
}
