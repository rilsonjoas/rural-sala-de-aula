#!/usr/bin/env python3
"""Cria um conjunto de DEMONSTRACAO pela API (turmas, atividades, entregas, notas, avisos e comentarios).

Usa so HTTP, entao passa pelas regras reais (permissoes, prazos, hash das entregas). Os usuarios usam o
dominio @demo.rural e as turmas dizem que sao de demonstracao. A senha vem de DEMO_SENHA (nao fica no repositorio).
Idempotente: se a conta da professora ja existe, nao faz nada.

  DEMO_SENHA='...' python3 -I scripts/seed-demo.py [http://localhost:8081/api/v1]

Para apagar depois: DOMINIO=demo.rural bash rural-sala-de-aula/limpar-testes.sh [--apply] (hetzner-infra).
"""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1").rstrip("/")
SENHA = os.environ.get("DEMO_SENHA", "")
if len(SENHA) < 8:
    sys.exit("Defina DEMO_SENHA com pelo menos 8 caracteres.")


class Pessoa:
    def __init__(self, nome, email):
        self.nome, self.email = nome, email
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def call(self, method, path, body=None, raw=None, ctype=None):
        headers, data = {}, None
        if body is not None:
            data, headers["Content-Type"] = json.dumps(body).encode(), "application/json"
        if raw is not None:
            data, headers["Content-Type"] = raw, ctype
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

    def entrar_ou_cadastrar(self):
        status, _ = self.call("POST", "/auth/login", {"email": self.email, "senha": SENHA})
        if status == 200:
            return False
        status, dados = self.call("POST", "/auth/register", {"nome": self.nome, "email": self.email, "senha": SENHA})
        if status == 409:
            sys.exit(f"{self.email} ja existe com outra senha (uma execucao anterior usou outra DEMO_SENHA). "
                     "Apague a demonstracao e rode de novo: DOMINIO=demo.rural bash rural-sala-de-aula/limpar-testes.sh --apply")
        if status != 201:
            sys.exit(f"POST /auth/register -> {status} {dados}")
        return True

    def enviar(self, atividade_id, nome_arquivo, conteudo):
        b = uuid.uuid4().hex
        raw = (f'--{b}\r\nContent-Disposition: form-data; name="arquivo"; filename="{nome_arquivo}"\r\n'
               f"Content-Type: application/pdf\r\n\r\n").encode() + conteudo + f"\r\n--{b}--\r\n".encode()
        status, dados = self.call("POST", f"/atividades/{atividade_id}/entregas", raw=raw, ctype=f"multipart/form-data; boundary={b}")
        if status != 201:
            sys.exit(f"envio de {self.nome} -> {status} {dados}")
        return dados


def pdf(titulo, autor):
    """PDF minimo de uma pagina com texto, valido o bastante para abrir em qualquer leitor."""
    texto = f"{titulo} - {autor}".replace("(", "[").replace(")", "]")
    fluxo = f"BT /F1 16 Tf 72 720 Td ({texto}) Tj ET"
    objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(fluxo)} >>\nstream\n{fluxo}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out, offs = b"%PDF-1.4\n", []
    for i, o in enumerate(objs, 1):
        offs.append(len(out))
        out += f"{i} 0 obj\n{o}\nendobj\n".encode("latin-1", "replace")
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    out += "".join(f"{o:010d} 00000 n \n" for o in offs).encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return out


def iso(delta):
    return (datetime.now(timezone.utc) + delta).strftime("%Y-%m-%dT%H:%M:%SZ")


D = timedelta
helena = Pessoa("Helena Duarte", "helena.duarte@demo.rural")
ricardo = Pessoa("Ricardo Moura", "ricardo.moura@demo.rural")
alunos = [Pessoa(n, f"{e}@demo.rural") for n, e in [
    ("Ana Beatriz Lima", "ana.lima"), ("Bruno Carvalho", "bruno.carvalho"), ("Camila Ferreira", "camila.ferreira"),
    ("Diego Santana", "diego.santana"), ("Eduarda Pires", "eduarda.pires"), ("Felipe Nogueira", "felipe.nogueira"),
]]
ana, bruno, camila, diego, eduarda, felipe = alunos

if not helena.entrar_ou_cadastrar():
    print("Demonstracao ja existe (a conta helena.duarte@demo.rural entra). Nada a fazer.")
    sys.exit(0)
ricardo.entrar_ou_cadastrar()
for a in alunos:
    a.entrar_ou_cadastrar()

nota_demo = "Turma de demonstração do sistema."
bd = helena.ok("POST", "/turmas", {"nome": "Banco de Dados", "disciplina": "Banco de Dados", "semestre": "2026.2", "diasAula": [2, 4], "descricao": nota_demo})
web = ricardo.ok("POST", "/turmas", {"nome": "Programação Web", "disciplina": "Programação Web", "semestre": "2026.2", "diasAula": [3, 5], "descricao": nota_demo})
for a in alunos:
    a.ok("POST", "/inscricoes", {"codigo": bd["codigo"]})
for a in (ana, bruno, camila, diego):
    a.ok("POST", "/inscricoes", {"codigo": web["codigo"]})


def atividade(prof, turma, nome, tipo, prazo, desc, atraso=True):
    return prof.ok("POST", f"/turmas/{turma['id']}/atividades", {
        "nome": nome, "tipo": tipo, "descricao": desc, "prazoFinal": iso(prazo),
        "disponivelEm": iso(D(days=-20)), "aceitaAtraso": atraso})["id"]


def entregar(pessoa, ativ_id, titulo):
    return pessoa.enviar(ativ_id, f"{titulo.lower().replace(' ', '_')}_{pessoa.nome.split()[0].lower()}.pdf", pdf(titulo, pessoa.nome))["id"]


def avaliar(prof, entrega_id, nota, comentario):
    prof.ok("PUT", f"/entregas/{entrega_id}/avaliacao", {"nota": nota, "comentarioPrivado": comentario})


def passar_prazo(prof, ativ_id, nome, tipo, desc, atraso=True):
    """As entregas entram no prazo; depois o professor edita (RF11) o prazo para o passado.
    So para atividades cujas entregas devem aparecer como atrasadas: o atraso e calculado contra o prazo atual."""
    prof.ok("PUT", f"/atividades/{ativ_id}", {"nome": nome, "tipo": tipo, "descricao": desc, "prazoFinal": iso(D(days=-3)), "aceitaAtraso": atraso})


# ---- Banco de Dados (Helena)
desc1 = "Modelagem entidade-relacionamento e normalização até a 3FN."
l1 = atividade(helena, bd, "Lista 1 — Modelagem ER", "LISTA_DE_EXERCICIO", D(days=2), desc1)
notas = {ana: (9.5, "Modelo completo e bem normalizado."), bruno: (7.0, "Faltou a cardinalidade em duas relações."),
         camila: (8.5, "Boa lista; revise a 3FN do exercício 4."), diego: (6.5, "Entregue, mas com vários exercícios em branco.")}
ents = {p: entregar(p, l1, "Lista 1 Modelagem ER") for p in (ana, bruno, camila, diego)}
for p, (n, c) in notas.items():
    avaliar(helena, ents[p], n, c)

desc2 = "Projeto individual: modelar e implementar o banco de uma biblioteca (DER, script SQL e consultas)."
proj = atividade(helena, bd, "Projeto — Biblioteca (SQL)", "PROJETO_INDIVIDUAL", D(days=6), desc2)
pe = {p: entregar(p, proj, "Projeto Biblioteca") for p in (ana, camila, eduarda)}
avaliar(helena, pe[ana], 10.0, "Excelente. Gostei das visões criadas.")

atividade(helena, bd, "Prova 1 — SQL e álgebra relacional", "PROVA", D(days=12), "Conteúdo: SELECT, JOIN, agregações e álgebra relacional.")
atividade(helena, bd, "Seminário — Bancos NoSQL", "PROJETO_EM_GRUPO", D(days=21), "Apresentação em grupo de 10 minutos sobre um banco NoSQL à escolha.")
l0 = atividade(helena, bd, "Lista 0 — Revisão de lógica", "LISTA_DE_EXERCICIO", D(minutes=30), "Revisão rápida de lógica e conjuntos.", atraso=False)
for p in (ana, bruno, eduarda):
    entregar(p, l0, "Lista 0 Revisao")
passar_prazo(helena, l0, "Lista 0 — Revisão de lógica", "LISTA_DE_EXERCICIO", "Revisão rápida de lógica e conjuntos.", atraso=False)

# ---- Programação Web (Ricardo)
h1 = atividade(ricardo, web, "Lista 1 — HTML e CSS", "LISTA_DE_EXERCICIO", D(days=1), "Layout responsivo com flexbox e grid.")
wents = {p: entregar(p, h1, "Lista 1 HTML e CSS") for p in (ana, bruno, camila)}
avaliar(ricardo, wents[ana], 9.0, "Layout limpo e acessível.")
avaliar(ricardo, wents[bruno], 7.5, "Faltou responsividade no menu.")
atividade(ricardo, web, "Projeto — Landing page", "PROJETO_INDIVIDUAL", D(days=9), "Landing page com formulário e validação em JavaScript.")
atividade(ricardo, web, "Prova 1 — JavaScript", "PROVA", D(days=15), "Conteúdo: DOM, eventos, fetch e promises.")

# ---- Mural e comentarios (com respostas)
a1 = helena.ok("POST", f"/turmas/{bd['id']}/avisos", {"texto": "Bem-vindos à turma de Banco de Dados! O material das aulas e as listas estarão aqui na aba Atividades."})
a2 = helena.ok("POST", f"/turmas/{bd['id']}/avisos", {"texto": "A Prova 1 será em 12 dias. Revisem SELECT, JOIN e agregações. Tirem dúvidas aqui nos comentários."})
c1 = bruno.ok("POST", f"/avisos/{a2['id']}/comentarios", {"texto": "Professora, a prova inclui subconsultas?"})
helena.ok("POST", f"/avisos/{a2['id']}/comentarios", {"texto": "Inclui sim, mas só as simples (IN e EXISTS).", "comentarioPaiId": c1["id"]})
ana.ok("POST", f"/avisos/{a2['id']}/comentarios", {"texto": "Obrigada! Vai ter consulta para resolver na hora?", "comentarioPaiId": c1["id"]})
c2 = camila.ok("POST", f"/avisos/{a2['id']}/comentarios", {"texto": "Podemos usar o material impresso?"})
helena.ok("POST", f"/avisos/{a2['id']}/comentarios", {"texto": "Pode, uma folha de resumo frente e verso.", "comentarioPaiId": c2["id"]})
a3 = ricardo.ok("POST", f"/turmas/{web['id']}/avisos", {"texto": "Nesta disciplina usaremos HTML, CSS e JavaScript puros antes de qualquer framework."})
c3 = diego.ok("POST", f"/avisos/{a3['id']}/comentarios", {"texto": "Vamos ver React no final do semestre?"})
ricardo.ok("POST", f"/avisos/{a3['id']}/comentarios", {"texto": "Sim, nas duas últimas semanas.", "comentarioPaiId": c3["id"]})

print("Demonstração criada:")
print(f"  Banco de Dados (código {bd['codigo']}): 1 professora, 6 alunos, 5 atividades, entregas e notas")
print(f"  Programação Web (código {web['codigo']}): 1 professor, 4 alunos, 3 atividades")
print("  Contas: helena.duarte, ricardo.moura, ana.lima, bruno.carvalho, camila.ferreira, diego.santana, eduarda.pires, felipe.nogueira @demo.rural")
