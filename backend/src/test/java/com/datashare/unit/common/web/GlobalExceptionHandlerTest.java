package com.datashare.unit.common.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.datashare.common.error.ConflictException;
import com.datashare.common.web.GlobalExceptionHandler;
import com.datashare.config.ErrorProperties;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Contrat des réponses d'erreur, isolé (pas de contexte Spring, pas de base). */
class GlobalExceptionHandlerTest {

    @RestController
    static class BoomController {

        @GetMapping("/boom")
        String boom() {
            throw new ConflictException(
                    "Erreur de création", "L'email aa@gmail.com est déjà utilisé par un autre utilisateur");
        }
    }

    private MockMvc mockMvc(boolean verbose) {
        JsonMapper mapper = JsonMapper.builder().addModule(new JavaTimeModule()).build();
        return MockMvcBuilders.standaloneSetup(new BoomController())
                .setControllerAdvice(new GlobalExceptionHandler(new ErrorProperties(verbose)))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
    }

    @Test
    void verbose_mode_includes_the_debug_detail() throws Exception {
        mockMvc(true)
                .perform(get("/boom"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Erreur de création"))
                .andExpect(jsonPath("$.debug").value("L'email aa@gmail.com est déjà utilisé par un autre utilisateur"));
    }

    @Test
    void non_verbose_mode_omits_the_debug_detail() throws Exception {
        mockMvc(false)
                .perform(get("/boom"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Erreur de création"))
                .andExpect(jsonPath("$.debug").doesNotExist());
    }
}
