/** @odoo-module **/

import { registry } from '@web/core/registry';
import { useService } from '@web/core/utils/hooks';
import { getWysiwygClass } from 'web_editor.loader';
import legacyEnv from 'web.commonEnv';

import { WysiwygAdapterComponent } from '../../components/wysiwyg_adapter/wysiwyg';

const { Component, onWillStart, useEffect, useRef, useState, useChildSubEnv } = owl;

export class WebsiteEditorClientAction extends Component {
    setup() {
        super.setup(...arguments);
        this.websiteService = useService('website');
        this.userService = useService('user');
        this.title = useService('title');

        useChildSubEnv(legacyEnv);

        this.iframeFallbackUrl = '/website/iframefallback';

        this.iframe = useRef('iframe');
        this.iframefallback = useRef('iframefallback');
        this.websiteEditRegistery = registry.category('website_edit');
        this.websiteContext = useState(this.websiteService.context);


        onWillStart(async () => {
            await this.websiteService.fetchWebsites();
            this.initialUrl = await this.websiteService.sendRequest(`/website/force/${this.websiteId}`, { path: this.path });
            this.Wysiwyg = await getWysiwygClass({}, ['website.compiled_assets_wysiwyg']);
        });

        useEffect(() => {
            this.websiteService.currentWebsiteId = this.websiteId;
            this.websiteService.context.showNewContentModal = this.props.action.context.params && this.props.action.context.params.display_new_content;
            return () => this.websiteService.currentWebsiteId = null;
        }, () => [this.props.action.context.params]);

        useEffect(() => {
            this.iframe.el.addEventListener('load', () => {
                this.currentUrl = this.iframe.el.contentDocument.location.href;
                this.currentTitle = this.iframe.el.contentDocument.title;
                history.pushState({}, this.currentTitle, this.currentUrl);
                this.title.setParts({ action: this.currentTitle });

                this.websiteService.pageDocument = this.iframe.el.contentDocument;
                this.websiteService.contentWindow = this.iframe.el.contentWindow;

                this.iframe.el.contentWindow.addEventListener('beforeunload', () => {
                    this.iframefallback.el.contentDocument.body.replaceWith(this.iframe.el.contentDocument.body.cloneNode(true));
                    $().getScrollingElement(this.iframefallback.el.contentDocument)[0].scrollTop = $().getScrollingElement(this.iframe.el.contentDocument)[0].scrollTop;
                });
            });
        });
    }

    get websiteId() {
        let websiteId = this.props.action.context.params && this.props.action.context.params.website_id;
        if (!websiteId) {
            websiteId = this.websiteService.currentWebsite && this.websiteService.currentWebsite.id;
        }
        if (!websiteId) {
            websiteId = this.websiteService.websites[0].id;
        }
        return websiteId;
    }

    get path() {
        let path = this.props.action.context.params && this.props.action.context.params.path;
        if (!path) {
            path = '/';
        }
        return path;
    }
}
WebsiteEditorClientAction.template = 'website.WebsiteEditorClientAction';
WebsiteEditorClientAction.components = { WysiwygAdapterComponent };

registry.category('actions').add('website_editor', WebsiteEditorClientAction);
