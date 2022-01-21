odoo.define('knowledge.wysiwyg', function (require) {
'use strict';

const core = require('web.core');
const QWeb = core.qweb;

const { DocumentWidget } = require('wysiwyg.widgets.media');
const MediaDialog = require('wysiwyg.widgets.MediaDialog');
const Link = require('wysiwyg.widgets.Link');
const weWidgets = require('web_editor.widget');
const Wysiwyg = require('web_editor.wysiwyg');
const { setCursorStart } = require('@web_editor/../lib/odoo-editor/src/OdooEditor');

const CustomDocumentWidget = DocumentWidget.extend({
    /**
     * @param {Object} img
     * @returns {HTMLElement}
     */
    _renderMedia: function (img) {
        let src = '';
        if (img.image_src) {
            src = img.image_src;
            if (!img.public && img.access_token) {
                src += _.str.sprintf('?access_token=%s', img.access_token);
            }
        }

        const dom = $(QWeb.render('knowledge.file_block', {
            img: img,
            src: src
        }));
        this.$media = dom;
        this.media = dom[0];

        // Add mimetype for documents
        if (!img.image_src) {
            this.media.dataset.mimetype = img.mimetype;
        }
        this.$media.trigger('image_changed');
        return this.media;
    }
});

MediaDialog.include({
    /**
     * @param {Object} media
     * @param {Object} options
     * @returns
     */
    getDocumentWidget: function (media, options) {
        return new CustomDocumentWidget(this, media, options);
    }
});

Wysiwyg.include({
    /**
     * @override
     */
    init: function (parent, options) {
        if (options.knowledge_commands) {
            /**
             * knowledge_commands is a view option from a field_html that indicates that knowledge-specific commands should be loaded.
             * powerboxFilters is an array of functions used to filters commands displayed in the powerbox
             */
            if (options.powerboxFilters) {
                options.powerboxFilters.push(this._filterKnowledgeCommandGroupInTemplate);
            } else {
                options.powerboxFilters = [this._filterKnowledgeCommandGroupInTemplate];
            }
        }
        this._super.apply(this, arguments);
    },
    /**
     * Prevent usage of commands from the group "Knowledge" inside the block inserted by the /template Knowledge command.
     * The content of a /template block is destined to be used in odoo-editors in modules other than Knowledge,
     * where knowledge-specific commands are not available.
     * i.e.: one cannot use /template nor /file commands in a /template block (o_knowledge_template) in the OdooEditor
     *
     * @private
     * @param {Array} commands commands available in this wysiwyg
     * @returns {Array} commands that can be used after the filter was applied
     */
    _filterKnowledgeCommandGroupInTemplate: function (commands) {
        let anchor = document.getSelection().anchorNode;
        if (anchor.nodeType != 1) { // nodeType 1 is ELEMENT_NODE
            anchor = anchor.parentElement;
        }
        if (anchor && anchor.closest('.o_knowledge_template')) {
            commands = commands.filter(command => command.groupName != 'Knowledge');
        }
        return commands;
    },
    /**
     * @returns {Array[Object]}
     */
    _getCommands: function () {
        const commands = this._super();
        if (this.options.knowledge_commands) {
            commands.push({
                groupName: 'Knowledge',
                title: 'File',
                description: 'Embed a file.',
                fontawesome: 'fa-file',
                callback: () => {
                    this.openMediaDialog({
                        noVideos: true,
                        noImages: true,
                        noIcons: true,
                        noDocuments: false
                    });
                }
            }, {
                groupName: 'Knowledge',
                title: "Template",
                description: "Add a template section.",
                fontawesome: 'fa-pencil-square',
                callback: () => {
                    this._insertTemplate();
                },
            });
        }
        return commands;
    },
    _insertTemplate() {
        // TODO ? move the template in xml file ?
        const templateHtml = `<div class="o_knowledge_toolbar_anchor o_knowledge_template">
                            <div class="o_knowledge_template_content">
                                <p><br></p>
                            </div></div>`;
        const [template] = this.odooEditor.execCommand('insertHTML', templateHtml);
        setCursorStart(template.querySelector('.o_knowledge_template_content > p'));
        const toolbarData = {
            anchor: template,
            type: 'o_knowledge_template',
        };
        $(this.odooEditor.editable).trigger('refresh_knowledge_toolbars', { toolbarsData: [toolbarData] });
        // TODO this.odooEditor.$editable ?
    }
});

const CustomLinkWidget = Link.extend({
    template: 'wysiwyg.widgets.link',
    _getLinkOptions: function () {
        return [];
    },
});

weWidgets.LinkDialog.include({
    /**
     * @param {...any} args
     * @returns
     */
    getLinkWidget: function (...args) {
        return new CustomLinkWidget(this, ...args);
    }
});
});
