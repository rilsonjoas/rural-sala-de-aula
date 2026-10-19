package com.narniano.rural_sala_de_aula.classes.usuario;

import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.exception.ErrorResponseDTO;
import com.narniano.rural_sala_de_aula.common.security.PasswordEncoderUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String SESSION_USER_ID = "USER_ID";

    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ResponseUsuarioDTO register(RequestUsuarioDTO dto, HttpSession session) {
        String email = dto.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new AppException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Esse e-mail já está cadastrado. Entre ou use outro e-mail.",
                    List.of(new ErrorResponseDTO.CampoErroDTO("email", "Esse e-mail já está cadastrado. Entre ou use outro e-mail."))
            );
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome().trim());
        usuario.setEmail(email);
        usuario.setSenha(PasswordEncoderUtil.encode(dto.senha()));
        usuario.setDataNascimento(dto.dataNascimento());

        Usuario salvo = usuarioRepository.save(usuario);
        session.setAttribute(SESSION_USER_ID, salvo.getId());

        return new ResponseUsuarioDTO(salvo.getId(), salvo.getNome(), salvo.getEmail(), salvo.getDataNascimento());
    }

    public ResponseUsuarioDTO login(LoginRequestDTO dto, HttpSession session) {
        String email = dto.email().trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos. Confira e tente de novo."));

        if (!PasswordEncoderUtil.matches(dto.senha(), usuario.getSenha())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos. Confira e tente de novo.");
        }

        session.setAttribute(SESSION_USER_ID, usuario.getId());
        return new ResponseUsuarioDTO(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getDataNascimento());
    }

    public void logout(HttpSession session) {
        try {
            session.invalidate();
        } catch (IllegalStateException ignored) {
        }
    }

    public Usuario getUsuarioAutenticado(HttpSession session) {
        Object attr = session.getAttribute(SESSION_USER_ID);
        if (attr == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        UUID userId = (UUID) attr;
        return usuarioRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
    }

    public ResponseUsuarioDTO me(HttpSession session) {
        Usuario usuario = getUsuarioAutenticado(session);
        return new ResponseUsuarioDTO(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getDataNascimento());
    }
}
