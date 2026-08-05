package com.nth.finanzas.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");
            System.out.println("DB FIX: Made 'password' column nullable.");
        } catch (Exception e) {
            System.out.println("DB FIX INFO: could not modify password - " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL");
            System.out.println("DB FIX: Made 'password_hash' column nullable.");
        } catch (Exception e) {
            System.out.println("DB FIX INFO: could not modify password_hash - " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE balance_snapshots MODIFY COLUMN account_id BIGINT NULL");
            System.out.println("DB FIX: Made 'account_id' column nullable in balance_snapshots.");
        } catch (Exception e) {
            System.out.println("DB FIX INFO: could not modify balance_snapshots account_id - " + e.getMessage());
        }
    }
}
