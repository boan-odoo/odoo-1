/** @odoo-module  */

import { patch } from 'web.utils';
import ProjectRightPanel from '@project/js/right_panel/project_right_panel';

patch(ProjectRightPanel.prototype, '@sale_project/right_panel/project_right_panel', {
});
