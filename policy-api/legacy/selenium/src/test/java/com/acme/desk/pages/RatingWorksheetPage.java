package com.acme.desk.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class RatingWorksheetPage extends BasePage {

    private final By total = By.id("ws-total");
    private final By policyClass = By.id("ws-class");
    private final By state = By.id("ws-state");
    private final By bindPolicy = By.id("to-bind");

    public RatingWorksheetPage(WebDriver driver) {
        super(driver);
    }

    public String getMonthlyPremium() {
        return textOf(total);
    }

    public String getPolicyClass() {
        return textOf(policyClass);
    }

    public String getState() {
        return textOf(state);
    }

    public BindPage bind() {
        click(bindPolicy);
        waitForRoute("#/bind/");
        return new BindPage(driver);
    }
}
