/* ===================================================
 * bootstrap-tagmanager.js v3.0
 * http://welldonethings.com/tags/manager
 * ===================================================
 * Copyright 2012 Max Favilli modified by David Meyers
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
 * ========================================================== */

(function($) {

    "use strict";

    var defaults = {
        prefilled: null,
        CapitalizeFirstLetter: false,
        preventSubmitOnEnter: true,
        isClearInputOnEsc: true,
        typeahead: false,
        typeaheadAjaxSource: null,
        typeaheadAjaxPolling: false,
        typeaheadOverrides: null,
        typeaheadSource: null,
        AjaxPush: null,
        AjaxPushAllTags: null,
        delimeters: [44, 188, 13, 9],
        backspace: [8],
        maxTags: 0,
        hiddenTagListName: null,
        hiddenTagListId: null,
        deleteTagsOnBackspace: true,
        tagsContainer: null,
        tagCloseIcon: 'x',
        tagClass: '',
        validator: null,
        onlyTagList: false
    },
    TypeaheadOverrides = (function () {
        function TypeaheadOverrides() {
            this.instanceSelectHandler = null;
            this.selectedClass = "selected";
            this.select = null;
            if ("typeahead" in $.fn) {
                this.instanceSelectHandler = $.fn.typeahead.Constructor.prototype.select;
                this.select = function (overrides) {
                    this.$menu.find(".active").addClass(overrides.selectedClass);
                    overrides.instanceSelectHandler.apply(this, arguments);
                };
            }
        }
        return TypeaheadOverrides;
    }()),
    publicMethods = {
        pushTag : function (tag, isValid) {
            isValid = (typeof isValid === 'boolean') ? isValid : true;

            var $self = this,
            tlis = $self.data("tlis"),
            tlid = $self.data("tlid"),
            tlisLowerCase = tlis.map(function(elem) {
                return elem.toLowerCase();
            }),
            tagIdx = -1,
            max = Math.max.apply(null, tlid),
            tagId,
            newTagId,
            newTagRemoveId,
            html = '';

            if (!tag || !isValid || tag.length <= 0) { return; }

            if ($self.data('opts').onlyTagList) {
                if ($self.data('opts').typeaheadSource != null) {
                    if (($.inArray(tag, $self.data('opts').typeaheadSource)) == -1) {
                        return;
                    }
                }
            }

            if ($self.data('opts').CapitalizeFirstLetter && tag.length > 1) {
                tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
            }

            // call the validator (if any) and do not let the tag pass if invalid
            if ($.isFunction($self.data('opts').validator)) {
                if (!$self.data('opts').validator(tag)) return;
            }

            // dont accept new tags beyond the defined maximum
            if ($self.data('opts').maxTags > 0 && tlis.length >= $self.data('opts').maxTags) return;

            tagIdx = $.inArray(tag.toLowerCase(), tlisLowerCase);

            if (-1 != tagIdx) {
                $("#" + $self.data('tag_prefix') + "_" + tlid[tagIdx]).stop()
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_1}, 100)
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_2}, 100)
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_1}, 100)
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_2}, 100)
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_1}, 100)
                    .animate({backgroundColor: $self.data('opts').blinkBGColor_2}, 100);
            } else {
                max = (max == -Infinity) ? 0 : max;
                tagId = ++max;
                tlis.push(tag);
                tlid.push(tagId);

                if ($self.data('opts').AjaxPush != null) {
                    $.post($self.data('opts').AjaxPush, {tag: tag});
                }

                newTagId = $self.data('tag_prefix') + '_' + tagId;
                newTagRemoveId = $self.data('tag_prefix') + '_Remover_' + tagId;
                html += '<span class="myTag' + ($self.data('opts').tagClass ? ' ' + $self.data('opts').tagClass : '') + '" '+
                    'id="' + newTagId + '"><span>' + tag + '&nbsp;&nbsp;</span><a href="#" class="myTagRemover" '+
                    'id="'+newTagRemoveId + '" TagIdToRemove="' + tagId + '" title="Remove">' + $self.data('opts').tagCloseIcon + '</a></span>';

                if ($self.data('opts').tagsContainer != null) {
                    $($self.data('opts').tagsContainer).append(html);
                } else {
                    $self.before(html);
                }

                $("#" + newTagRemoveId).on("click", function(e) {
                    e.preventDefault();
                    var TagIdToRemove = parseInt($(this).attr("TagIdToRemove"));
                    privateMethods.spliceTag.call($self,TagIdToRemove, e.data);
                });

                privateMethods.refreshHiddenTagList.call($self);

                if ($self.data('opts').maxTags > 0 && tlis.length >= $self.data('opts').maxTags) {
                    $self.hide();
                }

                $self.trigger('tags:add');
            }
            $self.val("");
        },
        popTag : function () {
            var $self = this;
            if ($self.data("tlid").length > 0) {
                privateMethods.spliceTag.call($self,$self.data("tlid")[$self.data("tlid").length - 1]);
            }
        },
        empty : function () {
            var $self = this;
            while ($self.data("tlid").length > 0) {
                privateMethods.spliceTag.call($self,$self.data("tlid")[0]);
            }
        }
    },
    privateMethods = {
        init : function (options) {
            defaults.typeaheadOverrides =  new TypeaheadOverrides();

            var opts = $.extend({}, defaults, options);

            opts.hiddenTagListName = (opts.hiddenTagListName === null)
                ? 'hidden-' + this.attr('name')
                : opts.hiddenTagListName;

            this.each(function() {
                var $self = $(this),
                queuedTag = "",
                tagIsValid = false,
                isSelectedFromList = false,
                hiddenTag = $('input[name="' + opts.hiddenTagListName + '"]'),
                html = "",
                prefilled = [];

                if (opts.AjaxPushAllTags) {
                    $self.on('tags:refresh', function(e,taglist) {
                        privateMethods.postTags.call($self,e,taglist);
                    });
                }

                $self.data('opts',opts)
                    .data('tag_prefix', $self.attr('name').replace(/[^\w]/g, '_'))
                    .data('tlis', []).data('tlid', []);

                if (opts.hiddenTagListId == null) {
                    if (hiddenTag.length > 0) {
                        hiddenTag.remove();
                    }

                    html += '<input name="' + opts.hiddenTagListName + '" type="hidden" value="" />';
                    $self.after(html);
                    $self.data('lhiddenTagList', $self.siblings('input[name="' + opts.hiddenTagListName + '"]')[0]);
                } else {
                    $self.data('lhiddenTagList', $('#' + opts.hiddenTagListId));
                }

                if (opts.typeahead) {
                    privateMethods.setupTypeahead.call($self);
                }

                $self.on("focus", function (e) {
                    if ($self.popover) {
                        $self.popover("hide");
                    }
                });

                // clear input field on Esc
                if (opts.isClearInputOnEsc) {
                    $self.on('keyup', function (e) {
                        if (e.which == 27) {
                            $self.val('');
                            e.cancelBubble = true;
                            e.returnValue = false;
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        }
                    });
                }

                // disable submit on enter for this input field
                $self.on('keypress', function (e) {
                    if ($self.popover) {
                        $self.popover('hide');
                    }

                    if (opts.preventSubmitOnEnter) {
                        if (e.which == 13) {
                            e.cancelBubble = true;
                            e.returnValue = false;
                            e.stopPropagation();
                            e.preventDefault();
                            return false;
                        }
                    }

                    if (!('0' in $('.typeahead:visible')) && (-1 != $.inArray(e.which, opts.delimeters))) {
                        //user just entered a valid delimeter
                        tagIsValid = true;
                        publicMethods.pushTag.call($self, privateMethods.trimTag($(this).val(), opts.delimeters), e.data, tagIsValid);
                        e.preventDefault();
                    } else {
                        tagIsValid = false;
                    }

                });

                if (opts.deleteTagsOnBackspace) {
                    $self.on("keydown", function (e) {
                        var p = $.inArray(e.which, opts.backspace), user_input, i;
                        if (-1 != p) {
                            //user just entered backspace or equivalent
                            user_input = $(this).val();
                            if (user_input.length <= 0) {
                                e.preventDefault();
                                publicMethods.popTag.call($self);
                            }
                        }
                    });
                }

                $self.change(function (e) {
                    e.cancelBubble = true;
                    e.returnValue = false;
                    e.stopPropagation();
                    e.preventDefault();

                    var selectedItemClass = opts.typeaheadOverrides.selectedClass,
                    listItemSelector = '.' + selectedItemClass,
                    is_chrome = navigator.userAgent.indexOf('Chrome') > -1,
                    is_explorer = navigator.userAgent.indexOf('MSIE') > -1,
                    is_firefox = navigator.userAgent.indexOf('Firefox') > -1,
                    is_safari = navigator.userAgent.indexOf("Safari") > -1,
                    isClear = false,
                    user_input;

                    if ($self.data('typeahead')) {
                        isSelectedFromList = $self.data('typeahead').$menu.find("*")
                            .filter(listItemSelector)
                            .hasClass(selectedItemClass);

                        if (isSelectedFromList) {
                            tagIsValid = true;
                        }
                    }

                    if (!tagIsValid) {
                        return false;
                    }

                    if (!is_chrome && !is_safari) {
                        $self.focus();
                    }

                    if ($(".typeahead:visible")[0] != undefined) {
                        //when the user click with the mouse on the typeahead li element we get the change event fired twice,
                        //once when the input field loose focus and later with the input field value is replaced with li value
                        isClear = !isSelectedFromList;

                        if (isSelectedFromList) {
                            user_input = $self.data('typeahead').$menu.find(listItemSelector).attr('data-value');
                            user_input = privateMethods.trimTag(user_input, opts.delimeters);
                            if (queuedTag == $(this).val() && queuedTag == user_input) {
                                isClear = true;
                            } else {
                                publicMethods.pushTag.call($self, user_input, true);
                                queuedTag = user_input;
                            }
                            isSelectedFromList = false;
                            $self.data('typeahead').$menu.find(listItemSelector).removeClass(selectedItemClass);
                        }

                        if (isClear) {
                            queuedTag = "";
                            $self.val(queuedTag);
                        }
                    } else {
                        user_input = $self.val();
                        user_input = privateMethods.trimTag(user_input, opts.delimeters);
                        publicMethods.pushTag.call($self, user_input, true);
                    }

                    tagIsValid = false;

                    return false;
                });

                if (true || !opts.typeahead) {
                    $self.on("blur", function (e) {
                        //lost focus
                        e.cancelBubble = true;
                        e.returnValue = false;
                        e.stopPropagation();
                        e.preventDefault();

                        var push = true, user_input;

                        if (opts.typeahead) {
                            push = ($(".typeahead:visible")[0] != undefined) ? false : true;
                        }

                        if (push) {
                            user_input = $self.val();
                            user_input = privateMethods.trimTag(user_input, opts.delimeters);
                            publicMethods.pushTag.call($self, user_input, tagIsValid);
                        }

                        return false;
                    });
                }

                if (opts.prefilled != null) {
                    if (typeof (opts.prefilled) == "object") {
                        prefilled = opts.prefilled;
                    } else if (typeof (opts.prefilled) == "string") {
                        prefilled = opts.prefilled.split(',');
                    }

                    $.each(prefilled, function (key, val) {
                        publicMethods.pushTag.call($self, val, true);
                    });
                }
            });

            return this;
        },
        trimTag : function (tag, delimeters) {
            var txt = $.trim(tag), l = txt.length, t = 0;

            for (var i = l - 1; i >= 0; i--) {
                if (-1 == $.inArray(txt.charCodeAt(i), delimeters)) break;
                t++;
            }

            txt = txt.substring(0, l - t);
            l = txt.length;
            t = 0;

            //remove from head
            for (var i = 0; i < l; i++) {
                if (-1 == $.inArray(txt.charCodeAt(i), delimeters)) break;
                t++;
            }

            txt = txt.substring(t, l);
            return txt;
        },
        spliceTag : function (tagId) {
            var $self = this,
            tlis = $self.data("tlis"),
            tlid = $self.data("tlid"),
            idx = $.inArray(tagId, tlid);

            if (-1 != idx) {
                $("#" + $self.data('tag_prefix') + "_" + tagId).remove();
                tlis.splice(idx, 1);
                tlid.splice(idx, 1);
                privateMethods.refreshHiddenTagList.call($self);
                $self.trigger('tags:remove');
            }

            if ($self.data('opts').maxTags > 0 && tlis.length < $self.data('opts').maxTags) {
                $self.show();
            }
        },
        refreshHiddenTagList : function () {
            var $self = this,
            tlis = $self.data("tlis"),
            lhiddenTagList = $self.data("lhiddenTagList");

            $self.trigger('tags:refresh', tlis.join(","));

            if (lhiddenTagList) {
                $(lhiddenTagList).val(tlis.join(",")).change();
            }
        },
        postTags : function(e, tagstring) {
            var $self = this;
            if ($self.data('opts').AjaxPushAllTags) {
                $.post($self.data('opts').AjaxPushAllTags, {tags: tagstring});
            }
        },
        setTypeaheadSource : function (source) {
            var $self = this;
            $self.data('active', true);
            $self.data('typeahead').source = source;
            $self.data('active', false);
        },
        ajaxPolling : function (query, process) {
            var $self = this;
            if (typeof ($self.data('opts').typeaheadAjaxSource) == "string") {
                $.ajax({
                    cache: false,
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    url: $self.data('opts').typeaheadAjaxSource,
                    data: JSON.stringify({ typeahead: query }),
                    success: function (data) { privateMethods.onTypeaheadAjaxSuccess(data, false, process); }
                });
            }
        },
        setupTypeahead : function () {
            var $self = this;

            if (!$self.typeahead) return;

            if ($self.data('opts').typeaheadSource != null && $.isFunction($self.data('opts').typeaheadSource)) {
                $self.typeahead({ source: $self.data('opts').typeaheadSource });
            } else if ($self.data('opts').typeaheadSource != null) {
                $self.typeahead();
                privateMethods.setTypeaheadSource.call($self, $self.data('opts').typeaheadSource);
            } else if ($self.data('opts').typeaheadAjaxSource != null) {
                if (!$self.data('opts').typeaheadAjaxPolling) {
                    $self.typeahead();
                    if (typeof ($self.data('opts').typeaheadAjaxSource) == "string") {
                        $.ajax({
                            cache: false,
                            type: "POST",
                            contentType: "application/json",
                            dataType: "json",
                            url: $self.data('opts').typeaheadAjaxSource,
                            data: JSON.stringify({ typeahead: "" }),
                            success: function (data) { privateMethods.onTypeaheadAjaxSuccess.call($self, data, true); }
                        });
                    }
                } else if ($self.data('opts').typeaheadAjaxPolling) {
                    $self.typeahead({ source: privateMethods.ajaxPolling.call($self) });
                }
            } else if ($self.data('opts').typeaheadDelegate) {
                $self.typeahead($self.data('opts').typeaheadDelegate);
            }

            if ($self.data('typeahead')) {
                // set the overrided handler
                $self.data('typeahead').select = $.proxy(
                    $self.data('opts').typeaheadOverrides.select,
                    $self.data('typeahead'),
                    $self.data('opts').typeaheadOverrides
                );
            }
        },
        onTypeaheadAjaxSuccess : function(data, isSetTypeaheadSource, process) {
            var $self = this, sourceAjaxArray = [];

            if ("d" in data) {
              data = data.d; // format data if it is an asp.net 3.5 response
            }

            if (data && data.tags) {
                sourceAjaxArray.length = 0;
                $.each(data.tags, function (key, val) {
                    sourceAjaxArray.push(val.tag);
                    if (isSetTypeaheadSource) {
                        privateMethods.setTypeaheadSource.call($self, sourceAjaxArray);
                    }
                });

                if ($.isFunction(process)) {
                    process(sourceAjaxArray);
                }
            }
        },
        log : function (variable) {
            if (typeof console != 'undefined') {
                console.log(variable);
            }
        }
    };

    $.fn.tagsManager = function(method) {
        var $self = $(this);
        if ( publicMethods[method] ) {
            return publicMethods[method].apply($self, Array.prototype.slice.call(arguments, 1));
        } else if ( typeof method === 'object' || ! method ) {
            return privateMethods.init.apply(this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist.' );
            return false;
        }
    };
}(jQuery));
