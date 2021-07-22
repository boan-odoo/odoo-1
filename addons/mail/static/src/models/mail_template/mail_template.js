/** @odoo-module **/

import { registerNewModel } from '@discuss/model/model_core';
import { attr, many2many } from '@discuss/model/model_field';

function factory(dependencies) {

    class MailTemplate extends dependencies['discuss.model'] {

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        /**
         * @param {mail.activity} activity
         */
        preview(activity) {
            const action = {
                name: this.env._t("Compose Email"),
                type: 'ir.actions.act_window',
                res_model: 'mail.compose.message',
                views: [[false, 'form']],
                target: 'new',
                context: {
                    default_res_id: activity.thread.id,
                    default_model: activity.thread.model,
                    default_use_template: true,
                    default_template_id: this.id,
                    force_email: true,
                },
            };
            this.env.bus.trigger('do-action', {
                action,
                options: {
                    on_close: () => {
                        activity.thread.refresh();
                    },
                },
            });
        }

        /**
         * @param {mail.activity} activity
         */
        async send(activity) {
            await this.async(() => this.env.services.rpc({
                model: activity.thread.model,
                method: 'activity_send_mail',
                args: [[activity.thread.id], this.id],
            }));
            activity.thread.refresh();
        }

        //----------------------------------------------------------------------
        // Private
        //----------------------------------------------------------------------

        /**
         * @override
         */
        static _createRecordLocalId(data) {
            return `${this.modelName}_${data.id}`;
        }

    }

    MailTemplate.fields = {
        activities: many2many('mail.activity', {
            inverse: 'mailTemplates',
        }),
        id: attr({
            required: true,
        }),
        name: attr(),
    };

    MailTemplate.modelName = 'mail.mail_template';

    return MailTemplate;
}

registerNewModel('mail.mail_template', factory);
