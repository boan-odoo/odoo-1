const legacyExports = {};

export const legacyProm: Promise<any> = new Promise((resolve) => {
  const odoo = (window as any).odoo;

  odoo.define("wowl.fixTheHellOutOfMe", async (require: any) => {
    const session = require("web.session");
    await session.is_bound; // await for templates from server
    Object.assign(legacyExports, {
      makeTestEnvironment: require("web.test_env"),
      testUtils: require("web.test_utils"),
      basicFields: require("web.basic_fields"),
      Widget: require("web.Widget"),
      AbstractAction: require("web.AbstractAction"),
      AbstractController: require("web.AbstractController"),
      ListController: require("web.ListController"),
      core: require("web.core"),
      ReportClientAction: require("report.client_action"),
      AbstractView: require("web.AbstractView"),
      legacyViewRegistry: require("web.view_registry"),
      FormView: require('web.FormView'),
    });
    resolve(legacyExports);
  });
});

export function getLegacy() {
  return legacyExports;
}
