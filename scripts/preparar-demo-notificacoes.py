#!/usr/bin/env python3
"""Prepara a demonstracao de NOTIFICACOES (RF17) para uma conta de professor ja existente.

Usa so HTTP (regras reais). Com a conta do professor, faz:
  1. entra como o professor (nao cria a conta dele);
  2. cria, se faltar, a turma "Demonstracao de notificacoes" e uma atividade com prazo em 1 dia;
  3. cria, se faltar, uma aluna de demonstracao (@demo.rural) e a inscreve na turma pelo codigo;
  4. gera notificacoes REAIS: o professor publica um aviso (a aluna e avisada) e a aluna comenta na atividade
     e no aviso (o professor e avisado).
Pode rodar mais de uma vez: a turma, a atividade e a aluna sao reaproveitadas; cada execucao so soma novas
notificacoes. Para o video, deixe o professor responder ao vivo (a aluna e avisada) e a aluna comentar de novo.

  PROF_EMAIL='paulo@ufrpe.br' PROF_SENHA='...' ALUNA_SENHA='...' \
    python3 -I scripts/preparar-demo-notificacoes.py [https://rural-sala-de-aula.narniano.com/api/v1]

Para apagar a aluna depois: DOMINIO=demo.rural bash rural-sala-de-aula/limpar-testes.sh [--apply] (hetzner-infra).
"""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1").rstrip("/")
PROF_EMAIL = os.environ.get("PROF_EMAIL", "paulo@ufrpe.br")
PROF_SENHA = os.environ.get("PROF_SENHA", "")
ALUNA_EMAIL = os.environ.get("ALUNA_EMAIL", "notificacoes@demo.rural")
ALUNA_SENHA = os.environ.get("ALUNA_SENHA", "")
NOME_TURMA = "Demonstração de notificações"
NOME_ATIVIDADE = "Lista de demonstração"

if not PROF_SENHA or len(ALUNA_SENHA) < 8:
    sys.exit("Defina PROF_SENHA (senha do professor) e ALUNA_SENHA (nova, com pelo menos 8 caracteres).")


class Pessoa:
    def __init__(self, nome, email, senha):
        self.nome, self.email, self.senha = nome, email, senha
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def call(self, method, path, body=None):
        data, headers = None, {}
        if body is not None:
            data, headers["Content-Type"] = json.dumps(body).encode(), "application/json"
        req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
        try:
            with self.opener.open(req, timeout=30) as r:
                payload, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            payload, status = e.read(), e.code
        try:
            return status, json.loads(payload) if payload else None
        except ValueError:
            return status, payload

    def ok(self, method, path, body=None, esperado=(200, 201, 204)):
        status, dados = self.call(method, path, body)
        if status not in esperado:
            sys.exit(f"{method} {path} -> {status} {dados}")
        return dados

    def entrar(self, cadastrar=False):
        status, dados = self.call("POST", "/auth/login", {"email": self.email, "senha": self.senha})
        if status == 200:
            return
        if not cadastrar:
            sys.exit(f"Não consegui entrar como {self.email} ({status}). Confira o e-mail e a senha.")
        status, dados = self.call("POST", "/auth/register", {"nome": self.nome, "email": self.email, "senha": self.senha})
        if status == 409:
            sys.exit(f"{self.email} já existe com outra senha. Use essa senha em ALUNA_SENHA ou outro ALUNA_EMAIL.")
        if status != 201:
            sys.exit(f"POST /auth/register -> {status} {dados}")


def iso(delta):
    return (datetime.now(timezone.utc) + delta).strftime("%Y-%m-%dT%H:%M:%SZ")


prof = Pessoa("Professor", PROF_EMAIL, PROF_SENHA)
aluna = Pessoa("Aluna de Demonstração", ALUNA_EMAIL, ALUNA_SENHA)

prof.entrar()
aluna.entrar(cadastrar=True)
print(f"ok: entrou como {PROF_EMAIL} e como {ALUNA_EMAIL}")

turmas = prof.ok("GET", "/turmas")
turma = next((t for t in turmas if t.get("nome") == NOME_TURMA and t.get("codigo")), None)
if turma is None:
    mes = datetime.now().month
    semestre = f"{datetime.now().year}.{1 if mes <= 6 else 2}"
    turma = prof.ok("POST", "/turmas", {"nome": NOME_TURMA, "disciplina": "Demonstração", "semestre": semestre,
                                        "diasAula": [1, 3], "descricao": "Turma de demonstração das notificações."})
    print(f"criou a turma {turma['nome']}")
tid, codigo = turma["id"], turma["codigo"]

status, dados = aluna.call("POST", "/inscricoes", {"codigo": codigo})
if status not in (200, 201, 409):
    sys.exit(f"inscrição -> {status} {dados}")

atividades = prof.ok("GET", f"/turmas/{tid}/atividades")
atividade = next((a for a in atividades if a.get("nome") == NOME_ATIVIDADE), None)
if atividade is None:
    atividade = prof.ok("POST", f"/turmas/{tid}/atividades", {
        "nome": NOME_ATIVIDADE, "descricao": "Atividade usada na demonstração das notificações.",
        "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=1)), "disponivelEm": iso(timedelta(hours=-1))})
    print(f"criou a atividade {atividade['nome']}")
aid = atividade["id"]

# Notificacoes reais: o professor avisa a turma; a aluna comenta (e o professor e avisado).
aviso = prof.ok("POST", f"/turmas/{tid}/avisos", {"texto": "Aviso de demonstração: a lista vale nota."})
aluna.ok("POST", f"/atividades/{aid}/comentarios", {"texto": "Professor, posso entregar em dupla?"})
aluna.ok("POST", f"/avisos/{aviso['id']}/comentarios", {"texto": "Entendido, obrigada pelo aviso."})

n_prof = prof.ok("GET", "/notificacoes")
n_aluna = aluna.ok("GET", "/notificacoes")
print(f"\npronto. Professor ({PROF_EMAIL}): {n_prof.get('naoLidas')} não lidas | "
      f"aluna ({ALUNA_EMAIL}): {n_aluna.get('naoLidas')} não lidas")
print(f"turma: {NOME_TURMA} (código {codigo}) | atividade: {NOME_ATIVIDADE}")
print("Na gravação: o professor responde ao comentário da aluna e a aluna recebe a notificação.")
