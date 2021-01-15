# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict
import json

from odoo.addons.base.tests.common import SavepointCaseWithUserDemo
from odoo.tests.common import TransactionCase, users, warmup, tagged
from odoo.tools import mute_logger, json_default
from odoo import Command


class TestPerformance(SavepointCaseWithUserDemo):

    @classmethod
    def setUpClass(cls):
        super(TestPerformance, cls).setUpClass()
        cls._load_partners_set()

        partner3 = cls.env['res.partner'].search([('name', '=', 'AnalytIQ')], limit=1)
        partner4 = cls.env['res.partner'].search([('name', '=', 'Urban Trends')], limit=1)
        partner10 = cls.env['res.partner'].search([('name', '=', 'Ctrl-Alt-Fix')], limit=1)
        partner12 = cls.env['res.partner'].search([('name', '=', 'Ignitive Labs')], limit=1)

        cls.env['test_performance.base'].create([{
            'name': 'Object 0',
            'value': 0,
            'partner_id': partner3.id,
        }, {
            'name': 'Object 1',
            'value': 10,
            'partner_id': partner3.id,
        }, {
            'name': 'Object 2',
            'value': 20,
            'partner_id': partner4.id,
        }, {
            'name': 'Object 3',
            'value': 30,
            'partner_id': partner10.id,
        }, {
            'name': 'Object 4',
            'value': 40,
            'partner_id': partner12.id,
        }])

    @users('__system__', 'demo')
    @warmup
    def test_read_base(self):
        """ Read records. """
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 5)

        with self.assertQueryCount(__system__=2, demo=2):
            # without cache
            for record in records:
                record.partner_id.country_id.name

        with self.assertQueryCount(0):
            # with cache
            for record in records:
                record.partner_id.country_id.name

        with self.assertQueryCount(0):
            # value_pc must have been prefetched, too
            for record in records:
                record.value_pc

    @users('__system__', 'demo')
    @warmup
    def test_reversed_read_base(self):
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 5)
        with self.assertQueryCount(__system__=1, demo=1):
            # without cache
            for record in reversed(records):
                record.partner_id

        with self.assertQueryCount(__system__=1, demo=1):
            # without cache
            for record in reversed(records):
                record.value_ctx

    @warmup
    def test_read_base_depends_context(self):
        """ Compute in batch even when in cache in another context. """
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 5)

        with self.assertQueryCount(1):
            for record in records.with_context(key=1):
                self.assertEqual(record.value_ctx, 1)

        with self.assertQueryCount(1):
            for record in records.with_context(key=2):
                self.assertEqual(record.value_ctx, 2)

        with self.assertQueryCount(1):
            for record in records:
                self.assertEqual(record.with_context(key=3).value_ctx, 3)

    @users('__system__', 'demo')
    @warmup
    def test_write_base(self):
        """ Write records (no recomputation). """
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 5)

        with self.assertQueryCount(__system__=1, demo=1):
            records.write({'name': 'X'})

    @users('__system__', 'demo')
    @warmup
    def test_write_base_with_recomputation(self):
        """ Write records (with recomputation). """
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 5)

        with self.assertQueryCount(__system__=1, demo=1):
            records.write({'value': 42})

    @mute_logger('odoo.models.unlink')
    @users('__system__', 'demo')
    @warmup
    def test_write_base_one2many(self):
        """ Write on one2many field. """
        rec1 = self.env['test_performance.base'].create({'name': 'X'})

        # create N lines on rec1: O(N) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.create({'value': 0})]})
        self.assertEqual(len(rec1.line_ids), 1)

        with self.assertQueryCount(5):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.create({'value': val}) for val in range(1, 12)]})
        self.assertEqual(len(rec1.line_ids), 12)

        lines = rec1.line_ids

        # update N lines: O(N) queries
        with self.assertQueryCount(6):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.update(line.id, {'value': 42}) for line in lines[0]]})
        self.assertEqual(rec1.line_ids, lines)

        with self.assertQueryCount(26):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.update(line.id, {'value': 42 + line.id}) for line in lines[1:]]})
        self.assertEqual(rec1.line_ids, lines)

        # delete N lines: O(1) queries
        with self.assertQueryCount(14):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.delete(line.id) for line in lines[0]]})
        self.assertEqual(rec1.line_ids, lines[1:])

        with self.assertQueryCount(12):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.delete(line.id) for line in lines[1:]]})
        self.assertFalse(rec1.line_ids)
        self.assertFalse(lines.exists())

        rec1.write({'line_ids': [Command.create({'value': val}) for val in range(12)]})
        lines = rec1.line_ids

        # unlink N lines: O(1) queries
        with self.assertQueryCount(14):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.unlink(line.id) for line in lines[0]]})
        self.assertEqual(rec1.line_ids, lines[1:])

        with self.assertQueryCount(12):
            rec1.invalidate_cache()
            rec1.write({'line_ids': [Command.unlink(line.id) for line in lines[1:]]})
        self.assertFalse(rec1.line_ids)
        self.assertFalse(lines.exists())

        rec1.write({'line_ids': [Command.create({'value': val}) for val in range(12)]})
        lines = rec1.line_ids
        rec2 = self.env['test_performance.base'].create({'name': 'X'})

        # link N lines from rec1 to rec2: O(1) queries
        with self.assertQueryCount(8):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.link(line.id) for line in lines[0]]})
        self.assertEqual(rec1.line_ids, lines[1:])
        self.assertEqual(rec2.line_ids, lines[0])

        with self.assertQueryCount(8):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.link(line.id) for line in lines[1:]]})
        self.assertFalse(rec1.line_ids)
        self.assertEqual(rec2.line_ids, lines)

        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.link(line.id) for line in lines[0]]})
        self.assertEqual(rec2.line_ids, lines)

        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.link(line.id) for line in lines[1:]]})
        self.assertEqual(rec2.line_ids, lines)

        # empty N lines in rec2: O(1) queries
        with self.assertQueryCount(13):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.clear()]})
        self.assertFalse(rec2.line_ids)

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.clear()]})
        self.assertFalse(rec2.line_ids)

        rec1.write({'line_ids': [Command.create({'value': val}) for val in range(12)]})
        lines = rec1.line_ids

        # set N lines in rec2: O(1) queries
        with self.assertQueryCount(8):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.set(lines[0].ids)]})
        self.assertEqual(rec1.line_ids, lines[1:])
        self.assertEqual(rec2.line_ids, lines[0])

        with self.assertQueryCount(6):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.set(lines.ids)]})
        self.assertFalse(rec1.line_ids)
        self.assertEqual(rec2.line_ids, lines)

        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec2.write({'line_ids': [Command.set(lines.ids)]})
        self.assertEqual(rec2.line_ids, lines)

    @mute_logger('odoo.models.unlink')
    def test_write_base_one2many_with_constraint(self):
        """ Write on one2many field with lines being deleted and created. """
        rec = self.env['test_performance.base'].create({'name': 'Y'})
        rec.write({'line_ids': [Command.create({'value': val}) for val in range(12)]})

        # This write() will raise because of the unique index if the unlink() is
        # not performed before the create()
        rec.write({'line_ids': [Command.clear()] + [Command.create({'value': val}) for val in range(6)]})
        self.assertEqual(len(rec.line_ids), 6)

    @mute_logger('odoo.models.unlink')
    @users('__system__', 'demo')
    @warmup
    def test_write_base_many2many(self):
        """ Write on many2many field. """
        rec1 = self.env['test_performance.base'].create({'name': 'X'})

        # create N tags on rec1: O(N) queries
        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.create({'name': 0})]})
        self.assertEqual(len(rec1.tag_ids), 1)

        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.create({'name': val}) for val in range(1, 12)]})
        self.assertEqual(len(rec1.tag_ids), 12)

        tags = rec1.tag_ids

        # update N tags: O(N) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.update(tag.id, {'name': 'X'}) for tag in tags[0]]})
        self.assertEqual(rec1.tag_ids, tags)

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.update(tag.id, {'name': 'X'}) for tag in tags[1:]]})
        self.assertEqual(rec1.tag_ids, tags)

        # delete N tags: O(1) queries
        with self.assertQueryCount(__system__=8, demo=8):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.delete(tag.id) for tag in tags[0]]})
        self.assertEqual(rec1.tag_ids, tags[1:])

        with self.assertQueryCount(__system__=8, demo=8):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.delete(tag.id) for tag in tags[1:]]})
        self.assertFalse(rec1.tag_ids)
        self.assertFalse(tags.exists())

        rec1.write({'tag_ids': [Command.create({'name': val}) for val in range(12)]})
        tags = rec1.tag_ids

        # unlink N tags: O(1) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.unlink(tag.id) for tag in tags[0]]})
        self.assertEqual(rec1.tag_ids, tags[1:])

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec1.write({'tag_ids': [Command.unlink(tag.id) for tag in tags[1:]]})
        self.assertFalse(rec1.tag_ids)
        self.assertTrue(tags.exists())

        rec2 = self.env['test_performance.base'].create({'name': 'X'})

        # link N tags from rec1 to rec2: O(1) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.link(tag.id) for tag in tags[0]]})
        self.assertEqual(rec2.tag_ids, tags[0])

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.link(tag.id) for tag in tags[1:]]})
        self.assertEqual(rec2.tag_ids, tags)

        with self.assertQueryCount(2):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.link(tag.id) for tag in tags[1:]]})
        self.assertEqual(rec2.tag_ids, tags)

        # empty N tags in rec2: O(1) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.clear()]})
        self.assertFalse(rec2.tag_ids)
        self.assertTrue(tags.exists())

        with self.assertQueryCount(2):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.clear()]})
        self.assertFalse(rec2.tag_ids)

        # set N tags in rec2: O(1) queries
        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.set(tags.ids)]})
        self.assertEqual(rec2.tag_ids, tags)

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.set(tags[:8].ids)]})
        self.assertEqual(rec2.tag_ids, tags[:8])

        with self.assertQueryCount(4):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.set(tags[4:].ids)]})
        self.assertEqual(rec2.tag_ids, tags[4:])

        with self.assertQueryCount(3):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.set(tags.ids)]})
        self.assertEqual(rec2.tag_ids, tags)

        with self.assertQueryCount(2):
            rec1.invalidate_cache()
            rec2.write({'tag_ids': [Command.set(tags.ids)]})
        self.assertEqual(rec2.tag_ids, tags)

    @users('__system__', 'demo')
    @warmup
    def test_create_base(self):
        """ Create records. """
        with self.assertQueryCount(__system__=2, demo=2):
            self.env['test_performance.base'].create({'name': 'X'})

    @users('__system__', 'demo')
    @warmup
    def test_create_base_with_lines(self):
        """ Create records with one2many lines. """
        with self.assertQueryCount(__system__=3, demo=3):
            self.env['test_performance.base'].create({
                'name': 'X',
                'line_ids': [Command.create({'value': val}) for val in range(10)],
            })

    @users('__system__', 'demo')
    @warmup
    def test_create_base_with_tags(self):
        """ Create records with many2many tags. """
        with self.assertQueryCount(2):
            self.env['test_performance.base'].create({'name': 'X'})

        # create N tags: add O(N) queries
        with self.assertQueryCount(4):
            self.env['test_performance.base'].create({
                'name': 'X',
                'tag_ids': [Command.create({'name': val}) for val in range(10)],
            })

        # link N tags: add O(1) queries
        tags = self.env['test_performance.tag'].create([{'name': val} for val in range(10)])

        with self.assertQueryCount(3):
            self.env['test_performance.base'].create({
                'name': 'X',
                'tag_ids': [Command.link(tag.id) for tag in tags],
            })

        with self.assertQueryCount(2):
            self.env['test_performance.base'].create({
                'name': 'X',
                'tag_ids': [Command.set([])],
            })

        with self.assertQueryCount(3):
            self.env['test_performance.base'].create({
                'name': 'X',
                'tag_ids': [Command.set(tags.ids)],
            })

    @users('__system__', 'demo')
    @warmup
    def test_several_prefetch(self):
        initial_records = self.env['test_performance.base'].search([])
        self.assertEqual(len(initial_records), 5)
        for _i in range(8):
            self.env.cr.execute(
                'insert into test_performance_base(value) select value from test_performance_base'
            )
        records = self.env['test_performance.base'].search([])
        self.assertEqual(len(records), 1280)

        # should only cause 2 queries thanks to prefetching
        with self.assertQueryCount(__system__=2, demo=2):
            records.mapped('value')

        with self.assertQueryCount(__system__=2, demo=2):
            records.invalidate_cache(['value'])
            records.mapped('value')

        with self.assertQueryCount(__system__=2, demo=2):
            records.invalidate_cache(['value'])
            new_recs = records.browse(records.new(origin=record).id for record in records)
            new_recs.mapped('value')

        # clean up after each pass
        self.env.cr.execute(
            'delete from test_performance_base where id not in %s',
            (tuple(initial_records.ids),)
        )

    def test_prefetch_compute(self):
        records = self.env['test_performance.base'].create([
            {'name': str(i), 'value': i} for i in [1, 2, 3]
        ])
        records.flush()
        records.invalidate_cache()

        # prepare an update, and mark a field to compute
        with self.assertQueries([], flush=False):
            records[1].value = 42

        # fetching 'name' prefetches all fields except 'value_pc' on all records
        # (because 'value_pc' must be computed); reading those fields causes
        # field 'value' to be flushed first
        queries = [
            ''' UPDATE "test_performance_base"
                SET "value"=%s, "write_date"=%s, "write_uid"=%s
                WHERE id IN %s
            ''',
            ''' SELECT "test_performance_base"."id" AS "id",
                       "test_performance_base"."name" AS "name",
                       "test_performance_base"."value" AS "value",
                       "test_performance_base"."partner_id" AS "partner_id",
                       "test_performance_base"."total" AS "total",
                       "test_performance_base"."create_uid" AS "create_uid",
                       "test_performance_base"."create_date" AS "create_date",
                       "test_performance_base"."write_uid" AS "write_uid",
                       "test_performance_base"."write_date" AS "write_date"
                FROM "test_performance_base"
                WHERE "test_performance_base".id IN %s
            ''',
        ]
        with self.assertQueries(queries, flush=False):
            result_name = [record.name for record in records]

        with self.assertQueries([], flush=False):
            result_value = [record.value for record in records]

        # fetching 'value_pc' (missing from above) prefetches all fields on all
        # records except the one to compute
        queries = [
            ''' SELECT "test_performance_base"."id" AS "id",
                       "test_performance_base"."name" AS "name",
                       "test_performance_base"."value" AS "value",
                       "test_performance_base"."partner_id" AS "partner_id",
                       "test_performance_base"."total" AS "total",
                       "test_performance_base"."create_uid" AS "create_uid",
                       "test_performance_base"."create_date" AS "create_date",
                       "test_performance_base"."write_uid" AS "write_uid",
                       "test_performance_base"."write_date" AS "write_date",
                       "test_performance_base"."value_pc" AS "value_pc"
                FROM "test_performance_base"
                WHERE "test_performance_base".id IN %s
            ''',
        ]
        with self.assertQueries(queries, flush=False):
            result_value_pc = [record.value_pc for record in records]

        result = list(zip(result_name, result_value, result_value_pc))
        self.assertEqual(result, [('1', 1, 0.01), ('2', 42, 0.42), ('3', 3, 0.03)])

    def expected_read_group(self):
        groups = defaultdict(list)
        all_records = self.env['test_performance.base'].search([])
        for record in all_records:
            groups[record.partner_id.id].append(record.value)
        partners = self.env['res.partner'].search([('id', 'in', all_records.mapped('partner_id').ids)])
        return [{
            '__domain': [('partner_id', '=', partner.id)],
            'partner_id': (partner.id, partner.display_name),
            'partner_id_count': len(groups[partner.id]),
            'value': sum(groups[partner.id]),
        } for partner in partners]

    @users('__system__', 'demo')
    def test_read_group_with_name_get(self):
        model = self.env['test_performance.base']
        expected = self.expected_read_group()
        # use read_group and check the expected result
        with self.assertQueryCount(__system__=2, demo=2):
            model.invalidate_cache()
            result = model.read_group([], ['partner_id', 'value'], ['partner_id'])
            self.assertEqual(result, expected)

    @users('__system__', 'demo')
    def test_read_group_without_name_get(self):
        model = self.env['test_performance.base']
        expected = self.expected_read_group()
        # use read_group and check the expected result
        with self.assertQueryCount(__system__=1, demo=1):
            model.invalidate_cache()
            result = model.read_group([], ['partner_id', 'value'], ['partner_id'])
            self.assertEqual(len(result), len(expected))
            for res, exp in zip(result, expected):
                self.assertEqual(res['__domain'], exp['__domain'])
                self.assertEqual(res['partner_id'][0], exp['partner_id'][0])
                self.assertEqual(res['partner_id_count'], exp['partner_id_count'])
                self.assertEqual(res['value'], exp['value'])
        # now serialize to json, which should force evaluation
        with self.assertQueryCount(__system__=1, demo=1):
            json.dumps(result, default=json_default)


@tagged('bacon_and_eggs')
class TestIrPropertyOptimizations(TransactionCase):

    def setUp(self):
        super().setUp()
        self.Bacon = self.env['test_performance.bacon']
        self.Eggs = self.env['test_performance.eggs']

    def test_with_falsy_default(self):
        self.assertFalse(self.env['ir.property']._get('property_eggs', 'test_performance.bacon'))

        # warmup
        eggs = self.Eggs.create({})
        self.Bacon.create({})
        self.Bacon.create({'property_eggs': eggs.id})

        # create with default value
        with self.assertQueryCount(1):
            self.Bacon.create({})

        with self.assertQueryCount(1):
            self.Bacon.with_context(default_property_eggs=False).create({})

        with self.assertQueryCount(1):
            self.Bacon.create({'property_eggs': False})

        # create with another value
        with self.assertQueryCount(3):
            self.Bacon.with_context(default_property_eggs=eggs.id).create({})

        with self.assertQueryCount(3):
            self.Bacon.create({'property_eggs': eggs.id})

    def test_with_truthy_default(self):
        eggs = self.Eggs.create({})
        self.env['ir.property']._set_default("property_eggs", "test_performance.bacon", eggs)

        self.assertEqual(eggs, self.env['ir.property']._get('property_eggs', 'test_performance.bacon'))

        # warmup
        self.Bacon.create({})

        # create with default value
        with self.assertQueryCount(1):
            self.Bacon.create({})

        with self.assertQueryCount(1):
            self.Bacon.with_context(default_property_eggs=eggs.id).create({})

        with self.assertQueryCount(1):
            self.Bacon.create({'property_eggs': eggs.id})

        # create with another value
        eggs = self.Eggs.create({})
        self.Bacon.create({'property_eggs': eggs.id})

        with self.assertQueryCount(3):
            self.Bacon.with_context(default_property_eggs=eggs.id).create({})

        with self.assertQueryCount(3):
            self.Bacon.create({'property_eggs': eggs.id})

        with self.assertQueryCount(3):
            self.Bacon.with_context(default_property_eggs=False).create({})

        with self.assertQueryCount(3):
            self.Bacon.create({'property_eggs': False})


@tagged('mapped_perf')
class TestMapped(TransactionCase):

    def test_relational_mapped(self):
        # create 1000 records with one line each
        recs = self.env['test_performance.base'].create([
            {'name': 'foo%d' % index, 'line_ids': [Command.create({'value': index})]}
            for index in range(1000)
        ])
        recs.flush()
        recs.invalidate_cache()

        # expected same performance as recs.line_ids.mapped('value')
        with self.assertQueryCount(3):
            for rec in recs:
                rec.line_ids.mapped('value')
