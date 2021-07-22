odoo.define('hr_holidays/static/src/models/partner/partner.js', function (require) {
'use strict';

const {
    registerClassPatchModel,
    registerFieldPatchModel,
    registerInstancePatchModel,
} = require('@discuss/model/model_core');
const { attr, one2one } = require('@discuss/model/model_field');
const { clear } = require('@discuss/model/model_field_command');

const { str_to_datetime } = require('web.time');

registerClassPatchModel('res.partner', 'hr_holidays/static/src/models/partner/partner.js', {
    /**
     * @override
     */
    convertData(data) {
        const data2 = this._super(data);
        if ('out_of_office_date_end' in data) {
            data2.outOfOfficeDateEnd = data.out_of_office_date_end ? data.out_of_office_date_end : clear();
        }
        return data2;
    },
});

registerInstancePatchModel('res.partner', 'hr_holidays/static/src/models/partner/partner.js', {
    /**
     * @private
     */
    _computeOutOfOfficeText() {
        if (!this.outOfOfficeDateEnd) {
            return clear();
        }
        if (!this.env.messaging.locale.language) {
            return clear();
        }
        const currentDate = new Date();
        const date = str_to_datetime(this.outOfOfficeDateEnd);
        const options = { day: 'numeric', month: 'short' };
        if (currentDate.getFullYear() !== date.getFullYear()) {
            options.year = 'numeric';
        }
        const localeCode = this.env.messaging.locale.language.replace(/_/g, '-');
        const formattedDate = date.toLocaleDateString(localeCode, options);
        return _.str.sprintf(this.env._t("Out of office until %s"), formattedDate);
    },

});

registerFieldPatchModel('res.partner', 'hr/static/src/models/partner/partner.js', {
    /**
     * Serves as compute dependency.
     */
    locale: one2one('mail.locale', {
        related: 'messaging.locale',
    }),
    /**
     * Date of end of the out of office period of the partner as string.
     * String is expected to use Odoo's datetime string format
     * (examples: '2011-12-01 15:12:35.832' or '2011-12-01 15:12:35').
     */
    outOfOfficeDateEnd: attr(),
    /**
     * Text shown when partner is out of office.
     */
    outOfOfficeText: attr({
        compute: '_computeOutOfOfficeText',
        dependencies: [
            'locale',
            'outOfOfficeDateEnd',
        ],
    }),
});

});
