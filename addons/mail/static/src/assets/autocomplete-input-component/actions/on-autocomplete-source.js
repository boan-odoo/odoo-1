/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            AutocompleteInputComponent/_onAutocompleteSource
        [Action/params]
            record
            req
            res
        [Action/behavior]
            {Dev/comment}
                AKU TODO: change this...
            {if}
                @record
                .{AutocompleteInputComponent/source}
            .{then}
                @record
                .{AutocompleteInputComponent/source}
                    @req
                    @res
`;
