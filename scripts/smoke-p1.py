"""Teste de ponta a ponta dos 9 requisitos P1 contra a API real (Docker local ou producao).

Uso: python3 -I scripts/smoke-p1.py [base_url]   (padrao http://localhost:8081/api/v1)
Cria usuarios descartaveis pela propria API. Nao depende do seed.
"""
import hashlib
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1").rstrip("/")
RESULTS = []


class Client:
    def __init__(self, nome):
        self.nome = nome
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None, raw=None, ctype=None, extra=None):
        data = None
        headers = dict(extra or {})
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        if raw is not None:
            data, headers["Content-Type"] = raw, ctype
        req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
        try:
            with self.opener.open(req, timeout=30) as r:
                payload, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            payload, status = e.read(), e.code
        except (urllib.error.URLError, ConnectionError) as e:
            # o nginx fecha a conexao assim que ve um corpo acima do limite, antes do cliente terminar de enviar
            payload, status = str(e).encode(), 0
        try:
            return status, json.loads(payload)
        except Exception:
            return status, payload

    def upload(self, path, filename, content, ctype="application/octet-stream"):
        b = uuid.uuid4().hex
        raw = (
            f"--{b}\r\nContent-Disposition: form-data; name=\"arquivo\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {ctype}\r\n\r\n"
        ).encode() + content + f"\r\n--{b}--\r\n".encode()
        return self.call("POST", path, raw=raw, ctype=f"multipart/form-data; boundary={b}")


def check(rf, desc, ok, detalhe=""):
    RESULTS.append((rf, desc, bool(ok), detalhe))
    print(f"  [{'PASS' if ok else 'FAIL'}] {rf} {desc}" + ("" if ok else f"  -> {detalhe}"))


def iso(delta):
    return (datetime.now(timezone.utc) + delta).strftime("%Y-%m-%dT%H:%M:%SZ")


tag = uuid.uuid4().hex[:8]
prof, aluno, intruso, prof2 = Client("prof"), Client("aluno"), Client("intruso"), Client("prof2")
email = lambda n: f"{n}.{tag}@teste.rural"
SENHA = "umaSenha123"

print(f"Base: {BASE}  (execucao {tag})")

# ---------------- RF01 cadastro e login
print("RF01 Cadastro e login")
for c in (prof, aluno, intruso, prof2):
    s, b = c.call("POST", "/auth/register", {"nome": f"Teste {c.nome}", "email": email(c.nome), "senha": SENHA})
    check("RF01", f"cadastra {c.nome}", s == 201, f"{s} {b}")
s, b = Client("x").call("POST", "/auth/register", {"nome": "Dup", "email": email("prof"), "senha": SENHA})
check("RF01", "e-mail repetido e recusado (409)", s == 409, f"{s} {b}")
s, b = Client("x").call("POST", "/auth/register", {"nome": "", "email": "invalido", "senha": "curta"})
check("RF01", "dados invalidos recusados (422)", s == 422, f"{s} {b}")
s, b = Client("x").call("POST", "/auth/login", {"email": email("prof"), "senha": "errada"})
check("RF01", "senha errada nao entra (401)", s == 401, f"{s} {b}")
s, b = prof.call("POST", "/auth/login", {"email": email("prof"), "senha": SENHA})
check("RF01", "login correto (200)", s == 200, f"{s} {b}")
s, b = prof.call("GET", "/me")
check("RF01", "/me devolve o usuario logado", s == 200 and b.get("email") == email("prof"), f"{s} {b}")
s, b = Client("anon").call("GET", "/turmas")
check("RF01", "rota protegida sem login (401)", s == 401, f"{s} {b}")
check("RF01", "resposta nao vaza senha", "senha" not in json.dumps(b := prof.call("GET", "/me")[1]).lower(), b)
for c in (aluno, intruso, prof2):
    c.call("POST", "/auth/login", {"email": email(c.nome), "senha": SENHA})
tmp = Client("tmp")
tmp.call("POST", "/auth/login", {"email": email("intruso"), "senha": SENHA})
tmp.call("POST", "/auth/logout")
s, _ = tmp.call("GET", "/me")
check("RF01", "logout encerra a sessao (/me 401)", s == 401, s)

# ---------------- RF09 cadastrar turma
print("RF09 Cadastrar turma")
s, turma = prof.call("POST", "/turmas", {"nome": f"Turma {tag}", "disciplina": "Banco de Dados", "semestre": "2026.2", "diasAula": [2, 4], "descricao": "teste"})
check("RF09", "professor cria turma (201)", s == 201, f"{s} {turma}")
tid = turma.get("id") if isinstance(turma, dict) else None
codigo = turma.get("codigo") if isinstance(turma, dict) else None
check("RF09", "gera codigo de entrada", bool(codigo), turma)
check("RF09", "guarda dias de aula", isinstance(turma, dict) and turma.get("diasAula") == [2, 4], turma)
s, b = prof.call("POST", "/turmas", {"nome": "X", "disciplina": "Y", "semestre": "2026-2"})
check("RF09", "semestre invalido recusado (422)", s == 422, f"{s} {b}")
s, b = prof.call("POST", "/turmas", {"disciplina": "Y", "semestre": "2026.2"})
check("RF09", "nome obrigatorio (422)", s == 422, f"{s} {b}")

# ---------------- RF02 inscrever por codigo
print("RF02 Inscrever em turma")
s, b = aluno.call("POST", "/inscricoes", {"codigo": codigo})
check("RF02", "aluno entra pelo codigo (201)", s == 201 and b.get("id") == tid, f"{s} {b}")
s, b = aluno.call("POST", "/inscricoes", {"codigo": codigo})
check("RF02", "inscricao repetida (409)", s == 409, f"{s} {b}")
s, b = intruso.call("POST", "/inscricoes", {"codigo": "ZZZZZZ"})
check("RF02", "codigo inexistente (404)", s == 404, f"{s} {b}")
s, b = prof.call("POST", "/inscricoes", {"codigo": codigo})
check("RF02", "professor nao entra na propria turma (409)", s == 409, f"{s} {b}")
s, b = intruso.call("POST", "/inscricoes", {"codigo": codigo.lower()})
check("RF02", "codigo aceita minusculas", s == 201, f"{s} {b}")

# ---------------- RF03 consultar turma
print("RF03 Consultar turma")
s, lst = aluno.call("GET", "/turmas")
check("RF03", "aluno ve a turma em que entrou", s == 200 and any(t["id"] == tid for t in lst), f"{s} {lst}")
s, det = aluno.call("GET", "/turmas/" + str(tid))
check("RF03", "detalhe da turma (200)", s == 200 and det.get("nome") == turma.get("nome"), f"{s} {det}")
check("RF03", "aluno nao ve o codigo de entrada", s == 200 and not det.get("codigo"), det)
s, b = prof2.call("GET", "/turmas/" + str(tid))
check("RF03", "quem nao e da turma nao ve (403/404)", s in (403, 404), f"{s} {b}")
s, lst2 = prof2.call("GET", "/turmas")
check("RF03", "lista de outro usuario nao mostra a turma", s == 200 and not any(t["id"] == tid for t in lst2), f"{s}")

# ---------------- RF10 cadastrar atividade
print("RF10 Cadastrar atividade")
tipos = [("PROVA", timedelta(days=3)), ("LISTA_DE_EXERCICIO", timedelta(days=1)), ("PROJETO_INDIVIDUAL", timedelta(days=7))]
ativ = {}
for tipo, delta in tipos:
    s, a = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"{tipo} {tag}", "descricao": "d", "tipo": tipo, "prazoFinal": iso(delta), "disponivelEm": iso(timedelta(hours=-1))})
    check("RF10", f"cria atividade {tipo} (201)", s == 201, f"{s} {a}")
    ativ[tipo] = a.get("id") if isinstance(a, dict) else None
s, b = aluno.call("POST", f"/turmas/{tid}/atividades", {"nome": "x", "tipo": "PROVA", "prazoFinal": iso(timedelta(days=1))})
check("RF10", "aluno nao cria atividade (403)", s == 403, f"{s} {b}")
s, b = prof2.call("POST", f"/turmas/{tid}/atividades", {"nome": "x", "tipo": "PROVA", "prazoFinal": iso(timedelta(days=1))})
check("RF10", "professor de outra turma nao cria (403/404)", s in (403, 404), f"{s} {b}")
s, b = prof.call("POST", f"/turmas/{tid}/atividades", {"tipo": "PROVA", "prazoFinal": iso(timedelta(days=1))})
check("RF10", "nome obrigatorio (422)", s == 422, f"{s} {b}")
s, b = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": "x", "tipo": "INEXISTENTE", "prazoFinal": iso(timedelta(days=1))})
check("RF10", "tipo invalido recusado (4xx)", 400 <= s < 500, f"{s} {b}")
s, b = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": "x", "tipo": "PROVA", "prazoFinal": iso(timedelta(days=1)), "disponivelEm": iso(timedelta(days=2))})
check("RF10", "disponivel depois do prazo recusado (422)", s == 422, f"{s} {b}")

# ---------------- RF05 acessar e organizar atividades
print("RF05 Acessar e organizar atividades")
s, todas = aluno.call("GET", "/atividades")
mine = [a for a in todas if a["turmaId"] == tid] if s == 200 else []
check("RF05", "aluno ve as atividades das turmas dele", len(mine) == 3, f"{s} {len(mine)}")
s, asc = aluno.call("GET", "/atividades?ordenar=prazo&direcao=asc")
prazos = [a["prazoFinal"] for a in asc if a["turmaId"] == tid] if s == 200 else []
check("RF05", "ordena por prazo crescente", prazos == sorted(prazos) and len(prazos) == 3, prazos)
s, desc = aluno.call("GET", "/atividades?ordenar=prazo&direcao=desc")
prazos = [a["prazoFinal"] for a in desc if a["turmaId"] == tid] if s == 200 else []
check("RF05", "ordena por prazo decrescente", prazos == sorted(prazos, reverse=True) and len(prazos) == 3, prazos)
s, f = aluno.call("GET", "/atividades?tipo=PROVA")
check("RF05", "filtra por tipo", s == 200 and f and all(a["tipo"] == "PROVA" for a in f), f"{s} {f}")
s, f = aluno.call("GET", f"/atividades?turmaId={tid}")
check("RF05", "filtra por turma", s == 200 and len(f) == 3 and all(a["turmaId"] == tid for a in f), f"{s} {len(f) if isinstance(f, list) else f}")
s, f = aluno.call("GET", "/atividades?estado=PENDENTE")
check("RF05", "filtra por estado PENDENTE", s == 200 and len([a for a in f if a["turmaId"] == tid]) == 3 and all(a["estado"] == "PENDENTE" for a in f), f"{s}")
s, f = aluno.call("GET", "/atividades?estado=ATRASADA")
check("RF05", "estado ATRASADA nao traz as de prazo futuro", s == 200 and not [a for a in f if a["turmaId"] == tid], f"{s}")
s, f = aluno.call("GET", f"/turmas/{tid}/atividades?tipo=LISTA_DE_EXERCICIO&ordenar=prazo")
check("RF05", "filtros tambem na lista da turma", s == 200 and len(f) == 1 and f[0]["tipo"] == "LISTA_DE_EXERCICIO", f"{s} {f}")
s, f = aluno.call("GET", "/atividades?estado=INVALIDO")
check("RF05", "estado invalido recusado (4xx)", 400 <= s < 500, f"{s} {f}")
s, f = prof2.call("GET", "/atividades")
check("RF05", "outro usuario nao ve atividades alheias", s == 200 and not [a for a in f if a["turmaId"] == tid], f"{s}")
s, d = aluno.call("GET", f"/atividades/{ativ['PROVA']}")
check("RF05", "detalhe da atividade (200)", s == 200, f"{s} {d}")
s, d = prof2.call("GET", f"/atividades/{ativ['PROVA']}")
check("RF05", "detalhe de turma alheia (403/404)", s in (403, 404), f"{s} {d}")

# ---------------- RF04 entregar atividade
print("RF04 Entregar atividade")
A = ativ["LISTA_DE_EXERCICIO"]
pdf = b"%PDF-1.4\n% conteudo de teste P1 " + tag.encode() + b"\n%%EOF"
s, e = aluno.upload(f"/atividades/{A}/entregas", "entrega.pdf", pdf, "application/pdf")
check("RF04", "aluno envia PDF (201)", s == 201, f"{s} {e}")
eid = e.get("id") if isinstance(e, dict) else None
check("RF04", "registra data e hora e nao marca atraso", isinstance(e, dict) and e.get("enviadaEm") and e.get("atrasada") is False, e)
s, d = aluno.call("GET", f"/atividades/{A}")
check("RF04", "estado vira ENTREGUE", s == 200 and d.get("estado") == "ENTREGUE", f"{s} {d.get('estado') if isinstance(d, dict) else d}")
for nome, ct in (("slides.pptx", "application/octet-stream"), ("notas.txt", "text/plain"), ("trabalho.docx", "application/octet-stream")):
    s, b = aluno.upload(f"/atividades/{A}/entregas", nome, b"conteudo " + nome.encode(), ct)
    check("RF04", f"aceita {nome}", s == 201, f"{s} {b}")
s, b = aluno.upload(f"/atividades/{A}/entregas", "virus.exe", b"MZ", "application/octet-stream")
check("RF04", "recusa .exe (415)", s == 415, f"{s} {b}")
s, b = aluno.upload(f"/atividades/{A}/entregas", "grande.pdf", b"0" * (26 * 1024 * 1024), "application/pdf")
check("RF04", "recusa mais de 25 MB (413, ou conexao fechada pelo nginx)", s in (413, 0), f"{s} {str(b)[:120]}")
s, b = aluno.upload(f"/atividades/{A}/entregas", "vazio.pdf", b"", "application/pdf")
check("RF04", "recusa arquivo vazio (422)", s == 422, f"{s} {b}")
s, b = prof.upload(f"/atividades/{A}/entregas", "prof.pdf", pdf, "application/pdf")
check("RF04", "dono da turma nao entrega (403)", s == 403, f"{s} {b}")
s, b = prof2.upload(f"/atividades/{A}/entregas", "x.pdf", pdf, "application/pdf")
check("RF04", "quem nao e da turma nao entrega (403/404)", s in (403, 404), f"{s} {b}")
s, b = Client("anon").upload(f"/atividades/{A}/entregas", "x.pdf", pdf, "application/pdf")
check("RF04", "sem login nao entrega (401)", s == 401, f"{s} {b}")
# prazo encerrado sem aceitar atraso
s, enc = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Encerrada {tag}", "tipo": "PROVA", "prazoFinal": iso(timedelta(seconds=2)), "disponivelEm": iso(timedelta(hours=-1)), "aceitaAtraso": False})
import time; time.sleep(3.5)
s, b = aluno.upload(f"/atividades/{enc.get('id')}/entregas", "tarde.pdf", pdf, "application/pdf")
check("RF04", "prazo encerrado sem aceitar atraso (403)", s == 403, f"{s} {b}")
s, ok = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Atraso ok {tag}", "tipo": "PROVA", "prazoFinal": iso(timedelta(seconds=2)), "disponivelEm": iso(timedelta(hours=-1)), "aceitaAtraso": True})
time.sleep(3.5)
s, b = aluno.upload(f"/atividades/{ok.get('id')}/entregas", "tarde.pdf", pdf, "application/pdf")
check("RF04", "aceitando atraso, entrega e marcada atrasada", s == 201 and b.get("atrasada") is True, f"{s} {b}")
s, d = aluno.call("GET", f"/atividades/{ok.get('id')}")
check("RF04", "estado vira ENTREGUE_COM_ATRASO", s == 200 and d.get("estado") == "ENTREGUE_COM_ATRASO", f"{s} {d.get('estado') if isinstance(d, dict) else d}")

# ---------------- RF16 acessar e baixar entregas
print("RF16 Acessar e baixar entregas")
s, ents = prof.call("GET", f"/atividades/{A}/entregas")
check("RF16", "professor lista as entregas (200)", s == 200 and len(ents) >= 1, f"{s} {ents}")
eid = ents[0]["id"] if s == 200 and ents else eid
s, body = prof.call("GET", f"/entregas/{eid}/arquivo")
baixado = body if isinstance(body, bytes) else json.dumps(body).encode()
check("RF16", "professor baixa o arquivo (200)", s == 200 and len(baixado) > 0, f"{s}")
s, b = aluno.call("GET", f"/atividades/{A}/entregas")
check("RF16", "aluno nao lista entregas (403)", s == 403, f"{s} {b}")
s, b = aluno.call("GET", f"/entregas/{eid}/arquivo")
check("RF16", "o proprio aluno baixa a sua entrega (200)", s == 200, f"{s} {b}")
s, b = intruso.call("GET", f"/entregas/{eid}/arquivo")
check("RF16", "OUTRO aluno da mesma turma nao baixa (403)", s == 403, f"{s} {b}")
s, b = intruso.call("GET", f"/atividades/{A}/entregas")
check("RF16", "outro aluno nao lista entregas (403)", s == 403, f"{s} {b}")
s, b = intruso.call("PUT", f"/entregas/{eid}/avaliacao", {"nota": 0})
check("RF15", "outro aluno nao avalia (403)", s == 403, f"{s} {b}")
s, b = prof2.call("GET", f"/atividades/{A}/entregas")
check("RF16", "professor de outra turma nao lista (403/404)", s in (403, 404), f"{s} {b}")
s, b = prof2.call("GET", f"/entregas/{eid}/arquivo")
check("RF16", "professor de outra turma nao baixa (403/404)", s in (403, 404), f"{s} {b}")
s, b = prof.call("GET", f"/entregas/{uuid.uuid4()}/arquivo")
check("RF16", "entrega inexistente (404)", s == 404, f"{s} {b}")

# ---------------- RF15 avaliar entrega
print("RF15 Avaliar entrega")
s, av = prof.call("PUT", f"/entregas/{eid}/avaliacao", {"nota": 8.5, "comentarioPrivado": "Bom trabalho"})
check("RF15", "professor avalia com nota e comentario (200)", s == 200 and av.get("nota") == 8.5 and av.get("comentarioPrivado") == "Bom trabalho", f"{s} {av}")
for ruim in (11, -1):
    s, b = prof.call("PUT", f"/entregas/{eid}/avaliacao", {"nota": ruim})
    check("RF15", f"nota {ruim} recusada (422)", s == 422, f"{s} {b}")
s, b = prof.call("PUT", f"/entregas/{eid}/avaliacao", {})
check("RF15", "nota obrigatoria (422)", s == 422, f"{s} {b}")
s, b = aluno.call("PUT", f"/entregas/{eid}/avaliacao", {"nota": 10})
check("RF15", "aluno nao avalia (403)", s == 403, f"{s} {b}")
s, b = prof2.call("PUT", f"/entregas/{eid}/avaliacao", {"nota": 10})
check("RF15", "professor de outra turma nao avalia (403/404)", s in (403, 404), f"{s} {b}")
s, d = aluno.call("GET", f"/atividades/{A}")
check("RF15", "aluno ve a propria nota e estado CONCLUIDA", s == 200 and d.get("estado") == "CONCLUIDA" and (d.get("nota") == 8.5 or (d.get("entrega") or {}).get("nota") == 8.5), f"{s} {json.dumps(d)[:300]}")
s, b = aluno.upload(f"/atividades/{A}/entregas", "depois.pdf", pdf, "application/pdf")
check("RF15", "entrega avaliada nao aceita novo envio (409)", s == 409, f"{s} {b}")

# ---------------- RF13/RF14 avisos e comentarios (fora da lista P1, mas ja no front)
print("RF13/RF14 Avisos e comentarios")
s, av = prof.call("POST", f"/turmas/{tid}/avisos", {"texto": f"Aviso {tag}"})
check("RF13", "professor publica aviso (201)", s == 201, f"{s} {av}")
s, b = aluno.call("POST", f"/turmas/{tid}/avisos", {"texto": "x"})
check("RF13", "aluno nao publica aviso (403)", s == 403, f"{s} {b}")
s, b = prof.call("POST", f"/turmas/{tid}/avisos", {"texto": "  "})
check("RF13", "aviso vazio recusado (422)", s == 422, f"{s} {b}")
s, lst = aluno.call("GET", f"/turmas/{tid}/avisos")
check("RF13", "aluno ve o aviso", s == 200 and any(a.get("id") == av.get("id") for a in lst), f"{s}")
s, b = prof2.call("GET", f"/turmas/{tid}/avisos")
check("RF13", "quem nao e da turma nao ve avisos (403/404)", s in (403, 404), f"{s} {b}")
aid = av.get("id") if isinstance(av, dict) else None
s, c1 = aluno.call("POST", f"/avisos/{aid}/comentarios", {"texto": "Duvida do aluno"})
check("RF14", "aluno comenta (201)", s == 201, f"{s} {c1}")
s, c2 = prof.call("POST", f"/avisos/{aid}/comentarios", {"texto": "Resposta do professor"})
check("RF14", "professor responde (201)", s == 201, f"{s} {c2}")
s, b = prof2.call("POST", f"/avisos/{aid}/comentarios", {"texto": "intruso"})
check("RF14", "quem nao e da turma nao comenta (403/404)", s in (403, 404), f"{s} {b}")
s, b = aluno.call("POST", f"/avisos/{aid}/comentarios", {"texto": ""})
check("RF14", "comentario vazio recusado (422)", s == 422, f"{s} {b}")
s, lst = prof.call("GET", f"/avisos/{aid}/comentarios")
check("RF14", "lista os dois comentarios", s == 200 and len(lst) == 2, f"{s} {lst}")

# ---------------- itens alem da P1: sair da turma, editar atividade, sem entrega, resposta a comentario, hash
print("Alem da P1: RF03b, RF11, RF14b, sem-entrega, hash SHA-256")
saidor = Client("saidor")
saidor.call("POST", "/auth/register", {"nome": "Saidor", "email": email("saidor"), "senha": SENHA})
saidor.call("POST", "/inscricoes", {"codigo": codigo})
s, _ = saidor.call("DELETE", f"/turmas/{tid}/inscricao")
check("RF03b", "aluno sai da turma (204)", s == 204, s)
s, _ = saidor.call("GET", f"/turmas/{tid}")
check("RF03b", "depois de sair nao ve mais a turma (404)", s == 404, s)
s, _ = saidor.call("DELETE", f"/turmas/{tid}/inscricao")
check("RF03b", "sair de turma em que nao esta (404)", s == 404, s)
s, _ = prof.call("DELETE", f"/turmas/{tid}/inscricao")
check("RF03b", "professor nao sai da propria turma (409)", s == 409, s)
s, b = saidor.call("POST", "/inscricoes", {"codigo": codigo})
check("RF03b", "pode entrar de novo pelo codigo (201)", s == 201, f"{s} {b}")

s, b = prof.call("PUT", f"/atividades/{A}", {"nome": f"Lista editada {tag}", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=3)), "descricao": "nova descricao", "aceitaAtraso": False})
check("RF11", "professor edita a atividade (200)", s == 200 and b.get("nome") == f"Lista editada {tag}" and b.get("aceitaAtraso") is False, f"{s} {b}")
s, d = aluno.call("GET", f"/atividades/{A}")
check("RF11", "a edicao aparece para o aluno", s == 200 and d.get("nome") == f"Lista editada {tag}" and d.get("descricao") == "nova descricao", f"{s} {d}")
s, b = aluno.call("PUT", f"/atividades/{A}", {"nome": "x", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=3))})
check("RF11", "aluno nao edita atividade (403)", s == 403, f"{s} {b}")
s, b = prof2.call("PUT", f"/atividades/{A}", {"nome": "x", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=3))})
check("RF11", "professor de outra turma nao edita (403)", s == 403, f"{s} {b}")
s, b = prof.call("PUT", f"/atividades/{A}", {"nome": "x", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=-30))})
check("RF11", "prazo antes da disponibilidade recusado (422)", s == 422, f"{s} {b}")
s, b = prof.call("PUT", f"/atividades/{A}", {"nome": "", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=3))})
check("RF11", "nome vazio recusado (422)", s == 422, f"{s} {b}")
s, b = prof.call("PUT", f"/atividades/{uuid.uuid4()}", {"nome": "x", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=3))})
check("RF11", "atividade inexistente (404)", s == 404, f"{s} {b}")

s, sem = prof.call("GET", f"/atividades/{A}/sem-entrega")
nomes = [x.get("nome") for x in sem] if s == 200 else []
check("RF16", "lista de quem nao entregou traz o inscrito sem entrega", s == 200 and "Teste intruso" in nomes and "Saidor" in nomes, f"{s} {sem}")
check("RF16", "lista de quem nao entregou nao traz quem entregou", s == 200 and "Teste aluno" not in nomes, nomes)
s, b = aluno.call("GET", f"/atividades/{A}/sem-entrega")
check("RF16", "aluno nao ve quem nao entregou (403)", s == 403, f"{s} {b}")

s, ents = prof.call("GET", f"/atividades/{A}/entregas")
_, corpo = prof.call("GET", f"/entregas/{ents[0]['id']}/arquivo")
check("RNF02", "a entrega guarda o SHA-256 do arquivo e ele confere com o download", s == 200 and isinstance(corpo, bytes) and ents[0].get("hashSha256") == hashlib.sha256(corpo).hexdigest(), f"{s} {ents[:1]}")

s, pai = prof.call("POST", f"/avisos/{aid}/comentarios", {"texto": "Pergunta de debate"})
s, r1 = aluno.call("POST", f"/avisos/{aid}/comentarios", {"texto": "Resposta 1", "comentarioPaiId": pai.get("id")})
check("RF14b", "aluno responde a um comentario (201, com o pai)", s == 201 and r1.get("comentarioPaiId") == pai.get("id"), f"{s} {r1}")
s, r2 = prof.call("POST", f"/avisos/{aid}/comentarios", {"texto": "Resposta a resposta", "comentarioPaiId": r1.get("id")})
check("RF14b", "resposta a uma resposta fica sob o comentario original", s == 201 and r2.get("comentarioPaiId") == pai.get("id"), f"{s} {r2}")
s, b = aluno.call("POST", f"/avisos/{aid}/comentarios", {"texto": "x", "comentarioPaiId": str(uuid.uuid4())})
check("RF14b", "comentario pai inexistente recusado (422)", s == 422, f"{s} {b}")
s, lst = aluno.call("GET", f"/turmas/{tid}/avisos")
com = next((a["comentarios"] for a in lst if a["id"] == aid), [])
check("RF14b", "o mural devolve o vinculo das respostas", any(c.get("comentarioPaiId") == pai.get("id") for c in com), com)

# ---------------- RF14a comentarios em atividade
print("RF14a Comentarios em atividade")
s, lst = aluno.call("GET", f"/atividades/{A}/comentarios")
check("RF14a", "lista de comentarios da atividade comeca vazia (200)", s == 200 and lst == [], f"{s} {lst}")
s, ca = aluno.call("POST", f"/atividades/{A}/comentarios", {"texto": "Duvida sobre a atividade"})
check("RF14a", "aluno comenta na atividade (201, com atividadeId)", s == 201 and ca.get("atividadeId") == A and ca.get("avisoId") is None, f"{s} {ca}")
s, cb = prof.call("POST", f"/atividades/{A}/comentarios", {"texto": "Resposta do professor", "comentarioPaiId": ca.get("id")})
check("RF14a", "professor responde na atividade (201, com o pai)", s == 201 and cb.get("comentarioPaiId") == ca.get("id"), f"{s} {cb}")
s, cc = aluno.call("POST", f"/atividades/{A}/comentarios", {"texto": "Aluno responde ao professor", "comentarioPaiId": cb.get("id")})
check("RF14a", "resposta a uma resposta fica sob o comentario original", s == 201 and cc.get("comentarioPaiId") == ca.get("id"), f"{s} {cc}")
s, cd = prof.call("POST", f"/atividades/{A}/comentarios", {"texto": "Comentario do professor"})
check("RF14a", "professor comenta sem pai (201)", s == 201 and cd.get("comentarioPaiId") is None, f"{s} {cd}")
s, lst = prof.call("GET", f"/atividades/{A}/comentarios")
check("RF14a", "lista os quatro comentarios em ordem", s == 200 and [c.get("id") for c in lst] == [ca["id"], cb["id"], cc["id"], cd["id"]], f"{s} {lst}")
s, b = prof2.call("GET", f"/atividades/{A}/comentarios")
check("RF14a", "quem nao e da turma nao lista (404)", s == 404, f"{s} {b}")
s, b = prof2.call("POST", f"/atividades/{A}/comentarios", {"texto": "intruso"})
check("RF14a", "quem nao e da turma nao comenta (404)", s == 404, f"{s} {b}")
s, b = aluno.call("POST", f"/atividades/{A}/comentarios", {"texto": "  "})
check("RF14a", "comentario vazio recusado (422)", s == 422, f"{s} {b}")
s, b = aluno.call("POST", f"/atividades/{A}/comentarios", {"texto": "x", "comentarioPaiId": str(uuid.uuid4())})
check("RF14a", "pai inexistente recusado (422)", s == 422, f"{s} {b}")
s, b = aluno.call("POST", f"/atividades/{A}/comentarios", {"texto": "x", "comentarioPaiId": pai.get("id")})
check("RF14a", "pai de um aviso nao vale na atividade (422)", s == 422, f"{s} {b}")
outra = ativ["PROVA"]
s, b = aluno.call("POST", f"/atividades/{outra}/comentarios", {"texto": "x", "comentarioPaiId": ca.get("id")})
check("RF14a", "pai de outra atividade recusado (422)", s == 422, f"{s} {b}")
s, futura = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Futura {tag}", "tipo": "PROVA", "prazoFinal": iso(timedelta(days=9)), "disponivelEm": iso(timedelta(days=2))})
FUT = futura.get("id") if isinstance(futura, dict) else None
s, b = prof.call("POST", f"/atividades/{FUT}/comentarios", {"texto": "Professor comenta antes de abrir"})
check("RF14a", "professor comenta em atividade ainda fechada (201)", s == 201, f"{s} {b}")
s, b = aluno.call("GET", f"/atividades/{FUT}/comentarios")
check("RF14a", "aluno nao lista comentarios de atividade fechada (404)", s == 404, f"{s} {b}")
s, b = aluno.call("POST", f"/atividades/{FUT}/comentarios", {"texto": "x"})
check("RF14a", "aluno nao comenta em atividade fechada (404)", s == 404, f"{s} {b}")
s, b = aluno.call("POST", f"/avisos/{aid}/comentarios", {"texto": "x", "comentarioPaiId": ca.get("id")})
check("RF14a", "pai de uma atividade nao vale no aviso (422)", s == 422, f"{s} {b}")
s, lst = aluno.call("GET", f"/turmas/{tid}/avisos")
com = next((a["comentarios"] for a in lst if a["id"] == aid), [])
check("RF14a", "o mural nao mistura comentarios de atividade", all(c.get("atividadeId") is None and c.get("avisoId") == aid for c in com), com)

# ---------------- RF17 notificacoes: leitura, atividade nova, prazo proximo
print("RF17 Notificacoes")


def notif(c):
    s_, b_ = c.call("GET", "/notificacoes")
    return s_, (b_ if s_ == 200 and isinstance(b_, dict) else {"naoLidas": -1, "itens": [], "prazosProximos": []})


def do_tipo(b_, tipo, atividade_id):
    return [i for i in b_["itens"] if i.get("tipo") == tipo and i.get("atividadeId") == atividade_id]


s, b = Client("anon").call("GET", "/notificacoes")
check("RF17", "sem sessao nao le notificacoes (401)", s == 401, f"{s} {b}")
leaver = Client("leaver")
leaver.call("POST", "/auth/register", {"nome": "Leaver", "email": email("leaver"), "senha": SENHA})
leaver.call("POST", "/inscricoes", {"codigo": codigo})
s, N = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Notif prazo curto {tag}", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(hours=24))})
s, L = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Notif prazo longo {tag}", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=5))})
s, F2 = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Notif ainda fechada {tag}", "tipo": "PROVA", "prazoFinal": iso(timedelta(hours=20)), "disponivelEm": iso(timedelta(hours=1))})
N, L, F2 = N.get("id"), L.get("id"), F2.get("id")

# varias chamadas simultaneas de um aluno que ainda nao abriu o sino: nada de duplicata
with ThreadPoolExecutor(max_workers=4) as pool:
    resp = list(pool.map(lambda _: intruso.call("GET", "/notificacoes"), range(4)))
check("RF17", "chamadas simultaneas respondem 200", all(r[0] == 200 for r in resp), [r[0] for r in resp])
s, bi = notif(intruso)
check("RF17", "chamadas simultaneas nao duplicam a atividade nova", len(do_tipo(bi, "ATIVIDADE_NOVA", N)) == 1, bi["itens"])

s, ba = notif(aluno)
check("RF17", "aluno recebe uma atividade nova quando ela abre (200)", s == 200 and len(do_tipo(ba, "ATIVIDADE_NOVA", N)) == 1 and len(do_tipo(ba, "ATIVIDADE_NOVA", L)) == 1, f"{s} {ba}")
check("RF17", "atividade ainda fechada nao gera atividade nova", not do_tipo(ba, "ATIVIDADE_NOVA", F2) and not do_tipo(ba, "ATIVIDADE_NOVA", FUT), ba["itens"])
novo = do_tipo(ba, "ATIVIDADE_NOVA", N)[0] if do_tipo(ba, "ATIVIDADE_NOVA", N) else {}
check("RF17", "a notificacao traz turma, atividade e texto, nao lida", novo.get("turmaId") == tid and novo.get("lida") is False and novo.get("texto") and novo.get("paraProfessor") is False, novo)
s, bp = notif(prof)
check("RF17", "professor nao recebe atividade nova", s == 200 and not [i for i in bp["itens"] if i.get("tipo") == "ATIVIDADE_NOVA"], bp["itens"])
check("RF17", "o contador conta as nao lidas", ba["naoLidas"] == sum(1 for i in ba["itens"] if not i["lida"]) and ba["naoLidas"] >= 2, ba["naoLidas"])

ids_prazo = [i["id"] for i in ba["prazosProximos"]]
check("RF17", "prazo em 24 h aparece como prazo proximo", f"prazo-{N}" in ids_prazo, ba["prazosProximos"])
check("RF17", "prazo em 5 dias e atividade fechada nao aparecem", f"prazo-{L}" not in ids_prazo and f"prazo-{F2}" not in ids_prazo, ids_prazo)
check("RF17", "prazo proximo nao conta como nao lida", all(i["id"].startswith("prazo-") and i["tipo"] == "PRAZO_PROXIMO" for i in ba["prazosProximos"]) and ba["naoLidas"] == sum(1 for i in ba["itens"] if not i["lida"]), ba["prazosProximos"])
s, e = aluno.upload(f"/atividades/{N}/entregas", "entrega.pdf", pdf, "application/pdf")
s, ba2 = notif(aluno)
check("RF17", "entregou: o prazo proximo some", s == 200 and f"prazo-{N}" not in [i["id"] for i in ba2["prazosProximos"]], ba2["prazosProximos"])

nao_lidas = [i for i in ba["itens"] if not i["lida"]]
alvo = nao_lidas[0]["id"]
s, _ = aluno.call("POST", f"/notificacoes/{alvo}/lida")
s2, bl = notif(aluno)
check("RF17", "marcar como lida (204) baixa o contador em 1", s == 204 and bl["naoLidas"] == ba["naoLidas"] - 1, f"{s} {bl['naoLidas']} {ba['naoLidas']}")
s, _ = aluno.call("POST", f"/notificacoes/{alvo}/lida")
check("RF17", "marcar de novo e idempotente (204)", s == 204, s)
outro = nao_lidas[1]["id"]
s, b = prof2.call("POST", f"/notificacoes/{outro}/lida")
s2, bl2 = notif(aluno)
check("RF17", "marcar a notificacao de outro usuario da 404 e nao a altera", s == 404 and bl2["naoLidas"] == bl["naoLidas"], f"{s} {bl2['naoLidas']} {bl['naoLidas']}")
s, b = aluno.call("POST", f"/notificacoes/{uuid.uuid4()}/lida")
check("RF17", "notificacao inexistente da 404", s == 404, f"{s} {b}")
s, _ = aluno.call("POST", "/notificacoes/lidas")
s2, bl3 = notif(aluno)
check("RF17", "marcar todas como lidas (204) zera o contador", s == 204 and bl3["naoLidas"] == 0, f"{s} {bl3['naoLidas']}")

s, bv = notif(leaver)
check("RF17", "quem entrou na turma recebe as atividades abertas depois da inscricao", len(do_tipo(bv, "ATIVIDADE_NOVA", N)) == 1 and bv["naoLidas"] >= 2, bv)
leaver.call("DELETE", f"/turmas/{tid}/inscricao")
s, bv2 = notif(leaver)
check("RF17", "quem saiu da turma nao ve mais notificacoes nem prazos dela", s == 200 and not [i for i in bv2["itens"] if i.get("turmaId") == tid] and not bv2["prazosProximos"] and bv2["naoLidas"] == 0, bv2)

# ---------------- RF17 notificacoes geradas pelos eventos
print("RF17 Notificacoes dos eventos")
EN = e.get("id") if isinstance(e, dict) else None


def tipos(c, tipo, **campos):
    _, b_ = notif(c)
    return [i for i in b_["itens"] if i.get("tipo") == tipo and all(i.get(k) == v for k, v in campos.items())]


s, av2 = prof.call("POST", f"/turmas/{tid}/avisos", {"texto": f"Aviso das notificacoes {tag}"})
AV2 = av2.get("id")
check("RF17", "aviso novo notifica os alunos da turma", len(tipos(aluno, "AVISO_NOVO", avisoId=AV2)) == 1 and len(tipos(intruso, "AVISO_NOVO", avisoId=AV2)) == 1, notif(aluno)[1]["itens"][:2])
check("RF17", "aviso novo nao notifica o proprio professor", not tipos(prof, "AVISO_NOVO", avisoId=AV2), notif(prof)[1]["itens"][:2])
check("RF17", "quem saiu da turma nao e notificado do aviso", not tipos(leaver, "AVISO_NOVO", avisoId=AV2), notif(leaver)[1]["itens"])

edicao = {"nome": f"Notif longo editado {tag}", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=6))}
s, b = prof.call("PUT", f"/atividades/{L}", edicao)
check("RF17", "editar atividade aberta notifica os alunos (ATIVIDADE_ALTERADA)", s == 200 and len(tipos(aluno, "ATIVIDADE_ALTERADA", atividadeId=L)) == 1, f"{s} {b}")
prof.call("PUT", f"/atividades/{L}", edicao)
check("RF17", "salvar de novo sem mudar nada nao notifica outra vez", len(tipos(aluno, "ATIVIDADE_ALTERADA", atividadeId=L)) == 1, tipos(aluno, "ATIVIDADE_ALTERADA", atividadeId=L))
check("RF17", "o professor nao e notificado da propria edicao", not tipos(prof, "ATIVIDADE_ALTERADA"), notif(prof)[1]["itens"][:2])
prof.call("PUT", f"/atividades/{F2}", {"nome": f"Notif fechada editada {tag}", "tipo": "PROVA", "prazoFinal": iso(timedelta(hours=21)), "disponivelEm": iso(timedelta(hours=1))})
check("RF17", "editar atividade ainda fechada nao notifica", not tipos(aluno, "ATIVIDADE_ALTERADA", atividadeId=F2), notif(aluno)[1]["itens"][:3])

s, b = prof.call("PUT", f"/entregas/{EN}/avaliacao", {"nota": 7})
check("RF17", "publicar nota notifica o aluno da entrega", s == 200 and len(tipos(aluno, "NOTA_PUBLICADA", atividadeId=N)) == 1, f"{s} {b}")
check("RF17", "so o aluno da entrega e notificado da nota", not tipos(intruso, "NOTA_PUBLICADA") and not tipos(prof, "NOTA_PUBLICADA"), "")
prof.call("PUT", f"/entregas/{EN}/avaliacao", {"nota": 8})
check("RF17", "reavaliar notifica de novo", len(tipos(aluno, "NOTA_PUBLICADA", atividadeId=N)) == 2, tipos(aluno, "NOTA_PUBLICADA", atividadeId=N))

s, ra = aluno.call("POST", f"/atividades/{L}/comentarios", {"texto": "Duvida que notifica"})
t_prof = tipos(prof, "COMENTARIO_NOVO", atividadeId=L)
check("RF17", "aluno comenta na atividade: o professor e notificado (paraProfessor)", len(t_prof) == 1 and t_prof[0].get("paraProfessor") is True and t_prof[0].get("avisoId") is None, t_prof)
check("RF17", "o autor do comentario nao e notificado", not tipos(aluno, "COMENTARIO_NOVO") and not tipos(aluno, "RESPOSTA_NOVA", atividadeId=L), "")
s, rb = prof.call("POST", f"/atividades/{L}/comentarios", {"texto": "Resposta que notifica", "comentarioPaiId": ra.get("id")})
check("RF17", "professor responde: o autor do comentario e notificado", len(tipos(aluno, "RESPOSTA_NOVA", atividadeId=L)) == 1 and not tipos(prof, "RESPOSTA_NOVA", atividadeId=L), tipos(aluno, "RESPOSTA_NOVA", atividadeId=L))
n_antes = len(notif(aluno)[1]["itens"]), len(notif(intruso)[1]["itens"])
prof.call("POST", f"/atividades/{L}/comentarios", {"texto": "Comentario solto do professor"})
check("RF17", "comentario do professor sem pai nao notifica ninguem", (len(notif(aluno)[1]["itens"]), len(notif(intruso)[1]["itens"])) == n_antes, n_antes)
s, rc = prof.call("POST", f"/atividades/{L}/comentarios", {"texto": "Pergunta do professor"})
s, rd = aluno.call("POST", f"/atividades/{L}/comentarios", {"texto": "Aluno responde ao professor", "comentarioPaiId": rc.get("id")})
t_resp = tipos(prof, "RESPOSTA_NOVA", atividadeId=L)
check("RF17", "aluno responde ao professor: o professor e notificado (paraProfessor)", len(t_resp) == 1 and t_resp[0].get("paraProfessor") is True, t_resp)
s, rv = aluno.call("POST", f"/avisos/{AV2}/comentarios", {"texto": "Duvida no mural"})
t_av = tipos(prof, "COMENTARIO_NOVO", avisoId=AV2)
check("RF17", "comentario de aluno no mural notifica o professor (com avisoId)", len(t_av) == 1 and t_av[0].get("atividadeId") is None, t_av)

# mais de 50 notificacoes: a lista corta em 50, o contador conta todas as nao lidas
for k in range(52):
    prof.call("POST", f"/turmas/{tid}/avisos", {"texto": f"Aviso em massa {k} {tag}"})
s, bm = notif(intruso)
check("RF17", "a lista corta em 50 itens e o contador conta todas as nao lidas", s == 200 and len(bm["itens"]) == 50 and bm["naoLidas"] > 50, f"{s} itens={len(bm['itens'])} naoLidas={bm['naoLidas']}")

# ---------------- integridade: envios simultaneos do mesmo aluno
print("Integridade das entregas (RNF02): envios simultaneos")
s, conc = prof.call("POST", f"/turmas/{tid}/atividades", {"nome": f"Concorrencia {tag}", "tipo": "LISTA_DE_EXERCICIO", "prazoFinal": iso(timedelta(days=2)), "disponivelEm": iso(timedelta(hours=-1))})
cid = conc.get("id")
eu = intruso.call("GET", "/me")[1].get("id")
N = 8
with ThreadPoolExecutor(max_workers=N) as pool:
    codigos = list(pool.map(lambda i: intruso.upload(f"/atividades/{cid}/entregas", f"simultaneo{i}.pdf", pdf + str(i).encode(), "application/pdf")[0], range(N)))
check("RNF02", f"{N} envios simultaneos nao geram erro 5xx", all(c < 500 for c in codigos), codigos)
s, ents = prof.call("GET", f"/atividades/{cid}/entregas")
do_aluno = [e for e in ents if e.get("alunoId") == eu] if s == 200 else []
check("RNF02", "existe UMA unica entrega do aluno na atividade", len(do_aluno) == 1, f"{len(do_aluno)} entregas; codigos={codigos}")

# ---------------- origem das requisicoes (defesa extra contra CSRF)
print("Origem das requisicoes (CSRF)")
mesma = "/".join(BASE.split("/")[:3])
s, b = aluno.call("POST", "/inscricoes", {"codigo": "ZZZZZZ"}, extra={"Origin": "https://site-malicioso.example"})
check("CSRF", "POST com Origin de outro site e bloqueado (403)", s == 403, f"{s} {b}")
s, b = aluno.call("POST", "/inscricoes", {"codigo": "ZZZZZZ"}, extra={"Origin": mesma})
check("CSRF", "POST com a propria origem chega ao servico (404 do codigo)", s == 404, f"{s} {b}")
s, b = aluno.call("POST", "/inscricoes", {"codigo": "ZZZZZZ"})
check("CSRF", "POST sem Origin (cliente nao navegador) passa (404 do codigo)", s == 404, f"{s} {b}")
s, b = aluno.call("GET", "/turmas", extra={"Origin": mesma})
check("CSRF", "GET da propria origem funciona (200)", s == 200, f"{s}")

# ---------------- limite de tentativas de login (RNF de seguranca)
print("Limite de tentativas de login")
alvo = Client("forca-bruta")
codigos = [alvo.call("POST", "/auth/login", {"email": email("inexistente"), "senha": "errada"})[0] for _ in range(5)]
check("SEG", "5 senhas erradas seguidas ainda respondem 401", codigos == [401] * 5, codigos)
s, b = alvo.call("POST", "/auth/login", {"email": email("inexistente"), "senha": "errada"})
check("SEG", "a 6a tentativa para o mesmo e-mail e barrada (429)", s == 429, f"{s} {b}")
check("SEG", "a resposta 429 traz mensagem em portugues", isinstance(b, dict) and "tentativas" in b.get("message", "").lower(), b)
s, _ = Client("outra").call("POST", "/auth/login", {"email": email("prof"), "senha": SENHA})
check("SEG", "o bloqueio de um e-mail nao afeta outras contas", s == 200, s)

# ---------------- RF06, RF07 e RF12 grupos
print("RF06/RF07/RF12 Grupos")
bia, caio = Client("bia"), Client("caio")
ids = {}
for c in (bia, caio):
    s, b = c.call("POST", "/auth/register", {"nome": f"Aluno {c.nome}", "email": email(c.nome), "senha": SENHA})
    ids[c.nome] = b.get("id") if isinstance(b, dict) else None
    c.call("POST", "/inscricoes", {"codigo": codigo})
s, eu = aluno.call("GET", "/me")
ids["aluno"] = eu.get("id")
s, b = aluno.call("GET", f"/turmas/{tid}/alunos")
check("RF06", "lista os colegas da turma para montar o grupo", s == 200 and {ids["aluno"], ids["bia"], ids["caio"]} <= {a["id"] for a in b}, f"{s} {b}")
s, b = prof2.call("GET", f"/turmas/{tid}/alunos")
check("RF06", "quem nao e da turma nao lista os alunos (403)", s == 403, f"{s} {b}")
s, cfg = aluno.call("GET", f"/turmas/{tid}/grupos/configuracao")
check("RF12", "configuracao padrao: 2 a 5, sem limite de grupos", s == 200 and cfg == {"minimoIntegrantes": 2, "maximoIntegrantes": 5, "maximoGrupos": None}, f"{s} {cfg}")
s, b = aluno.call("PUT", f"/turmas/{tid}/grupos/configuracao", {"minimoIntegrantes": 1, "maximoIntegrantes": 3})
check("RF12", "aluno nao configura (403)", s == 403, f"{s} {b}")
s, b = prof.call("PUT", f"/turmas/{tid}/grupos/configuracao", {"minimoIntegrantes": 4, "maximoIntegrantes": 3})
check("RF12", "maximo menor que o minimo e recusado (422)", s == 422, f"{s} {b}")
s, b = aluno.call("POST", f"/turmas/{tid}/grupos", {"nome": "Sozinho", "integrantesIds": []})
check("RF06", "grupo abaixo do minimo e recusado (422)", s == 422, f"{s} {b}")
s, b = prof2.call("POST", f"/turmas/{tid}/grupos", {"nome": "De fora", "integrantesIds": [ids["bia"]]})
check("RF06", "quem nao e da turma nao pede grupo (403)", s == 403, f"{s} {b}")
s, g = aluno.call("POST", f"/turmas/{tid}/grupos", {"nome": f"Time {tag}", "integrantesIds": [ids["bia"]]})
check("RF06", "aluno solicita grupo e ele nasce PENDENTE (201)", s == 201 and g.get("status") == "PENDENTE" and g["integrantes"][0]["id"] == ids["aluno"], f"{s} {g}")
gid = g.get("id")
s, b = bia.call("POST", f"/turmas/{tid}/grupos", {"nome": "Outro", "integrantesIds": [ids["caio"]]})
check("RF06", "aluno ja em grupo nao entra em outro (422)", s == 422, f"{s} {b}")
s, b = caio.call("GET", f"/turmas/{tid}/grupos")
check("RF06", "outro aluno nao ve grupo pendente alheio", s == 200 and all(x["id"] != gid for x in b), f"{s} {b}")
s, b = prof.call("GET", f"/turmas/{tid}/grupos")
check("RF12", "professor ve todos os grupos", s == 200 and any(x["id"] == gid for x in b), f"{s} {b}")
s, b = aluno.call("POST", f"/grupos/{gid}/aprovacao", {"aprovado": True})
check("RF12", "aluno nao aprova (403)", s == 403, f"{s} {b}")
s, b = caio.call("POST", f"/grupos/{gid}/integrantes")
check("RF06", "nao se entra em grupo pendente (422)", s == 422, f"{s} {b}")
s, b = prof.call("POST", f"/grupos/{gid}/aprovacao", {"aprovado": True})
check("RF12", "professor aprova (200 APROVADO)", s == 200 and b.get("status") == "APROVADO", f"{s} {b}")
s, b = prof.call("POST", f"/grupos/{gid}/aprovacao", {"aprovado": False})
check("RF12", "decidir de novo e recusado (409)", s == 409, f"{s} {b}")
s, b = caio.call("GET", f"/turmas/{tid}/grupos")
check("RF06", "grupo aprovado fica visivel para os colegas", s == 200 and any(x["id"] == gid for x in b), f"{s} {b}")
s, b = caio.call("POST", f"/grupos/{gid}/integrantes")
check("RF06", "aluno entra em grupo aprovado com vaga (200)", s == 200 and ids["caio"] in [i["id"] for i in b["integrantes"]], f"{s} {b}")
s, b = caio.call("POST", f"/grupos/{gid}/integrantes")
check("RF06", "nao entra duas vezes (422)", s == 422, f"{s} {b}")
s, b = bia.call("DELETE", f"/grupos/{gid}/integrantes")
check("RF07", "sair com folga acima do minimo (204)", s == 204, f"{s} {b}")
s, b = caio.call("DELETE", f"/grupos/{gid}/integrantes")
check("RF07", "grupo aprovado nao fica abaixo do minimo (422)", s == 422, f"{s} {b}")
prof.call("PUT", f"/turmas/{tid}/grupos/configuracao", {"minimoIntegrantes": 1, "maximoIntegrantes": 5})
s, b = caio.call("DELETE", f"/grupos/{gid}/integrantes")
check("RF07", "com minimo 1 o aluno sai (204)", s == 204, f"{s} {b}")
s, b = aluno.call("DELETE", f"/grupos/{gid}/integrantes")
check("RF07", "o ultimo integrante de grupo aprovado nao sai (422): ficaria abaixo do minimo", s == 422, f"{s} {b}")
s, solo = bia.call("POST", f"/turmas/{tid}/grupos", {"nome": "Pendente solo", "integrantesIds": []})
check("RF06", "com minimo 1 o aluno pede grupo sozinho (201)", s == 201, f"{s} {solo}")
s, b = bia.call("DELETE", f"/grupos/{solo.get('id')}/integrantes")
check("RF07", "sair de grupo pendente e livre (204)", s == 204, f"{s} {b}")
s, b = prof.call("GET", f"/turmas/{tid}/grupos")
check("RF07", "grupo pendente que ficou vazio some da lista", s == 200 and all(x["id"] != solo.get("id") for x in b), f"{s} {b}")
s, g2 = bia.call("POST", f"/turmas/{tid}/grupos", {"nome": "Reprovado", "integrantesIds": []})
s2, b2 = prof.call("POST", f"/grupos/{g2.get('id')}/aprovacao", {"aprovado": False})
check("RF12", "professor reprova (REPROVADO)", s2 == 200 and b2.get("status") == "REPROVADO", f"{s2} {b2}")
s, g3 = bia.call("POST", f"/turmas/{tid}/grupos", {"nome": "De novo", "integrantesIds": []})
check("RF06", "reprovado libera o aluno para pedir outro grupo (201)", s == 201, f"{s} {g3}")

# ---------------- RF06 entrega em nome do grupo (projeto em grupo)
print("RF06 Entrega em grupo")
s, tg = prof.call("POST", "/turmas", {"nome": f"Grupo {tag}", "disciplina": "Projeto", "semestre": "2026.2", "diasAula": [3], "descricao": "entrega em grupo"})
tgid, cod2 = tg.get("id"), tg.get("codigo")
for c in (aluno, bia, caio):
    c.call("POST", "/inscricoes", {"codigo": cod2})
s, pg = prof.call("POST", f"/turmas/{tgid}/atividades", {"nome": f"Projeto {tag}", "descricao": "em grupo", "tipo": "PROJETO_EM_GRUPO", "prazoFinal": iso(timedelta(days=2)), "disponivelEm": iso(timedelta(hours=-1))})
pid = pg.get("id")
pdf_grupo = b"%PDF-1.4 projeto do grupo"
s, b = aluno.upload(f"/atividades/{pid}/entregas", "projeto.pdf", pdf_grupo, "application/pdf")
check("RF06", "sem grupo aprovado nao se entrega projeto em grupo (422)", s == 422, f"{s} {b}")
s, gg = aluno.call("POST", f"/turmas/{tgid}/grupos", {"nome": f"Equipe {tag}", "integrantesIds": [ids["bia"]]})
s, b = bia.upload(f"/atividades/{pid}/entregas", "projeto.pdf", pdf_grupo, "application/pdf")
check("RF06", "grupo pendente tambem nao entrega (422)", s == 422, f"{s} {b}")
prof.call("POST", f"/grupos/{gg.get('id')}/aprovacao", {"aprovado": True})
s, e1 = aluno.upload(f"/atividades/{pid}/entregas", "projeto.pdf", pdf_grupo, "application/pdf")
check("RF06", "integrante do grupo aprovado entrega em nome do grupo (201)", s == 201 and e1.get("grupoId") == gg.get("id") and e1.get("alunoId") == ids["aluno"] and len(e1.get("integrantes", [])) == 2, f"{s} {e1}")
s, d = bia.call("GET", f"/atividades/{pid}")
check("RF06", "o colega de grupo ve a entrega do grupo e o estado ENTREGUE", s == 200 and d.get("estado") == "ENTREGUE" and (d.get("minhaEntrega") or {}).get("grupoNome") == f"Equipe {tag}", f"{s} {d}")
s, d = caio.call("GET", f"/atividades/{pid}")
check("RF06", "quem nao e do grupo continua PENDENTE, sem entrega", s == 200 and d.get("estado") == "PENDENTE" and d.get("minhaEntrega") is None, f"{s} {d}")
s, b = caio.upload(f"/atividades/{pid}/entregas", "projeto.pdf", pdf_grupo, "application/pdf")
check("RF06", "aluno sem grupo aprovado nao entrega (422)", s == 422, f"{s} {b}")
s, e2 = bia.upload(f"/atividades/{pid}/entregas", "projeto-v2.pdf", pdf_grupo + b" v2", "application/pdf")
check("RF06", "outro integrante reenvia e substitui o arquivo (201, mesma entrega)", s == 201 and e2.get("id") == e1.get("id") and e2.get("nomeOriginal") == "projeto-v2.pdf" and e2.get("alunoId") == ids["bia"], f"{s} {e2}")
s, lista = prof.call("GET", f"/atividades/{pid}/entregas")
check("RF16", "professor ve uma entrega por grupo", s == 200 and len(lista) == 1 and lista[0].get("grupoNome") == f"Equipe {tag}", f"{s} {lista}")
s, falta = prof.call("GET", f"/atividades/{pid}/sem-entrega")
check("RF16", "quem nao entregou: so quem nao esta no grupo que entregou", s == 200 and [a["id"] for a in falta] == [ids["caio"]], f"{s} {falta}")
s, b = bia.call("GET", f"/entregas/{e1['id']}/arquivo")
check("RF16", "integrante baixa o arquivo do grupo (200)", s == 200, f"{s}")
s, b = caio.call("GET", f"/entregas/{e1['id']}/arquivo")
check("RF16", "quem nao e do grupo nao baixa (403)", s == 403, f"{s} {b}")
s, av = prof.call("PUT", f"/entregas/{e1['id']}/avaliacao", {"nota": 9, "comentarioPrivado": "bom trabalho"})
check("RF15", "professor avalia a entrega do grupo (200)", s == 200 and av.get("nota") == 9, f"{s} {av}")
for c, nome in ((aluno, "aluno"), (bia, "bia")):
    s, d = c.call("GET", f"/atividades/{pid}")
    check("RF15", f"a nota do grupo vale para {nome} (CONCLUIDA)", s == 200 and d.get("estado") == "CONCLUIDA" and d.get("nota") == 9, f"{s} {d}")
    s, n = c.call("GET", "/notificacoes")
    check("RF17", f"{nome} e avisado da nota do grupo", s == 200 and any(i.get("tipo") == "NOTA_PUBLICADA" and tgid == i.get("turmaId") for i in n.get("itens", [])), f"{s} {n}")
s, b = bia.upload(f"/atividades/{pid}/entregas", "tarde.pdf", pdf_grupo, "application/pdf")
check("RF06", "entrega do grupo ja avaliada nao aceita novo envio (409)", s == 409, f"{s} {b}")

# ---------------- RF13 aviso direcionado a grupos e alunos
print("RF13 Aviso direcionado")
s, av = prof.call("POST", f"/turmas/{tgid}/avisos", {"texto": f"So para o grupo {tag}", "gruposIds": [gg.get("id")]})
check("RF13", "professor publica aviso para um grupo (201, direcionado)", s == 201 and av.get("direcionado") is True and {d["id"] for d in av.get("destinatarios", [])} == {ids["aluno"], ids["bia"]}, f"{s} {av}")
avid = av.get("id")
s, l = bia.call("GET", f"/turmas/{tgid}/avisos")
check("RF13", "integrante do grupo ve o aviso direcionado (sem a lista de colegas)", s == 200 and any(a["id"] == avid and a.get("destinatarios") is None for a in l), f"{s} {l}")
s, l = caio.call("GET", f"/turmas/{tgid}/avisos")
check("RF13", "aluno fora do grupo nao ve o aviso", s == 200 and all(a["id"] != avid for a in l), f"{s} {l}")
s, l = prof.call("GET", f"/turmas/{tgid}/avisos")
check("RF13", "professor ve o aviso com os destinatarios", s == 200 and any(a["id"] == avid and len(a.get("destinatarios") or []) == 2 for a in l), f"{s} {l}")
s, b = caio.call("POST", f"/avisos/{avid}/comentarios", {"texto": "posso ver?"})
check("RF13", "quem nao recebeu nao comenta (404)", s == 404, f"{s} {b}")
s, b = caio.call("GET", f"/avisos/{avid}/comentarios")
check("RF13", "quem nao recebeu nao le os comentarios (404)", s == 404, f"{s} {b}")
s, b = bia.call("POST", f"/avisos/{avid}/comentarios", {"texto": "recebido"})
check("RF13", "quem recebeu comenta (201)", s == 201, f"{s} {b}")
s, n = caio.call("GET", "/notificacoes")
check("RF17", "so os destinatarios sao notificados do aviso direcionado", s == 200 and not any(i.get("avisoId") == avid for i in n.get("itens", [])), f"{s} {n}")
s, n = bia.call("GET", "/notificacoes")
check("RF17", "o destinatario e notificado do aviso direcionado", s == 200 and any(i.get("avisoId") == avid and i.get("tipo") == "AVISO_NOVO" for i in n.get("itens", [])), f"{s} {n}")
s, av2 = prof.call("POST", f"/turmas/{tgid}/avisos", {"texto": "So para o Caio", "alunosIds": [ids["caio"]]})
s2, l2 = caio.call("GET", f"/turmas/{tgid}/avisos")
check("RF13", "aviso para um aluno especifico chega a ele", s == 201 and any(a["id"] == av2.get("id") for a in l2), f"{s} {l2}")
s, b = prof.call("POST", f"/turmas/{tgid}/avisos", {"texto": "x", "alunosIds": ["00000000-0000-0000-0000-000000000000"]})
check("RF13", "destinatario que nao e da turma e recusado (422)", s == 422, f"{s} {b}")
s, b = prof.call("POST", f"/turmas/{tgid}/avisos", {"texto": "x", "gruposIds": ["00000000-0000-0000-0000-000000000000"]})
check("RF13", "grupo que nao existe na turma e recusado (422)", s == 422, f"{s} {b}")
s, geral = prof.call("POST", f"/turmas/{tgid}/avisos", {"texto": "Para todos"})
s2, l3 = caio.call("GET", f"/turmas/{tgid}/avisos")
check("RF13", "aviso sem destino continua indo para a turma toda", s == 201 and geral.get("direcionado") is False and any(a["id"] == geral.get("id") for a in l3), f"{s} {geral}")

# ---------------- resumo
falhas = [r for r in RESULTS if not r[2]]
print(f"\nResumo: {len(RESULTS) - len(falhas)}/{len(RESULTS)} verificacoes passaram")
por_rf = {}
for rf, _, ok, _ in RESULTS:
    por_rf.setdefault(rf, [0, 0])[0 if ok else 1] += 1
for rf, (p, f) in sorted(por_rf.items()):
    print(f"  {rf}: {p} ok, {f} falha(s)")
sys.exit(1 if falhas else 0)
