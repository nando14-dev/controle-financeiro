"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const salarioDia15 = 3000;
  const salarioDia30 = 2800;

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("fixa");
  const [periodo, setPeriodo] = useState("15");

  const [gastos, setGastos] = useState<any[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);

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
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar gastos:", error);
      return;
    }

    setGastos(data);
  }

  async function adicionarGasto() {
    if (!descricao || !valor || !categoria) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuário não autenticado.");
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
      return;
    }

    setGastos([data, ...gastos]);

    setDescricao("");
    setValor("");
    setCategoria("");
    setTipo("fixa");
    setPeriodo("15");
  }

  async function excluirGasto(idParaExcluir: number) {
    const { error } = await supabase
      .from("gastos")
      .delete()
      .eq("id", idParaExcluir);

    if (error) {
      console.error("Erro ao excluir gasto:", error);
      alert("Erro ao excluir gasto.");
      return;
    }

    const novaLista = gastos.filter((gasto) => gasto.id !== idParaExcluir);
    setGastos(novaLista);
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
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8">Controle Financeiro</h1>

      <button
        onClick={logout}
        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-bold mb-6"
      >
        Sair
      </button>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">💰 Dia 15</h2>
          <p>Recebido: R$ {salarioDia15}</p>
          <p>Total de Gastos: R$ {totalGastos15}</p>

          <hr className="border-zinc-600 my-4" />

          <p className="text-xl font-bold text-green-400">
            Saldo: R$ {saldo15}
          </p>
        </div>

        <div className="bg-zinc-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">💰 Dia 30</h2>
          <p>Recebido: R$ {salarioDia30}</p>
          <p>Total de Gastos: R$ {totalGastos30}</p>

          <hr className="border-zinc-600 my-4" />

          <p className="text-xl font-bold text-green-400">
            Saldo: R$ {saldo30}
          </p>
        </div>
      </div>

      <div className="bg-zinc-800 p-6 rounded-2xl shadow-lg max-w-3xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">Novo gasto</h2>

        <div className="grid gap-2 md:grid-cols-2 mb-4">
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="bg-zinc-700 p-2 rounded-lg text-white"
          />

          <input
            type="number"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="bg-zinc-700 p-2 rounded-lg text-white"
          />

          <input
            type="text"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-zinc-700 p-2 rounded-lg text-white"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="bg-zinc-700 p-2 rounded-lg text-white"
          >
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável/Pontual</option>
          </select>

          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-zinc-700 p-2 rounded-lg text-white md:col-span-2"
          >
            <option value="15">Descontar do dia 15</option>
            <option value="30">Descontar do dia 30</option>
          </select>
        </div>

        <button
          onClick={adicionarGasto}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-bold"
        >
          Adicionar Gasto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Gastos do dia 15</h2>

          <div className="space-y-3">
            {gastosDia15.map((gasto) => (
              <div key={gasto.id} className="bg-zinc-700 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">{gasto.descricao}</h3>
                    <span>R$ {gasto.valor}</span>
                  </div>

                  <button
                    onClick={() => excluirGasto(gasto.id)}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-bold"
                  >
                    Excluir
                  </button>
                </div>

                <div className="flex gap-2">
                  <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                    {gasto.categoria}
                  </span>

                  <span
                    className={
                      gasto.tipo === "fixa"
                        ? "bg-red-500 px-2 py-1 rounded text-sm"
                        : "bg-yellow-500 px-2 py-1 rounded text-sm"
                    }
                  >
                    {gasto.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Gastos do dia 30</h2>

          <div className="space-y-3">
            {gastosDia30.map((gasto) => (
              <div key={gasto.id} className="bg-zinc-700 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">{gasto.descricao}</h3>
                    <span>R$ {gasto.valor}</span>
                  </div>

                  <button
                    onClick={() => excluirGasto(gasto.id)}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-bold"
                  >
                    Excluir
                  </button>
                </div>

                <div className="flex gap-2">
                  <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                    {gasto.categoria}
                  </span>

                  <span
                    className={
                      gasto.tipo === "fixa"
                        ? "bg-red-500 px-2 py-1 rounded text-sm"
                        : "bg-yellow-500 px-2 py-1 rounded text-sm"
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
    </main>
  );
}