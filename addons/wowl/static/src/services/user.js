/** @odoo-module **/
import { switchCompanySystrayItem } from "../switch_company_menu/switch_company_menu";

export function computeAllowedCompanyIds(cidsFromHash) {
  const { user_companies } = odoo.session_info;

  let allowedCompanies = cidsFromHash || [];
  const allowedCompaniesFromSession = user_companies.allowed_companies.map(([id, name]) => id);
  const notReallyAllowedCompanies = allowedCompanies.filter(
    (id) => !allowedCompaniesFromSession.includes(id)
  );
  if (!allowedCompanies.length || notReallyAllowedCompanies.length) {
    allowedCompanies = [user_companies.current_company[0]];
  }
  return allowedCompanies;
}

export function makeSetCompanies(getAllowedCompanyIds) {
  return function setCompanies(mode, companyId) {
    let nextCompanyIds = getAllowedCompanyIds().slice();
    if (mode === "toggle") {
      if (nextCompanyIds.includes(companyId)) {
        nextCompanyIds = nextCompanyIds.filter((id) => id !== companyId);
      } else {
        nextCompanyIds.push(companyId);
      }
    } else if (mode === "loginto") {
      if (nextCompanyIds.includes(companyId)) {
        nextCompanyIds = nextCompanyIds.filter((id) => id !== companyId);
      }
      nextCompanyIds.unshift(companyId);
    }
    return nextCompanyIds;
  };
}

export const userService = {
  name: "user",
  dependencies: ["router", "cookie"],
  deploy(env) {
    const { router, cookie } = env.services;
    const info = odoo.session_info;
    const {
      user_context,
      username,
      name,
      is_admin,
      partner_id,
      user_companies,
      home_action_id,
      db,
      show_effect: showEffect,
    } = info;

    let cids;
    if ("cids" in router.current.hash) {
      cids = router.current.hash.cids;
    } else if ("cids" in cookie.current) {
      cids = cookie.current.cids;
    }
    const allowedCompanies = computeAllowedCompanyIds(
      cids && cids.split(",").map((id) => parseInt(id, 10))
    );
    let context = {
      lang: user_context.lang,
      tz: user_context.tz,
      uid: info.uid,
      allowed_company_ids: allowedCompanies,
    };

    cids = allowedCompanies.join(",");
    router.replaceState({ "lock cids": cids });
    cookie.setCookie("cids", cids);

    if (user_companies.allowed_companies.length > 1) {
      odoo.systrayRegistry.add(switchCompanySystrayItem.name, switchCompanySystrayItem);
    }

    const setCompanies = makeSetCompanies(() => allowedCompanies);
    return {
      context,
      get userId() {
        return context.uid;
      },
      name,
      userName: username,
      isAdmin: is_admin,
      partnerId: partner_id,
      allowed_companies: user_companies.allowed_companies,
      current_company: user_companies.allowed_companies.find(([id]) => id === allowedCompanies[0]),
      get lang() {
        return context.lang;
      },
      get tz() {
        return context.tz;
      },
      home_action_id,
      db,
      showEffect,
      setCompanies: (mode, companyId) => {
        const nextCompanyIds = setCompanies(mode, companyId).join(",");
        router.pushState({ "lock cids": nextCompanyIds });
        cookie.setCookie("cids", nextCompanyIds);
        odoo.browser.setTimeout(() => window.location.reload()); // history.pushState is a little async
      },
    };
  },
};
