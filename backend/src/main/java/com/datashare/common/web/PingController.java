package com.datashare.common.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Smoke test de déploiement. Ne divulgue aucune information d'environnement : la distinction
 * dev/prod se vérifie via le comportement des erreurs, pas ici.
 */
@RestController
@RequestMapping("/api/ping")
public class PingController {

    @GetMapping
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }
}
