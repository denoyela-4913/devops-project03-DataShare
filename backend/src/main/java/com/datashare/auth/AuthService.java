package com.datashare.auth;

import com.datashare.auth.dto.LoginRequest;
import com.datashare.auth.dto.RegisterRequest;
import com.datashare.auth.dto.TokenResponse;
import com.datashare.user.User;
import com.datashare.user.UserRepository;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Inscription (US03) et connexion (US04). */
@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) {
            throw new EmailAlreadyUsedException(email);
        }
        User user = new User(email, passwordEncoder.encode(request.password()));
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new EmailAlreadyUsedException(email);
        }
        return token(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        String email = normalize(request.email());
        User user = users.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("aucun compte pour l'email " + email));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("mot de passe invalide pour " + email);
        }
        return token(user);
    }

    private TokenResponse token(User user) {
        String jwt = jwtService.generateToken(user.getId(), user.getEmail());
        return TokenResponse.bearer(jwt, jwtService.accessTtlSeconds());
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
