package com.datashare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DataShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataShareApplication.class, args);
    }
}
