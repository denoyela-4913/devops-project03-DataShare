package com.datashare.unit.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.datashare.auth.AuthService;
import com.datashare.auth.EmailAlreadyUsedException;
import com.datashare.auth.InvalidCredentialsException;
import com.datashare.auth.JwtService;
import com.datashare.auth.dto.LoginRequest;
import com.datashare.auth.dto.RegisterRequest;
import com.datashare.auth.dto.TokenResponse;
import com.datashare.user.User;
import com.datashare.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_hashes_password_normalises_email_and_returns_token() {
        when(users.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(jwtService.generateToken(any(), eq("alice@example.com"))).thenReturn("jwt-token");
        when(jwtService.accessTtlSeconds()).thenReturn(3600L);

        TokenResponse result = authService.register(new RegisterRequest("  Alice@Example.com ", "password123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("alice@example.com");
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("hashed");
        assertThat(result).isEqualTo(new TokenResponse("jwt-token", "Bearer", 3600L));
    }

    @Test
    void register_rejects_an_email_already_taken() {
        when(users.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterRequest("taken@example.com", "password123")))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    @Test
    void register_maps_a_unique_constraint_violation_to_conflict() {
        when(users.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(users.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate key"));

        assertThatThrownBy(() -> authService.register(new RegisterRequest("race@example.com", "password123")))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    @Test
    void login_returns_a_token_when_the_password_matches() {
        User user = new User("bob@example.com", "stored-hash");
        when(users.findByEmail("bob@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "stored-hash")).thenReturn(true);
        when(jwtService.generateToken(any(), eq("bob@example.com"))).thenReturn("jwt-token");
        when(jwtService.accessTtlSeconds()).thenReturn(3600L);

        TokenResponse result = authService.login(new LoginRequest("Bob@Example.com", "secret"));

        assertThat(result.accessToken()).isEqualTo("jwt-token");
    }

    @Test
    void login_rejects_an_unknown_email() {
        when(users.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@example.com", "secret")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_rejects_a_wrong_password() {
        User user = new User("bob@example.com", "stored-hash");
        when(users.findByEmail("bob@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("bob@example.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
