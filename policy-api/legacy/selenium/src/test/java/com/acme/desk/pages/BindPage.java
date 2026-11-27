package com.acme.desk.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class BindPage extends BasePage {

    private final By holder = By.id("bind-holder");
    private final By signed = By.id("bind-signed");
    private final By confirm = By.id("bind-confirm");
    private final By banner = By.id("banner");

    public BindPage(WebDriver driver) {
        super(driver);
    }

    public PolicyPage bindSigned(String namedInsured) {
        type(holder, namedInsured);
        click(signed);
        click(confirm);
        waitForRoute("#/policy/");
        return new PolicyPage(driver);
    }

    public BindPage bindUnsigned() {
        click(confirm);
        return this;
    }

    public String getBanner() {
        return visible(banner).getText().trim();
    }
}
