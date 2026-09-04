package com.datashare.unit.file;

import static org.assertj.core.api.Assertions.assertThat;

import com.datashare.file.DownloadTokens;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class DownloadTokensTest {

    @Test
    void generates_url_safe_tokens_of_expected_length() {
        String token = DownloadTokens.generate();
        assertThat(token).hasSize(32).matches("[A-Za-z0-9_-]+");
    }

    @Test
    void generates_distinct_tokens() {
        long distinct = Stream.generate(DownloadTokens::generate)
                .limit(1000)
                .collect(Collectors.toSet())
                .size();
        assertThat(distinct).isEqualTo(1000);
    }
}
