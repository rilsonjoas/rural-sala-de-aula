package com.narniano.rural_sala_de_aula.classes.grupo;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.turma.TurmaRepository;
import com.narniano.rural_sala_de_aula.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final TurmaRepository turmaRepository;

    @Transactional
    public ResponseGrupoDTO cadastrar(RequestGrupoDTO dto) {
        Turma turma = turmaRepository.findById(dto.idTurma())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        Grupo grupo = new Grupo();
        grupo.setTurma(turma);
        grupo.setNome(dto.name().trim());

        Grupo salvo = grupoRepository.save(grupo);
        return new ResponseGrupoDTO(salvo.getId(), turma.getId(), turma.getCodigo(), salvo.getNome());
    }

    @Transactional(readOnly = true)
    public List<ResponseGrupoDTO> listarPorTurma(UUID turmaId) {
        return grupoRepository.findByTurmaId(turmaId)
                .stream()
                .map(g -> new ResponseGrupoDTO(g.getId(), g.getTurma().getId(), g.getTurma().getCodigo(), g.getNome()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Grupo buscarPorId(UUID id) {
        return grupoRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Grupo não encontrado: " + id));
    }

    @Transactional
    public void remover(UUID id) {
        Grupo grupo = buscarPorId(id);
        grupoRepository.delete(grupo);
    }
}
