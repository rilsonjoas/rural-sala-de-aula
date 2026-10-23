package com.narniano.rural_sala_de_aula.classes.usuario;

import com.narniano.rural_sala_de_aula.common.exception.AppException;
import com.narniano.rural_sala_de_aula.common.exception.ErrorResponseDTO;
import com.narniano.rural_sala_de_aula.common.exception.TentativasExcedidasException;
import com.narniano.rural_sala_de_aula.common.security.LimitadorDeTentativas;
import com.narniano.rural_sala_de_aula.common.security.PasswordEncoderUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String SESSION_USER_ID = "USER_ID";

    private final UsuarioRepository usuarioRepository;
    private final LimitadorDeTentativas limitador;

    @Value("${app.rate-limit.enabled:true}")
    private boolean limiteLigado;
    @Value("${app.rate-limit.login-falhas-por-email:5}")
    private int loginFalhasPorEmail;
    @Value("${app.rate-limit.login-falhas-por-ip:30}")
    private int loginFalhasPorIp;
    @Value("${app.rate-limit.login-janela-minutos:15}")
    private int loginJanelaMinutos;
    @Value("${app.rate-limit.cadastros-por-ip:30}")
    private int cadastrosPorIp;
    @Value("${app.rate-limit.cadastro-janela-minutos:60}")
    private int cadastroJanelaMinutos;

    @Transactional
    public ResponseUsuarioDTO register(RequestUsuarioDTO dto, HttpSession session, String ip) {
        Duration janelaCadastro = Duration.ofMinutes(cadastroJanelaMinutos);
        String chaveCadastro = "cadastro:ip:" + ip;
        if (limiteLigado) {
            exigirLiberado(chaveCadastro, cadastrosPorIp, janelaCadastro);
            limitador.registrar(chaveCadastro, janelaCadastro);
        }
        String email = dto.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
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

    public ResponseUsuarioDTO login(LoginRequestDTO dto, HttpSession session, String ip) {
        String email = dto.email().trim().toLowerCase();
        Duration janela = Duration.ofMinutes(loginJanelaMinutos);
        String chaveEmail = "login:email:" + email;
        String chaveIp = "login:ip:" + ip;
        if (limiteLigado) {
            exigirLiberado(chaveEmail, loginFalhasPorEmail, janela);
            exigirLiberado(chaveIp, loginFalhasPorIp, janela);
        }

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null || !PasswordEncoderUtil.matches(dto.senha(), usuario.getSenha())) {
            if (limiteLigado) {
                limitador.registrar(chaveEmail, janela);
                limitador.registrar(chaveIp, janela);
            }
            throw new AppException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos. Confira e tente de novo.");
        }

        limitador.limpar(chaveEmail);
        session.setAttribute(SESSION_USER_ID, usuario.getId());
        return new ResponseUsuarioDTO(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getDataNascimento());
    }

    private void exigirLiberado(String chave, int maximo, Duration janela) {
        long espera = limitador.segundosAteLiberar(chave, maximo, janela);
        if (espera > 0) {
            throw new TentativasExcedidasException(espera);
        }
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
