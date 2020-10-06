const TITLE = "Amplication";
const LOGIN_URL = "http://localhost:3001/login";
const HOME_PAGE_URL = "http://localhost:3001/";
const USER_EMAIL = "lisa@simpson.com";
const USER_PASSWORD = "secret42";
const TIMEOUT=60000;
var RESULT_URL;
describe("login test", () => {
  beforeAll(async () => {
    await page.goto(LOGIN_URL);
  }, TIMEOUT);
  it("should log into user account ", async () => {
    page.setDefaultTimeout(TIMEOUT);
    await expect(page.title()).resolves.toMatch(TITLE);
    await (await page.waitForXPath("//input[@name='email']")).type(USER_EMAIL);
    await (await page.waitForXPath('//input[@name="password"]')).type(
      USER_PASSWORD
    );
    await page.click("button.amp-button--primary");
    await page.waitForNavigation();
    RESULT_URL = await page.url();
    await expect(RESULT_URL).toMatch(HOME_PAGE_URL);
  }, TIMEOUT);
});
