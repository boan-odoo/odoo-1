# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import psycopg2
from odoo.exceptions import AccessError, ValidationError, UserError
from odoo.tests.common import tagged, TransactionCase
from odoo.tools import mute_logger

@tagged('access_rights')
class TestKnowledgeArticlePermissions(TransactionCase):
    def test_knowledge_article_constraints(self):
        # create an article without any writer
        with self.assertRaises(ValidationError):
            self.env['knowledge.article'].create({
                'name': 'Test Article',
                'internal_permission': 'read',
                'article_member_ids': [(0, 0, {'partner_id': self.env.ref('base.partner_admin').id, 'permission': 'read'})],
            })
        article = self.env['knowledge.article'].create({
            'name': 'Test Article',
            'internal_permission': 'read',
            'article_member_ids': [(0, 0, {'partner_id': self.env.ref('base.partner_admin').id, 'permission': 'write'})],
        })
        with self.assertRaises(ValidationError):
            article.remove_member(self.env.ref('base.partner_admin').id)
        article.internal_permission = 'write'
        article.remove_member(self.env.ref('base.partner_admin').id)
        with self.assertRaises(ValidationError):
            article.internal_permission = 'none'
        # create an article member twice
        article.invite_member('write', self.env.ref('base.partner_admin').id)
        with self.assertRaises(psycopg2.IntegrityError):
            with mute_logger('odoo.sql_db'), self.cr.savepoint():
                self.env['knowledge.article.member'].create({
                    'partner_id': self.env.ref('base.partner_admin').id,
                    'permission': 'read',
                    'article_id': article.id,
                })

    def test_knowledge_article_values(self):
        article_id = self.env['knowledge.article'].article_create("Test article")
        article = self.env['knowledge.article'].browse(article_id)
        self.assertEqual(article.internal_permission, 'write')
        self.assertEqual(article.category, 'workspace')
        self.assertFalse(article.owner_id)
        # should be equivalent to article.with_user(self.env.ref('base.user_admin')).move_to(private=True)
        article.invite_member('write', self.env.ref('base.partner_admin').id)
        article.internal_permission = 'none'
        self.assertEqual(article.category, 'private')
        self.assertEqual(article.owner_id, self.env.ref('base.user_admin'))
        article.invite_member('read', self.env.ref('base.user_demo').id)
        self.assertEqual(article.category, 'shared')
        self.assertFalse(article.owner_id)

    def test_knowledge_admin_access(self):
        """
        Test that admins are able to:
            read, write, create and delete articles
            read, write, create and delete article members
            change permissions on any article, that is correctly propagated to its children
        """
        with self.with_user('admin'):
            KnowledgeArticle = self.env['knowledge.article']
            article = KnowledgeArticle.create({
                'name': 'Test Article',
                'internal_permission': 'none',
                'article_member_ids': [(0, 0, {'partner_id': self.env.ref('base.partner_demo').id, 'permission': 'write'})]
            })
            # admin should be able to access article even if he doesn't have write permission
            article.write({'name': 'Test Article 2: Revenge of the Admin'})
            child_article = KnowledgeArticle.create({
                'name': 'Child Article',
                'parent_id': article.id,
                'internal_permission': 'none',
                'article_member_ids': [(0, 0, {'partner_id': self.env.ref('base.partner_demo').id, 'permission': 'write'})]
            })
            # if admin changes permissions on the parent, it should also propagate to the child (even if he doesn't have write permission)
            article.move_to(private=False)
            self.assertEqual(child_article.internal_permission, 'write')
            self.assertEqual(child_article.category, 'workspace')

            # set remove article member
            article.remove_member(self.env.ref('base.partner_demo').id)
            # remove the article
            article.unlink()

    def test_knowledge_user_access(self):
        KnowledgeArticle = self.env['knowledge.article'].with_user(self.env.ref('base.user_demo'))
        # create private article
        article_id = KnowledgeArticle.article_create('Test Article')
        article = self.env['knowledge.article'].search([('id', '=', article_id)], limit=1)
        article.invite_member('write', self.env.ref('base.partner_admin').id)

        child_article_1 = article.sudo().create({
            'name': 'First Born Child',
            'parent_id': article.id,
            'internal_permission': 'read',
            'article_member_ids': [
                (0, 0, {'partner_id': self.env.ref('base.partner_demo').id, 'permission': 'write'}),
            ]
        })
        with self.assertRaises(ValidationError):
            # should not be able to write a private article under a public article
            child_article_2 = article.with_user(self.env.ref('base.user_demo')).article_create('Aborted Child', parent_id=article.id, private=True)

        child_article_2 = article.sudo().create({
            'name': 'Child Article 2',
            'parent_id': article.id,
            'internal_permission': 'read',
            'article_member_ids': [
                (0, 0, {'partner_id': self.env.ref('base.partner_admin').id, 'permission': 'write'}),
            ]
        })
        child_article_2.internal_permission = 'read'
        # user should be able to access article since he has write permission
        article.name = 'Test Article 3: The Return of the User'
        article.set_article_permission('none')

        # permissions should be propagated to only child_article_1 since he doesn't have write permission to child_article_2
        self.assertEqual(child_article_1.internal_permission, 'none')
        self.assertEqual(child_article_2.internal_permission, 'read')
        # since parent article is now private, it loses its non-private children
        self.assertFalse(child_article_2.parent_id)

        # user should no longer be able to access article since he no longer has write permission
        with self.assertRaises(AccessError):
            article.write({'name': 'Test Article 4: Lost Hope'})
        with self.assertRaises(AccessError):
            child_article_2.write({'name': 'Second Children: Let Me Write On You'})

        # user should still be able to access child_article_1 since he has write permission
        child_article_1.write({'name': 'Test Article 5: The User Strikes Back'})

        # remove the article
        child_article_1.unlink()

        # try to create an child article to an article that user doesn't have write permission on
        with self.assertRaises(AccessError):
            KnowledgeArticle.create({
                'name': 'Child Article',
                'parent_id': article.id,
                'internal_permission': 'write',
            })
    def test_knowledge_article_children(self):
        """
            private articles can only have private parents
            when changing an article from private to something else, article parent should become false.
            when changing an article from workspace to private: children that user has access to should become private,
            others should get the parent of the current private article. Parents will not change.
        """
        with self.with_user('demo'):
            KnowledgeDemo = self.env['knowledge.article']
            # create a public article
            article_1_id = KnowledgeDemo.article_create('Article 1')
            article_1_1_id = KnowledgeDemo.article_create('Article 1.1', parent_id=article_1_id)
            # attempt to create a private child article
            with self.assertRaises(UserError):
                KnowledgeDemo.article_create('Child Article', parent_id=article_1_1_id, private=True)

            article_1_1_1_id = KnowledgeDemo.article_create('Article 1.1.1', parent_id=article_1_1_id)
            article_1_1_1 = self.env['knowledge.article'].browse(article_1_1_1_id)

            with self.assertRaises(UserError):
                # move to article that doesn't exist
                article_1_1_1.move_to(parent_id=666)
            with self.assertRaises(UserError):
                # move to article that doesn't exist
                article_1_1_1.move_to(before_article_id=666)

            article_1_1_2_id = KnowledgeDemo.article_create('Article 1.1.2', parent_id=article_1_1_id)
            article_1_1_2 = self.env['knowledge.article'].browse(article_1_1_2_id)
            article_1_1_2.invite_member('write', self.env.ref('base.partner_admin').id)
            article_1_1_3_id = KnowledgeDemo.article_create('Article 1.1.3', parent_id=article_1_1_id)
            article_1_1_3 = self.env['knowledge.article'].browse(article_1_1_3_id)
            article_1_1_3.invite_member('read', self.env.ref('base.partner_demo').id)

            article_1_1 = self.env['knowledge.article'].browse(article_1_1_id)
            article_1_1.invite_member('write', self.env.ref('base.partner_demo').id)
            article_1_1_3.remove_member(self.env.ref('base.partner_demo').id)

            article_1_1_2.remove_member(self.env.ref('base.partner_demo').id)
            self.assertIn(self.env.ref('base.partner_demo'), article_1_1_1.sudo().article_member_ids.mapped('partner_id'))
            article_1_1_1.invite_member('write', self.env.ref('base.partner_admin').id)
            # CASE 1: change article from workspace to private
            # current structure
            # workspace:
            #   - Article 1
            #       - Article 1.1 (demo can write)
            #           - Article 1.1.1 (demo, admin can write)
            #           - Article 1.1.2 (admin can write)
            #           - Article 1.1.3 (demo can read)

            article_1_1_3.invite_member('write', self.env.ref('base.partner_admin').id)
            #           - Article 1.1.3 (demo can read, admin can write)
            article_1_1.move_to(private=True)
            # expected structure:
            # workspace:
            #   - Article 1
            #       - Article 1.1.3 (demo can read, admin can write)
            # private:
            #   - Article 1.1 (owner is demo)
            #       - Article 1.1.2 (owner is demo)
            #       - Article 1.1.1 (owner is demo)
            article_1 = self.env['knowledge.article'].browse(article_1_id)
            self.assertEqual(article_1.category, 'workspace')
            self.assertEqual(article_1_1_3.category, 'workspace')
            self.assertFalse(article_1.owner_id)
            self.assertFalse(article_1_1_3.owner_id)
            with self.assertRaises(AccessError):
                article_1_1_3.name = 'Article 1.1.2 (Demo)'
            self.assertIn(article_1_1_1, article_1.child_ids)
            self.assertIn(article_1_1_2, article_1.child_ids)
            self.assertEqual(article_1_1.category, 'private')
            self.assertEqual(article_1_1_2.category, 'private')
            self.assertEqual(article_1_1_1.category, 'private')
            self.assertIn(self.env.ref('base.partner_demo'), article_1_1_1.article_member_ids.mapped('partner_id'))
            self.assertEqual(article_1_1_1.owner_id, self.env.ref('base.user_demo').id)
            self.assertEqual(article_1_1.owner_id, self.env.ref('base.user_demo').id)
            self.assertFalse(article_1_1.parent_id)
            # CASE 2: change article from private to workspace
            article_1_1.move_to(parent_id=article_1_id)
            # expected structure:
            # workspace:
            #   - Article 1
            #       - Article 1.1
            #           - Article 1.1.1
            #           - Article 1.1.2
            #       - Article 1.1.3 (demo can read, admin can write)
            self.assertEqual(article_1_1.category, 'workspace')
            self.assertEqual(article_1_1_1.category, 'workspace')
            self.assertIn(article_1_1_1, article_1_1.child_ids)
            self.assertFalse(article_1_1_1.owner_id)
            self.assertFalse(article_1_1.owner_id)
            self.assertIn(article_1_1, article_1.child_ids)
            self.assertIn(article_1_1_3, article_1.child_ids)
            self.assertNotIn(self.env.ref('base.partner_demo'), article_1_1.article_member_ids.mapped('partner_id'))
            self.assertNotIn(self.env.ref('base.partner_demo'), article_1_1_2.article_member_ids.mapped('partner_id'))
            # try to create non-private article under private article
            private_article_id = KnowledgeDemo.article_create('Private Article', private=True)
            with self.assertRaises(ValidationError):
                KnowledgeDemo.article_create('Public Article', private=False, parent_id=private_article_id)

    def test_article_portal(self):
        # portal user should not be able to read/write/create articles
        with self.with_user('portal'):
            with self.assertRaises(AccessError):
                self.env['knowledge.article'].article_create('Article 1', private=True)
            with self.assertRaises(AccessError):
                self.env['knowledge.article'].search([('name', '=', 'Article')])
            article_id = self.env['knowledge.article'].sudo().article_create('Article 1')
            with self.assertRaises(AccessError):
                self.env['knowledge.article'].browse(article_id).write({'name': 'Article 1 (updated)'})

    def test_member_invite(self):
        article_id = self.env['knowledge.article'].article_create('Favourite Poetry', private=True)
        article = self.env['knowledge.article'].browse(article_id)
        with self.assertRaises(UserError):
            article.invite_member('write')
        with self.assertRaises(ValueError):
            # email should be valid
            article.invite_member('write', email="test")
            partner = self.env['res.partner'].search([('email', '=', 'test')])

        article.invite_member('write', email="test@odoo.com")
        partner = self.env['res.partner'].search([('email', '=', 'test@odoo.com')])
        self.assertIn(partner, article.article_member_ids.mapped('partner_id'))
        article.remove_member(partner.id)
        article.invalidate_cache()
        self.assertNotIn(partner, article.article_member_ids.mapped('partner_id'))
