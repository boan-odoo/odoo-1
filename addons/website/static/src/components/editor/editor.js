/** @odoo-module */
// Legacy services
import legacyEnv from 'web.commonEnv';
import ajax from 'web.ajax';
import core from 'web.core';

import { getWysiwygClass } from 'web_editor.loader';
import { useService } from '@web/core/utils/hooks';

const { Component, useState, onWillStart, useChildSubEnv, useEffect, onMounted } = owl;

import { WysiwygAdapterComponent } from '../wysiwyg_adapter/wysiwyg';

export class WebsiteEditorComponent extends Component {

    setup() {
        this.iframe = this.props.iframe;
        this.userService = useService('user');
        this.websiteService = useService('website');

        this.state = useState({ edition: false});
        this.websiteContext = useState(this.websiteService.context);

        useChildSubEnv(legacyEnv);

        onWillStart(async () => {
            await ajax.loadXML('/website/static/src/xml/website.editor.xml', core.qweb);
            this.Wysiwyg = await getWysiwygClass({}, ['website.compiled_assets_wysiwyg']);
            this.websiteContext.edition = 'started';
        });

        onMounted(() => {
            this.state.edition = 'launch';
        });

        useEffect(() => {
            if (this.state.edition === 'reload') {
                this.websiteContext.edition = 'loading';
                new Promise((resolve, reject) => {
                    this.iframe.el.addEventListener('load', () => resolve());
                }).then(() => {
                    this.state.edition = 'launch';
                });
                this.iframe.el.contentWindow.location.reload();
            }
        }, () => [this.state.edition]);
    }
}
WebsiteEditorComponent.components = { WysiwygAdapterComponent };
WebsiteEditorComponent.template = 'website.WebsiteEditorComponent';
