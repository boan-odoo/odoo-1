# -*- coding: utf-8 -*-

from odoo.addons.project.tests.test_project_base import TestProjectCommon
from odoo.tests import tagged
from odoo.tests.common import Form

@tagged('-at_install', 'post_install')
class TestProjectSubtasks(TestProjectCommon):
    def test_task_display_project_with_default_form(self):
        """
            Create a task in the default task form should take the project set in the form or the default project in the context
        """
        with self.assertRaises(AssertionError, msg="Should not accept a form without project. Project is required"):
            with Form(self.env['project.task'].with_context({'tracking_disable': True}), view="project.view_task_form2") as task_form:
                task_form.name = 'Test Task 1'

        with Form(self.env['project.task'].with_context({'tracking_disable': True})) as task_form:
            task_form.name = 'Test Task 1'
            task_form.project_id = self.project_pigs
        task = task_form.save()

        self.assertEqual(task.project_id, self.project_pigs, "The project should be assigned.")
        self.assertEqual(task.display_project_id, task.project_id, "The display project of a first layer task should be assigned to project_id.")

        with Form(self.env['project.task'].with_context({'tracking_disable': True, 'default_project_id': self.project_pigs.id})) as task_form:
            task_form.name = 'Test Task 2'
        task = task_form.save()

        self.assertEqual(task.project_id, self.project_pigs, "The project should be assigned from the default project.")
        self.assertEqual(task.display_project_id, task.project_id, "The display project of a first layer task should be assigned to project_id.")

    def test_task_display_project_with_task_form2(self):
        """
            Create a task in the task form 2 should take the project set in the form or the default project in the context
        """
        with self.assertRaises(AssertionError, msg="Should not accept a form without project. Project is required"):
            with Form(self.env['project.task'].with_context({'tracking_disable': True}), view="project.view_task_form2") as task_form:
                task_form.name = 'Test Task 1'

        with Form(self.env['project.task'].with_context({'tracking_disable': True}), view="project.view_task_form2") as task_form:
            task_form.name = 'Test Task 1'
            task_form.project_id = self.project_pigs
        task = task_form.save()

        self.assertEqual(task.project_id, self.project_pigs, "The project should be assigned.")
        self.assertEqual(task.display_project_id, task.project_id, "The display project of a first layer task should be assigned to project_id.")

        with Form(self.env['project.task'].with_context({'tracking_disable': True, 'default_project_id': self.project_pigs.id}), view="project.view_task_form2") as task_form:
            task_form.name = 'Test Task 2'
        task = task_form.save()

        self.assertEqual(task.project_id, self.project_pigs, "The project should be assigned from the default project.")
        self.assertEqual(task.display_project_id, task.project_id, "The display project of a first layer task should be assigned to project_id.")

    def test_task_display_project_with_quick_create_task_form(self):
        """
            Create a task in the quick create form should take the default project in the context
        """
        with Form(self.env['project.task'].with_context({'tracking_disable': True, 'default_project_id': self.project_pigs.id}), view="project.quick_create_task_form") as task_form:
            task_form.name = 'Test Task 2'
        task = task_form.save()

        self.assertEqual(task.project_id, self.project_pigs, "The project should be assigned from the default project.")
        self.assertEqual(task.display_project_id, task.project_id, "The display project of a first layer task should be assigned to project_id.")

    def test_subtask_display_project(self):
        """
            1) Create a subtask
                - Should have the same project as its parent
                - Shouldn't have a display project set.
            2) Set display project on subtask
                - Should not change parent project
                - Should change the subtask project
            3) Reset the display project to False
                - Should make the project equal to parent project
            4) Change parent task project
                - Should make the subtask project follow parent project
            5) Set display project on subtask and change parent task project
                - Should make the subtask project follow new display project id
        """

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            with task_form.child_ids.new() as subtask_form:
                subtask_form.name = 'Test Subtask 1'

        self.assertEqual(self.task_1.child_ids.project_id, self.project_pigs, "The project should be assigned from the default project.")
        self.assertFalse(self.task_1.child_ids.display_project_id, "The display project of a sub task should be false to project_id.")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            with task_form.child_ids.edit(0) as subtask_form:
                subtask_form.display_project_id = self.project_goats

        self.assertEqual(self.task_1.project_id, self.project_pigs, "Changing the project of a subtask should not change parent project")
        self.assertEqual(self.task_1.child_ids.display_project_id, self.project_goats, "Display Project of the task should be well assigned")
        self.assertEqual(self.task_1.child_ids.project_id, self.project_goats, "Changing display project id on a subtask should change project id")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            with task_form.child_ids.edit(0) as subtask_form:
                subtask_form.display_project_id = self.env['project.project']

        self.assertFalse(self.task_1.child_ids.display_project_id, "Display Project of the task should be well assigned, to False")
        self.assertEqual(self.task_1.child_ids.project_id, self.project_pigs, "Resetting display project to False on a subtask should change project id to parent project id")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            task_form.project_id = self.project_goats

        self.assertEqual(self.task_1.project_id, self.project_goats, "Parent project should change.")
        self.assertFalse(self.task_1.child_ids.display_project_id, "Display Project of the task should be False")
        self.assertEqual(self.task_1.child_ids.project_id, self.project_goats, "Resetting display project to False on a subtask should follow project of its parent")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            with task_form.child_ids.edit(0) as subtask_form:
                subtask_form.display_project_id = self.project_goats
            task_form.project_id = self.project_pigs

        self.assertEqual(self.task_1.project_id, self.project_pigs, "Parent project should change back.")
        self.assertEqual(self.task_1.child_ids.display_project_id, self.project_goats, "Display Project of the task should be well assigned")
        self.assertEqual(self.task_1.child_ids.project_id, self.project_goats, "Changing display project id on a subtask should change project id")

        with self.assertRaises(AssertionError):
            with Form(self.task_1.child_ids.with_context({'tracking_disable': True})) as subtask_form:
                subtask_form.display_project_id = self.env['project.project']
                subtask_form.parent_id = self.env['project.task']
                # Should raise an AssertionError as we don't reset the project

        with Form(self.task_1.child_ids.with_context({'tracking_disable': True})) as subtask_form:
            subtask_form.display_project_id = self.env['project.project']
            subtask_form.parent_id = self.env['project.task']
            subtask_form.project_id = self.project_pigs
        child_task = subtask_form.save()

        self.assertEqual(child_task.project_id, self.project_pigs, "Removing parent should not change project")
        self.assertEqual(child_task.display_project_id, self.project_pigs, "Removing parent should make the display project set as project.")

    def test_subtask_stage(self):
        """
            The stage of the new child must be the default one of the project
        """
        stage_a = self.env['project.task.type'].create({'name': 'a', 'sequence': 1})
        stage_b = self.env['project.task.type'].create({'name': 'b', 'sequence': 10})
        self.project_pigs.type_ids |= stage_a
        self.project_pigs.type_ids |= stage_b

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            with task_form.child_ids.new() as subtask_form:
                subtask_form.name = 'Test Subtask 1'

        self.assertEqual(self.task_1.child_ids.stage_id, stage_a, "The stage of the child task should be the default one of the project.")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            task_form.stage_id = stage_b

        self.assertEqual(self.task_1.child_ids.stage_id, stage_a, "The stage of the child task should remain the same while changing parent task stage.")

        with Form(self.task_1.with_context({'tracking_disable': True})) as task_form:
            task_form.child_ids.remove(0)
            with task_form.child_ids.new() as subtask_form:
                subtask_form.name = 'Test Subtask 2'

        self.assertEqual(self.task_1.child_ids.stage_id, stage_a, "The stage of the child task should be the default one of the project even if parent stage id is different.")
