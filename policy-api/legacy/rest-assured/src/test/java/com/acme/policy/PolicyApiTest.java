package com.acme.policy;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

class PolicyApiTest {

    @BeforeAll
    static void setup() {
        RestAssured.baseURI = System.getProperty("policy.api.url", "http://localhost:8080");
    }

    @Test
    void quotesAPreferredDriverInNewYork() {
        given()
            .contentType(ContentType.JSON)
            .body(Map.of("state", "NY", "coverage", "COMPREHENSIVE", "driverAge", 30, "priorClaims", false))
        .when()
            .post("/quotes")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("policyClass", equalTo("PREFERRED"))
            .body("monthlyPremium", equalTo(155))
            .body("currency", equalTo("USD"));
    }

    @Test
    void youngDriverWithPriorClaimsIsSubstandard() {
        given()
            .contentType(ContentType.JSON)
            .body(Map.of("state", "TX", "coverage", "LIABILITY", "driverAge", 21, "priorClaims", true))
        .when()
            .post("/quotes")
        .then()
            .statusCode(201)
            .body("policyClass", equalTo("SUBSTANDARD"))
            .body("monthlyPremium", equalTo(125));
    }

    @Test
    void bindsAPolicyAndFetchesItById() {
        String quoteId = given()
            .contentType(ContentType.JSON)
            .body(Map.of("state", "WA", "coverage", "COLLISION", "driverAge", 45, "priorClaims", false))
        .when()
            .post("/quotes")
        .then()
            .statusCode(201)
            .extract().path("id");

        String policyId = given()
            .contentType(ContentType.JSON)
            .body(Map.of("quoteId", quoteId, "holder", "Dorothy Vaughan"))
        .when()
            .post("/policies")
        .then()
            .statusCode(201)
            .body("status", equalTo("BOUND"))
            .body("holder", equalTo("Dorothy Vaughan"))
            .extract().path("id");

        given()
        .when()
            .get("/policies/{id}", policyId)
        .then()
            .statusCode(200)
            .body("id", equalTo(policyId))
            .body("quoteId", equalTo(quoteId));
    }

    @Test
    void listsPoliciesFilteredByState() {
        String quoteId = given()
            .contentType(ContentType.JSON)
            .body(Map.of("state", "WA", "coverage", "LIABILITY", "driverAge", 52, "priorClaims", false))
        .when()
            .post("/quotes")
        .then()
            .statusCode(201)
            .extract().path("id");

        given()
            .contentType(ContentType.JSON)
            .body(Map.of("quoteId", quoteId, "holder", "Mary Jackson"))
        .when()
            .post("/policies")
        .then()
            .statusCode(201);

        given()
            .queryParam("state", "WA")
        .when()
            .get("/policies")
        .then()
            .statusCode(200)
            .body("state", everyItem(equalTo("WA")))
            .body("holder", hasItem("Mary Jackson"));
    }
}
