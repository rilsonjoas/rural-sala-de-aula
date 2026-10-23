"""Teste de ponta a ponta dos 9 requisitos P1 contra a API real (Docker local ou producao).

Uso: python3 -I scripts/smoke-p1.py [base_url]   (padrao http://localhost:8081/api/v1)
Cria usuarios descartaveis pela propria API. Nao depende do seed.
"""
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

# ---------------- resumo
falhas = [r for r in RESULTS if not r[2]]
print(f"\nResumo: {len(RESULTS) - len(falhas)}/{len(RESULTS)} verificacoes passaram")
por_rf = {}
for rf, _, ok, _ in RESULTS:
    por_rf.setdefault(rf, [0, 0])[0 if ok else 1] += 1
for rf, (p, f) in sorted(por_rf.items()):
    print(f"  {rf}: {p} ok, {f} falha(s)")
sys.exit(1 if falhas else 0)
