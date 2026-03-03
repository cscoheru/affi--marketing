package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

type Cred struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

func testConnection(cred Cred) bool {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cred.Host, cred.Port, cred.User, cred.Password, cred.DBName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Printf("  Open error: %v", err)
		return false
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Printf("  Ping error: %v", err)
		return false
	}

	log.Printf("  ✅ SUCCESS!")

	// 获取当前用户和数据库
	var currentUser, currentDB string
	db.QueryRow("SELECT current_user, current_database()").Scan(&currentUser, &currentDB)
	log.Printf("  Connected as: %s, Database: %s", currentUser, currentDB)

	return true
}

func main() {
	host := "139.224.42.111"
	port := 5432
	dbname := "business_hub"

	// 测试不同的凭据组合
	creds := []Cred{
		{Host: host, Port: port, User: "postgres", Password: "WhjQTPAwInc5Vav3sDWe", DBName: dbname},
		{Host: host, Port: port, User: "postgres", Password: "POxFGDpMQyCGfTSAFDXn", DBName: dbname},
		{Host: host, Port: port, User: "root", Password: "WhjQTPAwInc5Vav3sDWe", DBName: dbname},
		{Host: host, Port: port, User: "root", Password: "POxFGDpMQyCGfTSAFDXn", DBName: dbname},
	}

	for i, cred := range creds {
		fmt.Printf("\n=== Test %d: user=%s password=%s ===\n", i+1, cred.User, cred.Password)
		if testConnection(cred) {
			fmt.Printf("\n🎉 FOUND WORKING CREDENTIALS!\n")
			fmt.Printf("Username: %s\n", cred.User)
			fmt.Printf("Password: %s\n", cred.Password)
			return
		}
	}

	fmt.Println("\n❌ None of the credentials worked. Please check RDS console.")
}
