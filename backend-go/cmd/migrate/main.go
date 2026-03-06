package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DATABASE_HOST"),
		os.Getenv("DATABASE_PORT"),
		os.Getenv("DATABASE_USER"),
		os.Getenv("DATABASE_PASSWORD"),
		os.Getenv("DATABASE_DB_NAME"),
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("Connected to database:", os.Getenv("DATABASE_DB_NAME"))

	// Read the migration file
	migrationSQL, err := os.ReadFile("migrations/007_fix_products_schema.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	// Execute the migration
	result, err := db.Exec(string(migrationSQL))
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("Migration 007 executed successfully!")
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Rows affected: %d\n", rowsAffected)

	// Verify the schema
	fmt.Println("\n=== Verifying products table schema ===")
	rows, err := db.Query(`
		SELECT column_name, data_type
		FROM information_schema.columns
		WHERE table_name = 'products'
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var col, dtype string
			rows.Scan(&col, &dtype)
			fmt.Printf("  %s: %s\n", col, dtype)
		}
	}

	fmt.Println("\nMigration 007 completed!")
}
