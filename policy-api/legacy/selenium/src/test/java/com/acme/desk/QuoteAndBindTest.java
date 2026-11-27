package com.acme.desk;

import com.acme.desk.pages.BindPage;
import com.acme.desk.pages.PolicyPage;
import com.acme.desk.pages.QuoteWizardPage;
import com.acme.desk.pages.RatingWorksheetPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class QuoteAndBindTest {

    private static final String DESK_URL = System.getProperty("desk.url", "http://localhost:8080/desk/");

    private WebDriver driver;

    @BeforeEach
    void openDesk() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1440,900");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(2));
        driver.get(DESK_URL);
    }

    @AfterEach
    void closeDesk() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void ratesAPreferredDriverInNewYork() {
        RatingWorksheetPage worksheet = new QuoteWizardPage(driver)
                .startPersonalAuto()
                .driver("Walter", "Brandt", 30, "NY", false)
                .keepVehicleDefaults()
                .rate("COMPREHENSIVE");

        assertEquals("$155.00", worksheet.getMonthlyPremium());
        assertEquals("PREFERRED", worksheet.getPolicyClass());
        assertEquals("New York", worksheet.getState());
    }

    @Test
    void bindsAYoungDriverWithPriorClaimsAtTheSubstandardPremium() {
        RatingWorksheetPage worksheet = new QuoteWizardPage(driver)
                .startPersonalAuto()
                .driver("Hank", "Ostrowski", 21, "TX", true)
                .keepVehicleDefaults()
                .rate("LIABILITY");
        assertEquals("$125.00", worksheet.getMonthlyPremium());

        PolicyPage policy = worksheet.bind().bindSigned("Hank Ostrowski");

        assertEquals("BOUND", policy.getStatus());
        assertEquals("$125.00", policy.getMonthlyPremium());
        assertEquals("Hank Ostrowski", policy.getNamedInsured());
    }

    @Test
    void bindingWithoutASignedApplicationIsRefused() {
        BindPage bind = new QuoteWizardPage(driver)
                .startPersonalAuto()
                .driver("Priya", "Natarajan", 40, "CA", false)
                .keepVehicleDefaults()
                .rate("COLLISION")
                .bind()
                .bindUnsigned();

        assertEquals("A signed application must be on file before binding.", bind.getBanner());
        assertTrue(driver.getCurrentUrl().contains("#/bind/"));
    }
}
