/**
 * ===================================================
 * bootstrap-tagmanager.js v2.0
 * http://welldonethings.com/tags/manager
 * ===================================================
 * Copyright 2012 Max Favilli
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.
 *
 * http://www.mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
 */

jQuery(function() {

"use strict"; // jshint ;_;

jQuery.fn.tagsManager = function(options) {
    var tagManagerOptions = {
        prefilled: null,
        capitalizeFirstLetter: false,
        preventSubmitOnEnter: true,
        typeahead: null,
        ajaxAdd: null,
        ajaxDelete: null,
        delimeters: [44, 188, 13],
        backspace: [8],
        maxTags: 0,
        tagValuesFieldName: "hidden_" + this.attr('name'),
        deleteTagsOnBackspace: true,
        duplicateHandler: null,
        insertTagHandler: null,
        tagCloseHtml:'x',

        /**
         * Strategy refers to how data is stored locally and posted when
         * the form is submitted.
         *
         * comma-delimited: a hidden field will store all tags in a comma delimited list
         *
         * array: multiple hidden fields will each store one tag with a
         *        common hidden_field_name[] If you use this strategy you _must_ change
         *        your tagValuesFieldName to an array[] ending with [] e.g. tags[]
         */
        strategy: 'comma-delimited'
    };

    jQuery.extend(tagManagerOptions, options);

    /**
     * Refresh the selected values tag list hidden field
     */
    jQuery(this).on('refreshTagList', function(e) {
        if (tagManagerOptions.strategy == 'comma-delimited')
            jQuery(jQuery(this).data("tagList")).val(jQuery(this).data("tlis").join(",")).change();
    });


    /**
     * Bind remove tag icon
     */
    jQuery('a.myTagRemover').live('click', function(e) {
        jQuery(jQuery(this).parent().data('tagmanager')).trigger('deleteTag', [ jQuery(this).parent() ]);
        return false;
    });

    /**
     * Empty the tag manager
     */
    jQuery(this).on('emptyTags', function(e) {
        jQuery(this).data("tlis", new Array());
        jQuery(this).data("tlid", new Array());

        var field = this;

        jQuery('[id*="tag_"]').each(function(index, node) {
            if (jQuery(this).data('tagmanager') == field)
                jQuery(this).remove();
        });

        jQuery(this).trigger('refreshTagList');
    });

    /**
     * Delete the last tag
     */
    jQuery(this).on('popTag', function (e) {
        if (jQuery(this).data("tlid").length > 0) {
            var tlid = jQuery(this).data("tlid");
            var id = 'tag_' + tlid[tlid.length - 1];

            jQuery(this).trigger('deleteTag', [ jQuery('#' + id) ]);
        }
    });

    /**
     * Delete a tag
     */
    jQuery(this).on('deleteTag', function(e, tagHtml) {

        var tlis = jQuery(this).data("tlis");
        var tlid = jQuery(this).data("tlid");

        var p = jQuery.inArray(parseInt(jQuery(tagHtml).attr("tagMarker")), tlid)

        if (p != -1) {
            if (tagManagerOptions.ajaxDelete != null) {
                jQuery.ajax({
                    url: tagManagerOptions.ajaxDelete,
                    type: 'post',
                    data: {
                        tag: jQuery(tagHtml).attr('tag')
                    },
                    dataType: 'json'
                });
            }

            tlis.splice(p, 1);
            tlid.splice(p, 1);
            jQuery(tagHtml).remove();
            jQuery(this).trigger('refreshTagList');
        }
    });

    /**
     * Add a new tag
     */
     jQuery(this).on('addTag', function (e, tag, skipAjax) {

        // Trim tag
         var txt = jQuery.trim(tag);

         var l = txt.length;
         var t = 0;

         for (var i = l - 1; i >= 0; i--) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), tagManagerOptions.delimeters)) break;
            t++;
         }

         txt = txt.substring(0, l - t);
         l = txt.length;
         t = 0;

         //remove from head
         for (var i = 0; i < l; i++) {
            if (-1 == jQuery.inArray(txt.charCodeAt(i), tagManagerOptions.delimeters)) break;
            t++;
         }

         tag  = txt.substring(t, l);
        // End trim

         if (!tag || tag.length <= 0) return;

         if (tagManagerOptions.capitalizeFirstLetter) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
         }

         if (tagManagerOptions.validator !== undefined) {
           if ( tagManagerOptions.validator(tag) !== true ) return;
         }

         var tlis = jQuery(this).data("tlis");
         var tlid = jQuery(this).data("tlid");

         if ( tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) return;

        if (jQuery.inArray(tag, tlis) != -1) {
            if (jQuery(this).duplicateHandler) jQuery(this).duplicateHandler(tlid[p]);
            jQuery(this).focus();
            return;
        }

        if (tagManagerOptions.ajaxAdd != null && !skipAjax) {
            jQuery.ajax({
                url: tagManagerOptions.ajaxAdd,
                type: 'post',
                data: {
                    tag: tag
                },
                dataType: 'json'
            });
        }

        var tagId = +new Date(); // fetch ms
        tlis.push(tag);
        tlid.push(tagId);


        var newTagId = 'tag_' + tagId;
        var newTagRemoveId = 'tag_remover_' + tagId;

        var tagHtml = jQuery('<span></span>')
            .addClass('myTag')
            .attr('tag', tag)
            .attr('tagMarker', tagId)
            .attr('id', newTagId)
            .data('tagmanager', this)
            .text(tag);

        if (tagManagerOptions.strategy == 'array') {
            jQuery('<input></input>')
                .attr('type', 'hidden')
                .attr('name', tagManagerOptions.tagValuesFieldName)
                .val(tag)
                .appendTo(tagHtml);
        }


        var tagRemover = jQuery('<a></a>')
            .addClass('myTagRemover')
            .attr('title', 'Remove')
            .attr('href', '#')
            .html(tagManagerOptions.tagCloseHtml)
            .appendTo(tagHtml);

        if(tagManagerOptions.insertTagHandler != null) {
            tagManagerOptions.insertTagHandler(tagHtml);
        }else {
            jQuery(this).before(tagHtml);
        }

        jQuery(this).trigger('refreshTagList');

        if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) {
            jQuery(this).hide();
        }

        jQuery(this).data('typeahead').hide();
        jQuery(this).val('');
        jQuery(this).focus();
    });

    /**
     * Import prefilled tags without triggering ajaxAdd
     */
    jQuery(this).on('importTags', function (e, tags) {
        var field = this;

        if (typeof (tags) == "object") {
            jQuery.each(tags, function (key, val) {
                jQuery(field).trigger('addTag', [ val, true ]);
            });
        } else if (typeof (tags) == "string") {
            jQuery.each(tags.split(','), function (key, val) {
                jQuery(field).trigger('addTag', [ val, true ]);
            });
        }
    });

    /**
     * Prevent submit on enter
     */
    jQuery(this).keypress(function(e) {
        if (tagManagerOptions.preventSubmitOnEnter) {
            if (e.which == 13) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });

    /**
     * If backspace then delete latest tag
     */
    jQuery(this).keydown(function(e) {
        if(!tagManagerOptions.deleteTagsOnBackspace) return;

        if (jQuery.inArray(e.which, tagManagerOptions.backspace) != -1) {
            // backspace or equivalent
            if (!jQuery(this).val()) {
                e.preventDefault();
                jQuery(this).trigger('popTag');
            }
        }
    });

    /**
     * If a delimiting key is pressed, add the current value
     */
    jQuery(this).keyup(function (e) {
        if (jQuery.inArray(e.which, tagManagerOptions.delimeters) != -1) {
            e.preventDefault();

            // If the typeahead is selected use that value else use field value
            if (jQuery(this).data('typeahead').shown
                && jQuery(this).data('typeahead').$menu.find('.active').length
            ) {
                jQuery(this).val(jQuery(this).data('typeahead').$menu.find('.active').attr('data-value'));
            }

            jQuery(this).trigger('addTag', [ jQuery(this).val() ]);
        }
    });

    // store instance specific data
    jQuery(this).data("tlis", new Array()); //list of string tags
    jQuery(this).data("tlid", new Array()); //list of ID of the string tags


    switch (tagManagerOptions.strategy) {
        case 'array':
            break;

        case 'comma-delimited':
        default:
            var hiddenTagsField = jQuery('<input></input')
                .attr('name', tagManagerOptions.tagValuesFieldName)
                .attr('type', 'hidden')
                .val('');

            jQuery(this).after(hiddenTagsField);
            jQuery(this).data("tagList", hiddenTagsField);
            break;
    }

    if (tagManagerOptions.typeahead) {
        jQuery(this).typeahead(tagManagerOptions.typeahead);
    }

    if (tagManagerOptions.prefilled) {
        jQuery(this).trigger('importTags', [ tagManagerOptions.prefilled ]);
    }
}

});
