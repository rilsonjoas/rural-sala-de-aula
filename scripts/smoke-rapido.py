#!/usr/bin/env python3
"""Smoke RAPIDO para demonstracao ao vivo: o caminho principal do sistema em ~20 verificacoes e poucos segundos.

Nao substitui o smoke completo (scripts/smoke-p1.py, 248 verificacoes no CI). Percorre, com contas descartaveis:
cadastro e login, turma e codigo, inscricao, atividade em grupo, grupo (pedido e aprovacao), entrega em nome do
grupo, nota, aviso so para o grupo, notificacao, comentario, calendario, paginacao e exclusao. No fim APAGA tudo
o que criou (turma e as quatro contas), entao nao deixa dado de teste. Usa 4 cadastros (limite: 30 por IP por hora).

  python3 -I scripts/smoke-rapido.py [https://rural-sala-de-aula.narniano.com/api/v1]
"""
import http.cookiejar
import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1").rstrip("/")
SENHA = "umaSenha123"
COR = sys.stdout.isatty()
VERDE, VERMELHO, CINZA, NEGRITO, FIM = ("\033[32m", "\033[31m", "\033[90m", "\033[1m", "\033[0m") if COR else ("",) * 5


class Cliente:
    def __init__(self, nome):
        self.nome = nome
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def chamar(self, metodo, caminho, corpo=None, bruto=None, tipo=None):
        dados, cab = None, {}
        if corpo is not None:
            dados, cab["Content-Type"] = json.dumps(corpo).encode(), "application/json"
        if bruto is not None:
            dados, cab["Content-Type"] = bruto, tipo
        req = urllib.request.Request(BASE + caminho, data=dados, method=metodo, headers=cab)
        try:
            with self.opener.open(req, timeout=30) as r:
                payload, status, cabecalhos = r.read(), r.status, r.headers
        except urllib.error.HTTPError as e:
            payload, status, cabecalhos = e.read(), e.code, e.headers
        try:
            return status, json.loads(payload) if payload else None, cabecalhos
        except ValueError:
            return status, payload, cabecalhos

    def enviar(self, caminho, nome_arquivo, conteudo):
        b = uuid.uuid4().hex
        raw = (f'--{b}\r\nContent-Disposition: form-data; name="arquivo"; filename="{nome_arquivo}"\r\n'
               f"Content-Type: application/pdf\r\n\r\n").encode() + conteudo + f"\r\n--{b}--\r\n".encode()
        return self.chamar("POST", caminho, bruto=raw, tipo=f"multipart/form-data; boundary={b}")


resultados = []
inicio_geral = time.time()
inicio_passo = time.time()


def passo(titulo):
    print(f"\n{NEGRITO}{titulo}{FIM}")


def checar(descricao, ok, detalhe=""):
    global inicio_passo
    gasto = time.time() - inicio_passo
    inicio_passo = time.time()
    resultados.append(ok)
    marca = f"{VERDE}✓{FIM}" if ok else f"{VERMELHO}✗{FIM}"
    extra = "" if ok else f"  {VERMELHO}-> {detalhe}{FIM}"
    print(f"  {marca} {descricao} {CINZA}({gasto:.1f}s){FIM}{extra}")


def iso(delta):
    return (datetime.now(timezone.utc) + delta).strftime("%Y-%m-%dT%H:%M:%SZ")


tag = uuid.uuid4().hex[:6]
prof, ana, bia, caio = Cliente("prof"), Cliente("ana"), Cliente("bia"), Cliente("caio")
email = lambda c: f"{c.nome}.rapido.{tag}@teste.rural"
ids = {}

print(f"{NEGRITO}Smoke rápido{FIM} em {BASE} (execução {tag})")

passo("Contas e acesso (RF01)")
for c in (prof, ana, bia, caio):
    s, b, _ = c.chamar("POST", "/auth/register", {"nome": f"{c.nome.capitalize()} {tag}", "email": email(c), "senha": SENHA})
    ids[c.nome] = b.get("id") if isinstance(b, dict) else None
    if c is prof:
        checar("cadastro cria a conta e já entra (201)", s == 201, f"{s} {b}")
s, b, _ = Cliente("x").chamar("POST", "/auth/login", {"email": email(prof), "senha": "errada123"})
checar("senha errada não entra (401)", s == 401, f"{s} {b}")
s, b, _ = Cliente("anon").chamar("GET", "/turmas")
checar("rota privada sem login é barrada (401)", s == 401, f"{s}")

passo("Turma, inscrição e atividade em grupo (RF09, RF02, RF10)")
s, turma, _ = prof.chamar("POST", "/turmas", {"nome": f"Demo {tag}", "disciplina": "Demonstração", "semestre": "2026.2", "diasAula": [2, 4], "descricao": "smoke rápido"})
tid, codigo = turma.get("id"), turma.get("codigo")
checar("o professor cria a turma e recebe o código de entrada", s == 201 and bool(codigo), f"{s} {turma}")
for c in (ana, bia, caio):
    s, _, _ = c.chamar("POST", "/inscricoes", {"codigo": codigo})
checar("os alunos entram na turma pelo código", s in (200, 201), f"{s}")
s, ativ, _ = prof.chamar("POST", f"/turmas/{tid}/atividades", {"nome": f"Projeto {tag}", "descricao": "projeto em grupo", "tipo": "PROJETO_EM_GRUPO", "prazoFinal": iso(timedelta(days=3)), "disponivelEm": iso(timedelta(hours=-1))})
aid = ativ.get("id")
checar("o professor cadastra um projeto em grupo (201)", s == 201, f"{s} {ativ}")

passo("Grupos (RF06, RF12)")
s, b, _ = ana.enviar(f"/atividades/{aid}/entregas", "projeto.pdf", b"%PDF-1.4 sem grupo")
checar("sem grupo aprovado não se entrega projeto em grupo (422)", s == 422, f"{s} {b}")
s, grupo, _ = ana.chamar("POST", f"/turmas/{tid}/grupos", {"nome": f"Equipe {tag}", "integrantesIds": [ids["bia"]]})
checar("a aluna pede um grupo com a colega (nasce PENDENTE)", s == 201 and grupo.get("status") == "PENDENTE", f"{s} {grupo}")
s, g2, _ = prof.chamar("POST", f"/grupos/{grupo.get('id')}/aprovacao", {"aprovado": True})
checar("o professor aprova o grupo", s == 200 and g2.get("status") == "APROVADO", f"{s} {g2}")

passo("Entrega em grupo e nota (RF04, RF15)")
s, ent, _ = ana.enviar(f"/atividades/{aid}/entregas", "projeto.pdf", b"%PDF-1.4 projeto do grupo")
checar("a aluna entrega em nome do grupo (201)", s == 201 and ent.get("grupoId") == grupo.get("id"), f"{s} {ent}")
s, d, _ = bia.chamar("GET", f"/atividades/{aid}")
checar("a colega de grupo vê a mesma entrega (ENTREGUE)", s == 200 and d.get("estado") == "ENTREGUE", f"{s} {d}")
s, lista, _ = prof.chamar("GET", f"/atividades/{aid}/entregas")
checar("o professor vê uma entrega por grupo", s == 200 and len(lista) == 1, f"{s} {lista}")
s, av, _ = prof.chamar("PUT", f"/entregas/{ent['id']}/avaliacao", {"nota": 9, "comentarioPrivado": "bom trabalho"})
s2, d2, _ = bia.chamar("GET", f"/atividades/{aid}")
checar("a nota vale para o grupo todo (CONCLUIDA, 9)", s == 200 and d2.get("estado") == "CONCLUIDA" and d2.get("nota") == 9, f"{s} {d2}")

passo("Mural, notificações e comentários (RF13, RF17, RF14)")
s, aviso, _ = prof.chamar("POST", f"/turmas/{tid}/avisos", {"texto": f"Só para o grupo {tag}", "gruposIds": [grupo.get("id")]})
checar("o professor publica um aviso só para o grupo", s == 201 and aviso.get("direcionado") is True, f"{s} {aviso}")
s, l, _ = caio.chamar("GET", f"/turmas/{tid}/avisos")
checar("quem não é do grupo não vê o aviso", s == 200 and all(a["id"] != aviso.get("id") for a in l), f"{s} {l}")
s, n, _ = bia.chamar("GET", "/notificacoes")
tipos = {i.get("tipo") for i in (n or {}).get("itens", [])}
checar("o sino da colega avisa do aviso e da nota", s == 200 and {"AVISO_NOVO", "NOTA_PUBLICADA"} <= tipos, f"{s} {tipos}")
s, b, _ = ana.chamar("POST", f"/atividades/{aid}/comentarios", {"texto": "Posso entregar uma nova versão?"})
s2, n2, _ = prof.chamar("GET", "/notificacoes")
checar("o comentário da aluna chega ao professor pelo sino", s == 201 and any(i.get("tipo") == "COMENTARIO_NOVO" for i in (n2 or {}).get("itens", [])), f"{s} {n2}")

passo("Calendário e paginação (RF08)")
s, minhas, _ = ana.chamar("GET", "/atividades")
checar("o prazo da atividade aparece para a aluna (base do calendário)", s == 200 and any(a["id"] == aid for a in minhas), f"{s}")
s, pag, cab = bia.chamar("GET", f"/turmas/{tid}/avisos?limite=1")
checar("a lista de avisos pagina e informa o total", s == 200 and len(pag) == 1 and cab.get("X-Total-Count") is not None, f"{s} {cab.get('X-Total-Count')}")

passo("Limpeza (exclusão de turma e contas)")
s, b, _ = prof.chamar("DELETE", f"/turmas/{tid}")
checar("o professor exclui a turma com tudo o que depende dela (204)", s == 204, f"{s} {b}")
excluidas = [c.chamar("POST", "/me/exclusao", {"senha": SENHA})[0] for c in (ana, bia, caio, prof)]
checar("as quatro contas de teste são excluídas (204)", excluidas == [204, 204, 204, 204], f"{excluidas}")

total, passaram = len(resultados), sum(resultados)
gasto = time.time() - inicio_geral
cor = VERDE if passaram == total else VERMELHO
print(f"\n{cor}{NEGRITO}{passaram}/{total} verificações passaram em {gasto:.0f} s{FIM} {CINZA}(o smoke completo, com 248, roda no CI){FIM}")
sys.exit(0 if passaram == total else 1)
