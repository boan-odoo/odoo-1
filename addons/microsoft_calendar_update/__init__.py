from psycopg2 import sql

def update_microsoft_ids(cr, registry):
    cr.execute("""
        SELECT 1
          FROM ir_module_module
         WHERE name='microsoft_calendar'
           AND state IN ('installed', 'to upgrade')
    """)
    if cr.rowcount:
        for t in ('calendar_event', 'calendar_recurrence'):
            cr.execute(
                sql.SQL(
                    """
                    UPDATE {table}
                    SET microsoft_id = microsoft_id || ':'
                    WHERE microsoft_id IS NOT NULL
                    AND microsoft_id NOT LIKE '%:%'
                    """
                ).format(table=sql.Identifier(t))
            )
