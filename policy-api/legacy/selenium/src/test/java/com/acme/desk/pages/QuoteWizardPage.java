package com.acme.desk.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.Select;

public class QuoteWizardPage extends BasePage {

    private final By newMenu = By.id("nav-new");
    private final By submissionMenu = By.id("menu-submission");
    private final By personalAuto = By.xpath("//div[@id='menu-submission-flyout']/button[1]");
    private final By firstName = By.id("driver-first");
    private final By lastName = By.id("driver-last");
    private final By age = By.id("driver-age");
    private final By state = By.id("driver-state");
    private final By priorClaims = By.id("prior-claims");
    private final By next = By.id("wizard-next");
    private final By rateQuote = By.xpath("//button[text()='Rate quote']");

    public QuoteWizardPage(WebDriver driver) {
        super(driver);
    }

    public QuoteWizardPage startPersonalAuto() {
        click(newMenu);
        click(submissionMenu);
        click(personalAuto);
        waitForRoute("#/quote/driver");
        return this;
    }

    public QuoteWizardPage driver(String first, String last, int driverAge, String stateCode, boolean claims) {
        type(firstName, first);
        type(lastName, last);
        type(age, String.valueOf(driverAge));
        new Select(visible(state)).selectByValue(stateCode);
        if (claims) {
            click(priorClaims);
        }
        click(next);
        waitForRoute("#/quote/vehicle");
        return this;
    }

    public QuoteWizardPage keepVehicleDefaults() {
        click(next);
        waitForRoute("#/quote/coverage");
        return this;
    }

    public RatingWorksheetPage rate(String coverage) {
        click(By.id("cov-" + coverage));
        click(rateQuote);
        waitForRoute("#/worksheet/");
        return new RatingWorksheetPage(driver);
    }
}
