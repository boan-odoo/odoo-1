odoo.define('website_hr_recruitment.tour', function(require) {
    'use strict';

    var tour = require("web_tour.tour");
    function applyForAJob(jobName, applicantInformation) {
        return [{
            content: "Select Job",
            trigger: `.oe_website_jobs h3 span:contains(${jobName})`
        }, {
            content: "Apply",
            trigger: ".js_hr_recruitment a:contains('Apply')"
        }, {
            content: "Complete name",
            trigger: "input[name=partner_name]",
            run: `text ${applicantInformation.name}`
        }, {
            content: "Complete Email",
            trigger: "input[name=email_from]",
            run: `text ${applicantInformation.email}`
        }, {
            content: "Complete phone number",
            trigger: "input[name=partner_phone]",
            run: `text ${applicantInformation.phone}`
        }, {
            content: "Complete Subject",
            trigger: "textarea[name=description]",
            run: `text ${applicantInformation.subject}`
        }, { // TODO: Upload a file ?
            content: "Send the form",
            trigger: ".s_website_form_send"
        }, {
            content: "Check the form is submited without errors",
            trigger: ".oe_structure:has(h1:contains('Congratulations'))"
        }];
    }

    tour.register('website_hr_recruitment_tour', {
        test: true,
        url: '/jobs',
    }, [].concat(
    applyForAJob('Guru',
        {
            name: 'John Smith',
            email: 'john@smith.com',
            phone: '118.218',
            subject: '### [GURU] HR RECRUITMENT TEST DATA ###',
    }), {
            content: "Go back to the jobs page",
            trigger: "body",
            run: function () {
                window.location.href = '/jobs';
            }
    },
    applyForAJob('Internship',
        {
            name: 'Jack Doe',
            email: 'jack@doe.com',
            phone: '118.712',
            subject: '### HR [INTERN] RECRUITMENT TEST DATA ###',
        }),
    ));

    tour.register('website_hr_recruitment_tour_edit_form', {
        test: true,
        url: '/jobs',
    }, [{
        content: 'Go to the Guru job page',
        trigger: 'a[href*="guru"]',
    }, {
        content: 'Go to the Guru job form',
        trigger: 'a[href*="apply"]',
    }, {
        content: 'Check if the Guru form is present',
        trigger: 'form'
    }, {
        content: 'Enter in edit mode',
        trigger: 'a[data-action="edit"]',
    }, {
        content: 'Verify that the editor appeared',
        trigger: 'button[data-action="save"]',
        run: function () {}
    }, {
        content: 'Edit the form',
        trigger: 'input[type="file"]',
    },
    {
        content: 'Add a new field',
        trigger: 'we-button[data-add-field]',
    }, {
        content: 'Save',
        trigger: 'button[data-action="save"]',
    }, {
        content: 'Check that the save is finished',
        trigger: 'a[data-action="edit"]',
    },
    {
        content: 'Go back to /jobs page',
        trigger: 'body',
        run: function () {
            window.location.href = '/jobs';
        }
    }, {
        content: 'Go to the Internship job page',
        trigger: 'a[href*="internship"]',
    }, {
        content: 'Go to the Internship job form',
        trigger: 'a[href*="apply"]',
    }, {
        content: 'Check if the Internship form is present',
        trigger: 'form'
    },
]);

    return {};
});
