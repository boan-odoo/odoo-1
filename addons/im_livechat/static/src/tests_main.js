/** @odoo-module **/

import { populateRegistriesFunctions } from '@mail/tests_main';

import { populateRegistries } from '@im_livechat/model/populate_registries';

populateRegistriesFunctions.push(populateRegistries);
