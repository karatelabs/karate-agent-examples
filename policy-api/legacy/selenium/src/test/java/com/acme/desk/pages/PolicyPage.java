package com.acme.desk.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class PolicyPage extends BasePage {

    private final By status = By.id("policy-status");
    private final By premium = By.id("policy-premium");
    private final By holder = By.id("policy-holder");

    public PolicyPage(WebDriver driver) {
        super(driver);
        wait.until(ExpectedConditions.textToBe(status, "BOUND"));
    }

    public String getStatus() {
        return textOf(status);
    }

    public String getMonthlyPremium() {
        return textOf(premium);
    }

    public String getNamedInsured() {
        return textOf(holder);
    }
}
