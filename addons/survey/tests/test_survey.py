# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from freezegun import freeze_time

from odoo import _, fields
from odoo.addons.survey.tests import common
from odoo.tests.common import users


class TestSurveyInternals(common.TestSurveyCommon):

    def test_answer_attempts_count(self):
        """ As 'attempts_number' and 'attempts_count' are computed using raw SQL queries, let us
        test the results. """

        test_survey = self.env['survey.survey'].create({
            'title': 'Test Survey',
            'is_attempts_limited': True,
            'attempts_limit': 4
        })

        first_attempt = self._add_answer(test_survey, self.survey_user.partner_id, **{'state': 'done'})
        second_attempt = self._add_answer(test_survey, self.survey_user.partner_id, **{'state': 'done'})
        third_attempt = self._add_answer(test_survey, self.survey_user.partner_id, **{'state': 'done'})
        fourth_attempt = self._add_answer(test_survey, self.survey_user.partner_id, **{'state': 'done'})

        self.assertEqual(first_attempt.attempts_number, 1)
        self.assertEqual(first_attempt.attempts_count, 4)

        self.assertEqual(second_attempt.attempts_number, 2)
        self.assertEqual(second_attempt.attempts_count, 4)

        self.assertEqual(third_attempt.attempts_number, 3)
        self.assertEqual(third_attempt.attempts_count, 4)

        self.assertEqual(fourth_attempt.attempts_number, 4)
        self.assertEqual(fourth_attempt.attempts_count, 4)

    @freeze_time("2020-02-15 18:00")
    def test_answer_display_name(self):
        """ The "answer_display_name field in a survey.user_input.line is a computed field that will
        display the answer label for any type of question.
        Let us test the various question types. """

        questions = self._create_one_question_per_type()
        user_input = self._add_answer(self.survey, self.survey_user.partner_id)

        for question in questions:
            if question.question_type == 'char_box':
                question_answer = self._add_answer_line(question, user_input, 'Char box answer')
                self.assertEqual(question_answer.answer_display_name, 'Char box answer')
            elif question.question_type == 'text_box':
                question_answer = self._add_answer_line(question, user_input, 'Text box answer')
                self.assertEqual(question_answer.answer_display_name, 'Text box answer')
            elif question.question_type == 'numerical_box':
                question_answer = self._add_answer_line(question, user_input, 7)
                self.assertEqual(question_answer.answer_display_name, '7.0')
            elif question.question_type == 'date':
                question_answer = self._add_answer_line(question, user_input, fields.Datetime.now())
                self.assertEqual(question_answer.answer_display_name, '2020-02-15')
            elif question.question_type == 'datetime':
                question_answer = self._add_answer_line(question, user_input, fields.Datetime.now())
                self.assertEqual(question_answer.answer_display_name, '2020-02-15 18:00:00')
            elif question.question_type == 'simple_choice':
                question_answer = self._add_answer_line(question, user_input, question.suggested_answer_ids[0].id)
                self.assertEqual(question_answer.answer_display_name, 'SChoice0')
            elif question.question_type == 'multiple_choice':
                question_answer_1 = self._add_answer_line(question, user_input, question.suggested_answer_ids[0].id)
                self.assertEqual(question_answer_1.answer_display_name, 'MChoice0')
                question_answer_2 = self._add_answer_line(question, user_input, question.suggested_answer_ids[1].id)
                self.assertEqual(question_answer_2.answer_display_name, 'MChoice1')
            elif question.question_type == 'matrix':
                question_answer_1 = self._add_answer_line(question, user_input,
                    question.suggested_answer_ids[0].id, **{'answer_value_row': question.matrix_row_ids[0].id})
                self.assertEqual(question_answer_1.answer_display_name, 'Column0: Row0')
                question_answer_2 = self._add_answer_line(question, user_input,
                    question.suggested_answer_ids[0].id, **{'answer_value_row': question.matrix_row_ids[1].id})
                self.assertEqual(question_answer_2.answer_display_name, 'Column0: Row1')

    @users('survey_manager')
    def test_answer_validation_mandatory(self):
        """ For each type of question check that mandatory questions correctly check for complete answers """
        for question in self._create_one_question_per_type():
            self.assertDictEqual(
                question.validate_question(''),
                {question.id: 'TestError'}
            )

    @users('survey_manager')
    def test_answer_validation_date(self):
        question = self._add_question(
            self.page_0, 'Q0', 'date', validation_required=True,
            validation_min_date='2015-03-20', validation_max_date='2015-03-25', validation_error_msg='ValidationError')

        self.assertEqual(
            question.validate_question('Is Alfred an answer ?'),
            {question.id: _('This is not a date')}
        )

        self.assertEqual(
            question.validate_question('2015-03-19'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('2015-03-26'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('2015-03-25'),
            {}
        )

    @users('survey_manager')
    def test_answer_validation_numerical(self):
        question = self._add_question(
            self.page_0, 'Q0', 'numerical_box', validation_required=True,
            validation_min_float_value=2.2, validation_max_float_value=3.3, validation_error_msg='ValidationError')

        self.assertEqual(
            question.validate_question('Is Alfred an answer ?'),
            {question.id: _('This is not a number')}
        )

        self.assertEqual(
            question.validate_question('2.0'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('4.0'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('2.9'),
            {}
        )

    @users('survey_manager')
    def test_answer_validation_char_box_email(self):
        question = self._add_question(self.page_0, 'Q0', 'char_box', validation_email=True)

        self.assertEqual(
            question.validate_question('not an email'),
            {question.id: _('This answer must be an email address')}
        )

        self.assertEqual(
            question.validate_question('email@example.com'),
            {}
        )

    @users('survey_manager')
    def test_answer_validation_char_box_length(self):
        question = self._add_question(
            self.page_0, 'Q0', 'char_box', validation_required=True,
            validation_length_min=2, validation_length_max=8, validation_error_msg='ValidationError')

        self.assertEqual(
            question.validate_question('l'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('waytoomuchlonganswer'),
            {question.id: 'ValidationError'}
        )

        self.assertEqual(
            question.validate_question('valid'),
            {}
        )

    def test_partial_scores_simple_choice(self):
        """" Check that if partial scores are given for partially correct answers, in the case of a multiple
        choice question with single choice, choosing the answer with max score gives 100% of points. """

        partial_scores_survey = self.env['survey.survey'].create({
            'title': 'How much do you know about words?',
            'scoring_type': 'scoring_with_answers',
            'scoring_success_min': 90.0,
        })
        [a_01, a_02, a_03] = self.env['survey.question.answer'].create([{
            'value': 'A thing full of letters.',
            'answer_score': 1.0
        }, {
            'value': 'A unit of language, [...], carrying a meaning.',
            'answer_score': 4.0,
            'is_correct': True
        }, {
            'value': '42',
            'answer_score': -4.0
        }])
        q_01 = self.env['survey.question'].create({
            'survey_id': partial_scores_survey.id,
            'title': 'What is a word?',
            'sequence': 1,
            'question_type': 'simple_choice',
            'suggested_answer_ids': [(6, 0, (a_01 | a_02 | a_03).ids)]
        })

        user_input = self.env['survey.user_input'].create({'survey_id': partial_scores_survey.id})
        self.env['survey.user_input.line'].create({
            'user_input_id': user_input.id,
            'question_id': q_01.id,
            'answer_type': 'suggestion',
            'suggested_answer_id': a_02.id
        })

        # Check that scoring is correct and survey is passed
        self.assertEqual(user_input.scoring_percentage, 100)
        self.assertTrue(user_input.scoring_success)

    @users('survey_manager')
    def test_skipped_values(self):
        """ Create one question per type of questions.
        Make sure they are correctly registered as 'skipped' after saving an empty answer for each
        of them. """

        questions = self._create_one_question_per_type()
        survey_user = self.survey._create_answer(user=self.survey_user)

        for question in questions:
            answer = '' if question.question_type in ['char_box', 'text_box'] else None
            survey_user.save_lines(question, answer)

        for question in questions:
            self._assert_skipped_question(question, survey_user)
