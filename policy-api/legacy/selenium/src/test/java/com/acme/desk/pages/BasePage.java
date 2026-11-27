package com.acme.desk.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    protected WebElement visible(By by) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    protected void click(By by) {
        wait.until(ExpectedConditions.elementToBeClickable(by)).click();
    }

    protected void type(By by, String value) {
        WebElement el = visible(by);
        el.clear();
        el.sendKeys(value);
    }

    protected String textOf(By by) {
        wait.until(d -> !d.findElement(by).getText().isBlank());
        return driver.findElement(by).getText().trim();
    }

    protected void waitForRoute(String hashPrefix) {
        wait.until(ExpectedConditions.urlContains(hashPrefix));
    }
}
