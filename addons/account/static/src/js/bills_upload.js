odoo.define('account.upload.bill.mixin', function (require) {
"use strict";

    var core = require('web.core');
    var qweb = core.qweb;

    var UploadBillMixin = {
        events: {
            'click .o_button_upload_bill': '_onUpload',
            'change .o_vendor_bill_upload .o_form_binary_form': '_onAddAttachment',
            'drop .o_drop_area': '_onDrop',
            'dragenter .o_content, .o_kanban_view': '_highlight',
            'dragleave .o_drop_area': '_unhighlight',
            'dragover .o_drop_area': '_clear',
        },

        start: function () {
            var self = this;
            // define a unique uploadId and a callback method
            this.fileUploadID = _.uniqueId('account_bill_file_upload');
            $(window).on(this.fileUploadID, this._onFileUploaded.bind(this));
            return this._super.apply(this, arguments).then(function() {self._addDropZone()});

        },

        reload: async function () {
            var self = this;
            await this._super.apply(this, arguments).then(function() {self._addDropZone()});
        },

        _addDropZone: function() {
            this.$(this._dropZone).prepend($(qweb.render('account.BillDropZone')));
        },

        _onAddAttachment: function (ev) {
            // Auto submit form once we've selected an attachment
            var $input = $(ev.currentTarget).find('input.o_input_file');
            if ($input.val() !== '') {
                var $binaryForm = this.$('.o_vendor_bill_upload form.o_form_binary_form');
                $binaryForm.submit();
            }
        },

        _onFileUploaded: function () {
            // Callback once attachment have been created, create a bill with attachment ids
            var self = this;
            var attachments = Array.prototype.slice.call(arguments, 1);
            // Get id from result
            var attachent_ids = attachments.reduce(function(filtered, record) {
                if (record.id) {
                    filtered.push(record.id);
                }
                return filtered;
            }, []);
            return this._rpc({
                model: 'account.journal',
                method: 'create_invoice_from_attachment',
                args: ["", attachent_ids],
                context: this.initialState.context,
            }).then(function(result) {
                self.do_action(result);
            });
        },

        _createForm: function() {
            // If hidden upload form don't exists, create it
            var $formContainer = this.$('.o_content').find('.o_vendor_bill_upload');
            if (!$formContainer.length) {
                $formContainer = $(qweb.render('account.BillsHiddenUploadForm', {widget: this}));
                $formContainer.appendTo(this.$('.o_content'));
            }
        },

        _onUpload: function (ev) {
            this._createForm();
            // Trigger the input to select a file
            this.$('.o_vendor_bill_upload .o_input_file').click();
        },

        _highlight: function(ev) {
            $('.o_drop_area').show();
        },

        _unhighlight: function(ev) {
            $('.o_drop_area').hide();
        },

        _clear: function(ev) {
            ev.preventDefault();
        },

        _onDrop: function (ev) {
            ev.preventDefault();
            this._createForm();
            this.$('.o_vendor_bill_upload .o_input_file')[0].files = ev.originalEvent.dataTransfer.files;
            this.$('.o_form_binary_form')[0].submit();
            this._unhighlight(ev);
        },
    }
    return UploadBillMixin;
});


odoo.define('account.bills.tree', function (require) {
"use strict";
    var core = require('web.core');
    var ListController = require('web.ListController');
    var ListView = require('web.ListView');
    var UploadBillMixin = require('account.upload.bill.mixin');
    var viewRegistry = require('web.view_registry');

    var BillsListController = ListController.extend({_dropZone: '.o_content'}, UploadBillMixin, {
        buttons_template: 'BillsListView.buttons',
        events: _.extend({}, ListController.prototype.events, UploadBillMixin.events),
    });

    var BillsListView = ListView.extend({
        config: _.extend({}, ListView.prototype.config, {
            Controller: BillsListController,
        }),
    });

    viewRegistry.add('account_tree', BillsListView);
});

odoo.define('account.bills.kanban', function (require) {
    var KanbanController = require('web.KanbanController');
    var KanbanView = require('web.KanbanView');
    var UploadBillMixin = require('account.upload.bill.mixin');
    var viewRegistry = require('web.view_registry');

    var BillsKanbanController = KanbanController.extend({_dropZone: '.o_content'}, UploadBillMixin, {
        buttons_template: 'BillsKanbanView.buttons',
        events: _.extend({}, KanbanController.prototype.events, UploadBillMixin.events),
    });

    var BillsKanbanView = KanbanView.extend({
        config: _.extend({}, KanbanView.prototype.config, {
            Controller: BillsKanbanController,
        }),
    });

    viewRegistry.add('account_bills_kanban', BillsKanbanView);
});

odoo.define('account.dashboard.kanban', function (require) {
"use strict";
    var KanbanController = require('web.KanbanController');
    var KanbanView = require('web.KanbanView');
    var UploadBillMixin = require('account.upload.bill.mixin');
    var viewRegistry = require('web.view_registry');

    var DashboardKanbanController = KanbanController.extend({_dropZone: '.o_kanban_record'}, UploadBillMixin, {
        events: _.extend({}, KanbanController.prototype.events, UploadBillMixin.events),
        /**
         * We override _onUpload (from the upload bill mixin) to pass default_journal_id
         * and default_move_type in context.
         *
         * @override
         */
        _setBillContext: function(ev) {
            var kanbanRecord = $(ev.currentTarget).closest('.o_kanban_record').data('record');
            this.initialState.context['default_journal_id'] = kanbanRecord.id;
            if (kanbanRecord.recordData.type == 'sale') {
                this.initialState.context['default_move_type'] = 'out_invoice';
            } else if (kanbanRecord.recordData.type == 'purchase') {
                this.initialState.context['default_move_type'] = 'in_invoice';
            } else if (kanbanRecord.recordData.type == 'general') {
               this.initialState.context['default_move_type'] = 'entry';
            } else if (['bank', 'cash'].includes(kanbanRecord.recordData.type)) {
                // TODO we probably want to import bank statements here
               this.initialState.context['default_move_type'] = 'entry';
            }
        },

        _onUpload: function (ev) {
            this._setBillContext(ev);
            UploadBillMixin._onUpload.apply(this, arguments);
        },

        _onDrop: function (ev) {
            this._setBillContext(ev);
            UploadBillMixin._onDrop.apply(this, arguments);
        },
    });

    var DashboardKanbanView = KanbanView.extend({
        config: _.extend({}, KanbanView.prototype.config, {
            Controller: DashboardKanbanController,
        }),
    });

    viewRegistry.add('account_dashboard_kanban', DashboardKanbanView);
});
