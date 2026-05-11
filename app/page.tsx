"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import {
  LogOut,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";

export default function Home() {
  const salarioDia15 = 3000;
  const salarioDia30 = 2800;

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("fixa");
  const [periodo, setPeriodo] = useState("15");

  const [gastos, setGastos] = useState<any[]>([]);
  const [carregandoGastos, setCarregandoGastos] = useState(true);
  const [salvandoGasto, setSalvandoGasto] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  const [gastoEditandoId, setGastoEditandoId] = useState<number | null>(null);

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function signup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session) {
        buscarGastos();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        buscarGastos();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function buscarGastos() {
    setCarregandoGastos(true);

    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar gastos:", error);
      setCarregandoGastos(false);
      return;
    }

    setGastos(data);
    setCarregandoGastos(false);
  }

  function editarGasto(gasto: any) {
    setGastoEditandoId(gasto.id);
    setDescricao(gasto.descricao);
    setValor(String(gasto.valor));
    setCategoria(gasto.categoria);
    setTipo(gasto.tipo);
    setPeriodo(gasto.periodo);
  }

  function limparFormulario() {
    setGastoEditandoId(null);
    setDescricao("");
    setValor("");
    setCategoria("");
    setTipo("fixa");
    setPeriodo("15");
  }

  function cancelarEdicao() {
    limparFormulario();
  }

  async function adicionarGasto() {
    if (!descricao || !valor || !categoria) return;

    setSalvandoGasto(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuário não autenticado.");
      setSalvandoGasto(false);
      return;
    }

    const novoGasto = {
      descricao,
      valor: Number(valor),
      categoria,
      tipo,
      periodo,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("gastos")
      .insert([novoGasto])
      .select()
      .single();

    if (error) {
      console.log("Erro Supabase:", error);
      alert("Erro ao salvar no Supabase. Veja o console.");
      setSalvandoGasto(false);
      return;
    }

    setGastos([data, ...gastos]);

    limparFormulario();
    setSalvandoGasto(false);
  }

  async function salvarAlteracao() {
    if (!gastoEditandoId || !descricao || !valor || !categoria) return;

    setSalvandoGasto(true);

    const gastoAtualizado = {
      descricao,
      valor: Number(valor),
      categoria,
      tipo,
      periodo,
    };

    const { data, error } = await supabase
      .from("gastos")
      .update(gastoAtualizado)
      .eq("id", gastoEditandoId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar gasto:", error);
      alert("Erro ao atualizar gasto.");
      setSalvandoGasto(false);
      return;
    }

    setGastos(
      gastos.map((gasto) =>
        gasto.id === gastoEditandoId ? data : gasto
      )
    );

    limparFormulario();
    setSalvandoGasto(false);
  }

  async function excluirGasto(idParaExcluir: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este gasto?"
    );

    if (!confirmou) return;

    setExcluindoId(idParaExcluir);

    const { error } = await supabase
      .from("gastos")
      .delete()
      .eq("id", idParaExcluir);

    if (error) {
      console.error("Erro ao excluir gasto:", error);
      alert("Erro ao excluir gasto.");
      setExcluindoId(null);
      return;
    }

    setGastos(gastos.filter((gasto) => gasto.id !== idParaExcluir));
    setExcluindoId(null);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Erro ao sair.");
      return;
    }

    setSession(null);
    setGastos([]);
  }

  const gastosDia15 = gastos.filter((gasto) => gasto.periodo === "15");

  const gastosDia30 = gastos.filter((gasto) => gasto.periodo === "30");

  const totalGastos15 = gastosDia15.reduce(
    (total, gasto) => total + gasto.valor,
    0
  );

  const totalGastos30 = gastosDia30.reduce(
    (total, gasto) => total + gasto.valor,
    0
  );

  const saldo15 = salarioDia15 - totalGastos15;
  const saldo30 = salarioDia30 - totalGastos30;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
        <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-700 p-3 rounded-lg w-full"
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-700 p-3 rounded-lg w-full"
            />

            <button
              onClick={login}
              className="bg-green-500 hover:bg-green-600 p-3 rounded-lg font-bold w-full"
            >
              Entrar
            </button>

            <button
              onClick={signup}
              className="bg-blue-500 hover:bg-blue-600 p-3 rounded-lg font-bold w-full"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#09090b_45%,#000000_100%)] text-white px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-400">
              Painel pessoal
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Controle Financeiro
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Organize seus gastos por período e acompanhe seu saldo com clareza.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-fit rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 shadow-lg shadow-black/20 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              <LogOut size={16} />
              <span>Sair</span>
            </div>
          </button>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Período</p>
                <h2 className="text-2xl font-semibold">Dia 15</h2>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-2xl">
                💰
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Recebido</span>
                <span className="font-medium text-zinc-100">{formatarMoeda(salarioDia15)}</span>
              </div>

              <div className="flex justify-between">
                <span>Total de gastos</span>
                <span className="font-medium text-zinc-100">{formatarMoeda(totalGastos15)}</span>
              </div>
            </div>

            <div className="my-5 h-px bg-zinc-800" />

            <div className="flex items-end justify-between">
              <span className="text-sm text-zinc-400">Saldo disponível</span>
              <span className="text-2xl font-bold text-emerald-400">
                {formatarMoeda(saldo15)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Período</p>
                <h2 className="text-2xl font-semibold">Dia 30</h2>
              </div>

              <div className="rounded-2xl bg-sky-500/10 px-3 py-2 text-2xl">
                💰
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Recebido</span>
                <span className="font-medium text-zinc-100">{formatarMoeda(salarioDia30)}</span>
              </div>

              <div className="flex justify-between">
                <span>Total de gastos</span>
                <span className="font-medium text-zinc-100">{formatarMoeda(totalGastos30)}</span>
              </div>
            </div>

            <div className="my-5 h-px bg-zinc-800" />

            <div className="flex items-end justify-between">
              <span className="text-sm text-zinc-400">Saldo disponível</span>
              <span className="text-2xl font-bold text-emerald-400">
                {formatarMoeda(saldo30)}
              </span>
            </div>

          </div>
        </div>
        <div className="mb-8 max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-emerald-400">
              {gastoEditandoId ? "Modo edição" : "Novo registro"}
            </p>

            <h2 className="text-3xl font-bold tracking-tight">
              {gastoEditandoId ? "Editar gasto" : "Adicionar gasto"}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Preencha os dados do gasto para acompanhar seu controle financeiro.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Descrição
              </label>

              <input
                type="text"
                placeholder="Ex: Internet, Mercado..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Valor
              </label>

              <input
                type="number"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Categoria
              </label>

              <input
                type="text"
                placeholder="Ex: Alimentação"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="fixa">Fixa</option>
                <option value="variavel">Variável/Pontual</option>
              </select>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-zinc-700 p-2 rounded-lg text-white md:col-span-2"
            >
              <option value="15">Descontar do dia 15</option>
              <option value="30">Descontar do dia 30</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={gastoEditandoId ? salvarAlteracao : adicionarGasto}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-bold"
              disabled={salvandoGasto}
            >
              {salvandoGasto
                ? gastoEditandoId
                  ? "Salvando..."
                  : "Adicionando..."
                : gastoEditandoId
                  ? "Salvar alteração"
                  : "Adicionar gasto"}

            </button>

            {gastoEditandoId && (
              <button
                onClick={cancelarEdicao}
                className="bg-zinc-600 hover:bg-zinc-500 px-4 py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
            <h2 className="mb-4 text-xl font-bold">Gastos do dia 15</h2>

            {carregandoGastos && (
              <p className="mb-4 text-sm text-zinc-400">
                Carregando gastos...
              </p>
            )}

            <div className="space-y-3">
              {!carregandoGastos && gastosDia15.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum gasto cadastrado para o dia 15.
                </p>
              )}

              {gastosDia15.map((gasto) => (
                <div
                  key={gasto.id}
                  className="rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-zinc-100">
                        {gasto.descricao}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-300">
                        {formatarMoeda(gasto.valor)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editarGasto(gasto)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-blue-600"
                      >
                        <Pencil
                          size={16}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => excluirGasto(gasto.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={excluindoId === gasto.id}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={2.5}
                          className="text-white"
                        />

                        <span>
                          {excluindoId === gasto.id ? "Excluindo..." : "Excluir"}
                        </span>
                      </button>                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
                      {gasto.categoria}
                    </span>

                    <span
                      className={
                        gasto.tipo === "fixa"
                          ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300"
                          : "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-300"
                      }
                    >
                      {gasto.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
            <h2 className="mb-4 text-xl font-bold">Gastos do dia 30</h2>

            {carregandoGastos && (
              <p className="mb-4 text-sm text-zinc-400">
                Carregando gastos...
              </p>
            )}

            <div className="space-y-3">
              {!carregandoGastos && gastosDia30.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum gasto cadastrado para o dia 30.
                </p>
              )}

              {gastosDia30.map((gasto) => (
                <div
                  key={gasto.id}
                  className="rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-zinc-100">
                        {gasto.descricao}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-300">
                        {formatarMoeda(gasto.valor)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editarGasto(gasto)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-blue-600"
                      >
                        <Pencil
                          size={16}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => excluirGasto(gasto.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={excluindoId === gasto.id}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={2.5}
                          className="text-white"
                        />

                        <span>
                          {excluindoId === gasto.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </span>
                      </button>                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
                      {gasto.categoria}
                    </span>

                    <span
                      className={
                        gasto.tipo === "fixa"
                          ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300"
                          : "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-300"
                      }
                    >
                      {gasto.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}