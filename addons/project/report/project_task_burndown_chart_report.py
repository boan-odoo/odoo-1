# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from psycopg2 import sql

from odoo import api, fields, models, tools
from odoo.osv import expression
from odoo.tools import OrderedSet


class ReportProjectTaskBurndownChart(models.Model):
    _name = 'project.task.burndown.chart.report'
    _description = 'Burndown Chart'
    _auto = False
    _order = 'date_begin, date_end'

    project_id = fields.Many2one('project.project', readonly=True)
    display_project_id = fields.Many2one('project.project', readonly=True)
    stage_id = fields.Many2one('project.task.type', readonly=True)
    date = fields.Datetime('Date', readonly=True)
    date_start = fields.Datetime('Date Start', readonly=True)
    date_end = fields.Datetime('Date Stop', readonly=True)
    user_ids = fields.Many2many('res.users', relation='project_task_user_rel', column1='task_id', column2='user_id',
                                string='Assignees', readonly=True)
    date_assign = fields.Datetime(string='Assignment Date', readonly=True)
    date_deadline = fields.Date(string='Deadline', readonly=True)
    partner_id = fields.Many2one('res.partner', string='Customer', readonly=True)
    nb_tasks = fields.Integer('# of Tasks', readonly=True, group_operator="sum")

    @api.model
    def read_group(self, domain, fields, groupby, offset=0, limit=None, orderby=False, lazy=True):
        date_group_bys = []
        groupby = [groupby] if isinstance(groupby, str) else list(OrderedSet(groupby))
        for gb in groupby:
            if gb.startswith('date:'):
                date_group_bys.append(gb.split(':')[-1])

        date_domains = []
        for gb in date_group_bys:
            date_domains = expression.OR([date_domains, [('date_group_by', '=', gb)]])
        domain = expression.AND([domain, date_domains])

        res = super().read_group(domain, fields, groupby, offset=offset, limit=limit, orderby=orderby, lazy=lazy)
        return res

    def init(self):
        query = """
-- Here we compute all previous stage in tracking values
-- We're missing the last reached stage
-- And the tasks without any stage change (which, by definition, are at the last stage)
SELECT pt.project_id,
        pt.id as task_id,
        pt.display_project_id,
        COALESCE(LAG(mm.date) OVER (PARTITION BY mm.res_id ORDER BY mm.id), pt.create_date) as date_begin,
        mm.date as date_end,
        mtv.old_value_integer as stage_id,
        pt.date_assign,
        pt.date_deadline,
        pt.partner_id
  FROM project_task pt
  JOIN mail_message mm ON mm.res_id = pt.id
                      AND mm.message_type = 'notification'
                      AND mm.model = 'project.task'
  JOIN mail_tracking_value mtv ON mm.id = mtv.mail_message_id
  JOIN ir_model_fields imf ON mtv.field = imf.id
                          AND imf.model = 'project.task'
                          AND imf.name = 'stage_id'
  JOIN project_task_type_rel pttr ON pttr.type_id = mtv.old_value_integer
                          AND pttr.project_id = pt.project_id
  WHERE pt.active

--We compute the last reached stage
UNION ALL

SELECT pt.project_id,
        pt.id as task_id,
        pt.display_project_id,
        COALESCE(md.date, pt.create_date) as date_begin,
        (CURRENT_DATE + interval '1 month')::date as date_end,
        pt.stage_id,
        pt.date_assign,
        pt.date_deadline,
        pt.partner_id
  FROM project_task pt
  LEFT JOIN LATERAL (SELECT mm.date
                  FROM mail_message mm
                  JOIN mail_tracking_value mtv ON mm.id = mtv.mail_message_id
                  JOIN ir_model_fields imf ON mtv.field = imf.id
                                          AND imf.model = 'project.task'
                                          AND imf.name = 'stage_id'
                  WHERE mm.res_id = pt.id
                    AND mm.message_type = 'notification'
                    AND mm.model = 'project.task'
              ORDER BY mm.id DESC
                  FETCH FIRST ROW ONLY) md ON TRUE
  WHERE pt.active
        """

        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute(
            sql.SQL("CREATE or REPLACE VIEW {} as ({})").format(
                sql.Identifier(self._table),
                sql.SQL(query)
            )
        )
