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
		log.Fatal(err)
	}
	defer db.Close()

	// Test query similar to what ProductsController.List does
	fmt.Println("\n=== Testing products query ===")
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if err != nil {
		log.Printf("Error counting products: %v", err)
	} else {
		fmt.Printf("Total products: %d\n", count)
	}

	// Try to query with Preload equivalent
	fmt.Println("\n=== Testing product query with joins ===")
	rows, err := db.Query(`
		SELECT p.id, p.slug, p.title, p.type, p.status, p.created_at
		FROM products p
		ORDER BY p.created_at DESC
		LIMIT 2
	`)
	if err != nil {
		log.Printf("Error querying products: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var slug, title, pType, status string
		var createdAt string
		err = rows.Scan(&id, &slug, &title, &pType, &status, &createdAt)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		fmt.Printf("  ID=%d, slug=%s, title=%s, type=%s, status=%s\n", id, slug, title, pType, status)
	}

	// Check if product_markets table exists and has data
	fmt.Println("\n=== Product_markets table ===")
	var pmCount int
	err = db.QueryRow("SELECT COUNT(*) FROM product_markets").Scan(&pmCount)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		fmt.Printf("Product_markets count: %d\n", pmCount)
	}
}
