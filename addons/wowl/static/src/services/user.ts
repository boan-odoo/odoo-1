import type { Odoo } from "../types";

interface Context {
  lang: string;
  tz: string;
  uid: number;
  allowed_company_ids: number[];
  [key: string]: any;
}

interface UserService {
  context: Context;
  userId: number;
  userName: string;
  isAdmin: boolean;
  partnerId: number;
  allowed_companies: [number, string][];
  current_company: [number, string];
  lang: string;
  tz: string;
}

declare const odoo: Odoo;

export const userService = {
  name: "user",
  deploy(): UserService {
    const info = odoo.session_info;
    const { user_context, username, is_admin, partner_id, user_companies } = info;
    let context: Context = {
      lang: user_context.lang,
      tz: user_context.tz,
      uid: info.uid,
      allowed_company_ids: user_companies.allowed_companies.map(([id]) => id),
    };
    return {
      context: context,
      get userId() {
        return context.uid;
      },
      userName: username,
      isAdmin: is_admin,
      partnerId: partner_id,
      allowed_companies: user_companies.allowed_companies,
      current_company: user_companies.current_company,
      get lang() {
        return context.lang;
      },
      get tz() {
        return context.tz;
      },
    };
  },
};
