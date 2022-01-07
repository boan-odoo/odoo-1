/** @odoo-module **/
import '@mail/../tests/helpers/mock_server'; // ensure mail overrides are applied first
import { patch } from "@web/core/utils/patch";
import { MockServer } from "@web/../tests/helpers/mock_server";
import { MockModels } from '@mail/../tests/helpers/mock_models';


patch(MockServer.prototype, 'hr_holidays', {
    /**
     * Overrides to add visitor information to livechat channels.
     *
     * @override
     */
    _mockMailChannelPartnerInfo(ids, extra_info) {
        const partnerInfos = this._super(...arguments);
        const partners = this.getRecords(
            'res.partner',
            [['id', 'in', ids]],
            { active_test: false },
        );
        for (const partner of partners) {
            // Not a real field but ease the testing
            partnerInfos[partner.id].out_of_office_date_end = partner.out_of_office_date_end;
        }
        return partnerInfos;
    }
});
