package com.datashare.user;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;
import com.datashare.user.dto.MeResponse;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/me} — profil de l'utilisateur courant.
 *
 * <p>Le compte est relu en base (et non pris dans les claims) : un token valide dont le
 * compte a été supprimé entre-temps est rejeté.
 */
@RestController
public class CurrentUserController {

    private final UserRepository users;

    public CurrentUserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/api/me")
    public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID id = UUID.fromString(jwt.getSubject());
        User user = users.findById(id)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.UNAUTHORIZED,
                        "Session invalide, reconnectez-vous",
                        "token valide mais le compte " + id + " n'existe plus"));
        return new MeResponse(user.getId(), user.getEmail());
    }
}
