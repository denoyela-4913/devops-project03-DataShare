package com.datashare.unit.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.datashare.maintenance.PurgeReport;
import org.junit.jupiter.api.Test;

class PurgeReportTest {

    @Test
    void exit_code_is_zero_when_no_storage_failure() {
        assertThat(new PurgeReport(5, 0).exitCode()).isZero();
    }

    @Test
    void exit_code_is_one_when_at_least_one_storage_failure() {
        assertThat(new PurgeReport(5, 1).exitCode()).isEqualTo(1);
    }
}
