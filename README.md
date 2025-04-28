## About vulnerable-kyc-api ?

Welcome to the vulnerable-kyc-api project.This lab is designed to help you learn about and explore the top 10 security risks associated with APIs according to the OWASP API Security Project.

The OWASP API Top 10 - 2023 consists of the following vulnerabilities:
-	0xa1: Broken Object Level Authorization
-	0xa2: Broken Authentication
-	0xa3: Broken Object Property Level Authorization
-	0xa4: Unrestricted Resource Consumption
-	0xa5: Broken Function Level Authorization
-	0xa6: Unrestricted Access to Sensitive Business Flows
-	0xa7: Server Side Request Forgery
-	0xa8: Security Misconfiguration
-	0xa9: Improper Inventory Management
-	0xaa: Unsafe Consumption of APIs

## Who can use vulnerable-kyc-api ?

 is designed for a diverse range of users:

- **API enthusiasts**: Whether you're a beginner or have intermediate knowledge, DVAPI offers a hands-on learning experience to explore API vulnerabilities and enhance your skills.
- **Security professionals**: Stay up to date with the latest API security trends and the OWASP API Top 10 - 2023 RC. vulnerable-kyc-api allows security professionals to practice identifying API-related risks.
- **Developers**: Developers can learn about potential security pitfalls and adopt best practices to protect their own APIs from common vulnerabilities. DVAPI serves as an educational tool for developers looking to enhance their API security knowledge.
- **Educators and trainers**: DVAPI provides a comprehensive platform for teaching API security, allowing instructors to engage students in discovering vulnerabilities and applying countermeasures.

vulnerable-kyc-api caters to individuals seeking practical knowledge and a deeper understanding of API security, regardless of their background or expertise.

# Get Started

## Features

The lab provides a series of challenges and exercises related to the top 10 API security risks identified by OWASP. These challenges are designed to test your knowledge and skills in identifying and mitigating common security vulnerabilities in API implementations.

It has many functionalities that uses different API endpoints. We have added a Postman collection file that you can import. The vulnerable-kyc-api application has a swagger endpoint as well, which you can use.

All in all, users have the flexibility to assess the APIs via these methods:
- The application itself
- Postman collection
    - Get the Postman collection on 
    - 

## Setting up vulnerable-kyc-api

To get started with the vulnerable-kyc-api lab, follow the steps below:

1.  **Clone the repository:**

```bash
git clone https://github.com/deepankarkumar1/vulnerable-kyc-api.git
```

2.  Navigate to the DVAPI directory:.

```bash
cd vulnerable-kyc-api
```

3.  Use `docker compose` to build and run the application:

```bash
docker compose up --build
```

4.  Access the vulnerable-kyc-api application at [http://127.0.0.1:3000](http://127.0.0.1:3000/)



**Disclaimer: As this application is intentionally vulnerable, do not host this on a production environment.** 

