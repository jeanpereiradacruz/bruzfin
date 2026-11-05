package com.bruzfin.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

/**
 * API do BruzFin. Cada subpacote direto de {@code com.bruzfin.api} é um módulo do Spring Modulith
 * (ex.: {@code about}, e nos próximos tickets {@code identity}, {@code household}, {@code accounts}...).
 */
@Modulithic(systemName = "BruzFin API")
@SpringBootApplication
public class BruzfinApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(BruzfinApiApplication.class, args);
    }
}
