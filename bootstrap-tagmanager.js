/* ===================================================
 * bootstrap-tagmanager.js v2.3
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
 * ========================================================== */

"use strict";

(function (jQuery) {
  if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    console.log = function () { };
  }

  jQuery.fn.tagsManager = function (options,tagToManipulate) {
    var tagManagerOptions = {
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
    };

    var TypeaheadOverrides = (function () {
      function TypeaheadOverrides() {
        this.instanceSelectHandler = null;
        this.selectedClass = "selected";
        this.select = null;
        if ("typeahead" in jQuery.fn) {
          this.instanceSelectHandler = jQuery.fn.typeahead.Constructor.prototype.select;
          this.select = function (overrides) {
            this.$menu.find(".active").addClass(overrides.selectedClass);
            overrides.instanceSelectHandler.apply(this, arguments);
          };
        }
      }
      return TypeaheadOverrides;
    })();

    // exit when no matched elements
    if (!(0 in this)) {
      return this;
    }

    tagManagerOptions.typeaheadOverrides = new TypeaheadOverrides();

    jQuery.extend(tagManagerOptions, options);

    if (tagManagerOptions.hiddenTagListName === null) {
      tagManagerOptions.hiddenTagListName = "hidden-" + this.attr('name');
    }

    var obj = this;
    var objName = obj.attr('name').replace(/[^\w]/g, '_');
    var queuedTag = "";
    var delimeters = tagManagerOptions.delimeters;
    var backspace = tagManagerOptions.backspace;
    var isInitialized = false;

    var setupTypeahead = function () {
      if (!obj.typeahead) return;

      if (tagManagerOptions.typeaheadSource != null && jQuery.isFunction(tagManagerOptions.typeaheadSource)) {
        obj.typeahead({ source: tagManagerOptions.typeaheadSource });
      } else if (tagManagerOptions.typeaheadSource != null) {
        obj.typeahead();
        setTypeaheadSource(tagManagerOptions.typeaheadSource);
      } else if (tagManagerOptions.typeaheadAjaxSource != null) {
        if (!tagManagerOptions.typeaheadAjaxPolling) {
          obj.typeahead();

          if (typeof (tagManagerOptions.typeaheadAjaxSource) == "string") {
            jQuery.ajax({
              cache: false,
              type: "POST",
              contentType: "application/json",
              dataType: "json",
              url: tagManagerOptions.typeaheadAjaxSource,
              data: JSON.stringify({ typeahead: "" }),
              success: function (data) { onTypeaheadAjaxSuccess(data, true); }
            });
          }
        } else if (tagManagerOptions.typeaheadAjaxPolling) {
          obj.typeahead({ source: ajaxPolling });
        }
      } else if (tagManagerOptions.typeaheadDelegate) {
        obj.typeahead(tagManagerOptions.typeaheadDelegate);
      }

      var data = obj.data('typeahead');
      if (data) {
        // set the overrided handler
        data.select = jQuery.proxy(tagManagerOptions.typeaheadOverrides.select,
                                   obj.data('typeahead'),
                                   tagManagerOptions.typeaheadOverrides);
      }
    };

    var onTypeaheadAjaxSuccess = function(data, isSetTypeaheadSource, process) {
      // format data if it is an asp.net 3.5 response
      if ("d" in data) {
        data = data.d;
      }

      if (data && data.tags) {
        var sourceAjaxArray = [];
        sourceAjaxArray.length = 0;
        jQuery.each(data.tags, function (key, val) {
          sourceAjaxArray.push(val.tag);
          if (isSetTypeaheadSource) {
            setTypeaheadSource(sourceAjaxArray);
          }
        });

        if (jQuery.isFunction(process)) {
          process(sourceAjaxArray);
        }
      }
    };

    var setTypeaheadSource = function (source) {
      obj.data('active', true);
      obj.data('typeahead').source = source;
      obj.data('active', false);
    };

    var ajaxPolling = function (query, process) {
      if (typeof (tagManagerOptions.typeaheadAjaxSource) == "string") {
        jQuery.ajax({
          cache: false,
          type: "POST",
          contentType: "application/json",
          dataType: "json",
          url: tagManagerOptions.typeaheadAjaxSource,
          data: JSON.stringify({ typeahead: query }),
          success: function (data) { onTypeaheadAjaxSuccess(data, false, process); }
        });
      }
    };

    var trimTag = function (tag) {
      var txt = jQuery.trim(tag);

      var l = txt.length;
      var t = 0;

      for (var i = l - 1; i >= 0; i--) {
        if (-1 == jQuery.inArray(txt.charCodeAt(i), delimeters)) break;
        t++;
      }

      txt = txt.substring(0, l - t);
      l = txt.length;
      t = 0;

      //remove from head
      for (var i = 0; i < l; i++) {
        if (-1 == jQuery.inArray(txt.charCodeAt(i), delimeters)) break;
        t++;
      }

      txt = txt.substring(t, l);
      return txt;
    };

    var popTag = function () {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      if (tlid.length > 0) {
        var tagId = tlid.pop();
        tlis.pop();
        // console.log("TagIdToRemove: " + tagId);
        jQuery("#" + objName + "_" + tagId).remove();
        refreshHiddenTagList();
        // console.log(tlis);
      }
    };

    var empty = function () {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      while (tlid.length > 0) {
        var tagId = tlid.pop();
        tlis.pop();
        // console.log("TagIdToRemove: " + tagId);
        jQuery("#" + objName + "_" + tagId).remove();
        refreshHiddenTagList();
        // console.log(tlis);
      }
    };

    var refreshHiddenTagList = function () {
      var tlis = obj.data("tlis");
      var lhiddenTagList = obj.data("lhiddenTagList");

      obj.trigger('tags:refresh', tlis.join(","));

      if (lhiddenTagList) {
        jQuery(lhiddenTagList).val(tlis.join(",")).change();
      }
    };

    var spliceTag = function (tagId) {
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      var p = jQuery.inArray(tagId, tlid);

      // console.log("TagIdToRemove: " + tagId);
      // console.log("position: " + p);

      if (-1 != p) {
        jQuery("#" + objName + "_" + tagId).remove();
        tlis.splice(p, 1);
        tlid.splice(p, 1);
        refreshHiddenTagList();
        // console.log(tlis);
      }

      if (tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags) {
        obj.show();
      }
    };

    var pushAllTags = function (e, tagstring) {
      if (tagManagerOptions.AjaxPushAllTags) {
        jQuery.post(tagManagerOptions.AjaxPushAllTags, { tags: tagstring });
      }
    };

    var pushTag = function (tag, objToPush, isValid) {
      if (!tag || (!isValid) || tag.length <= 0) return;

      if(tagManagerOptions.onlyTagList){
        if (tagManagerOptions.typeaheadSource != null) {
          if((jQuery.inArray(tag, tagManagerOptions.typeaheadSource)) == -1){
            return;
          }
        }
      }

      if (tagManagerOptions.CapitalizeFirstLetter && tag.length > 1) {
        tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      }

      // call the validator (if any) and do not let the tag pass if invalid
      if (jQuery.isFunction(tagManagerOptions.validator)) {
        if (!tagManagerOptions.validator(tag)) return;
      }

      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      // dont accept new tags beyond the defined maximum
      if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) return;

      var alreadyInList = false;
      var tlisLowerCase = tlis.map(function(elem) { return elem.toLowerCase(); }); 
      var p = jQuery.inArray(tag.toLowerCase(), tlisLowerCase);
      if (-1 != p) {
        // console.log("tag:" + tag + " !!already in list!!");
        alreadyInList = true;
      }

      if (alreadyInList) {
        var pTagId = tlid[p];
        jQuery("#" + objName + "_" + pTagId).stop()
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100)
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100)
           .animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100);
      } else {
        var max = Math.max.apply(null, tlid);
        max = max == -Infinity ? 0 : max;

        var tagId = ++max;
        tlis.push(tag);
        tlid.push(tagId);

        if (tagManagerOptions.AjaxPush != null) {
          jQuery.post(tagManagerOptions.AjaxPush, { tag: tag });
        }

        // console.log("tagList: " + tlis);

        var newTagId = objName + '_' + tagId;
        var newTagRemoveId = objName + '_Remover_' + tagId;
        var html = '';
        var cl = tagManagerOptions.tagClass ? ' '+tagManagerOptions.tagClass : '';
        html += '<span class="myTag'+cl+'" id="' + newTagId + '"><span>' + tag + '&nbsp;&nbsp;</span><a href="#" class="myTagRemover" id="' + newTagRemoveId + '" TagIdToRemove="' + tagId + '" title="Remove">' + tagManagerOptions.tagCloseIcon + '</a></span> ';

        if (tagManagerOptions.tagsContainer != null) {
            jQuery(tagManagerOptions.tagsContainer).append(html);
        } else {
          obj.before(html);
        }

        jQuery("#" + newTagRemoveId).on("click", obj, function (e) {
          e.preventDefault();
          var TagIdToRemove = parseInt(jQuery(this).attr("TagIdToRemove"));
          spliceTag(TagIdToRemove, e.data);
        });

        refreshHiddenTagList();

        if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) {
          obj.hide();
        }
      }
      obj.val("");
    };

    var initialize = function () {
      if (tagManagerOptions.AjaxPushAllTags) {
        obj.on('tags:refresh', pushAllTags);
      }
    };

    if (!isInitialized) {
      initialize();
    }

    return this.each(function () {

      var tagIsValid = false;
      var isSelectedFromList = false;

      if (typeof options == 'string') {
        switch (options) {
          case "empty":
            empty();
            break;
          case "popTag":
            popTag();
            break;
          case "pushTag":
            pushTag(tagToManipulate, null, true);
            break;
        }
        return;
      }
      
      //let's store some instance specific data directly into the DOM object
      var tlis = new Array();
      var tlid = new Array();
      obj.data("tlis", tlis); //list of string tags
      obj.data("tlid", tlid); //list of ID of the string tags

      if (tagManagerOptions.hiddenTagListId == null) { /* if hidden input not given default activity */
        var hiddenTag = $("input[name='" + tagManagerOptions.hiddenTagListName + "']");
        if (hiddenTag.length > 0) {
          hiddenTag.remove();
        }

        var html = "";
        html += "<input name='" + tagManagerOptions.hiddenTagListName + "' type='hidden' value=''/>";
        obj.after(html);
        obj.data("lhiddenTagList",
           obj.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
        );
      } else {
        obj.data("lhiddenTagList", jQuery('#' + tagManagerOptions.hiddenTagListId))
      }

      if (tagManagerOptions.typeahead) {
        setupTypeahead();
        //obj.typeahead({ source: SourceArray })
      }

      obj.on("focus", function (e) {
        if (jQuery(this).popover) {
          jQuery(this).popover("hide");
          //jQuery(this).popover = null;
        }
      });

      // clear input field on Esc
      if (tagManagerOptions.isClearInputOnEsc) {
        obj.on("keyup", function (e) {
          if (e.which == 27) {
            jQuery(this).val("");
            e.cancelBubble = true;
            e.returnValue = false;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
        });
      }

      // disable submit on enter for this input field
      obj.on("keypress", function (e) {
        if (jQuery(this).popover) {
          jQuery(this).popover("hide");
          //jQuery(this).popover = null;
        }

        if (tagManagerOptions.preventSubmitOnEnter) {
          if (e.which == 13) {
            e.cancelBubble = true;
            e.returnValue = false;
            e.stopPropagation();
            e.preventDefault();
              //e.keyCode = 9;
            return false;
          }
        }

        var p = jQuery.inArray(e.which, delimeters);
        var isKeyInList = '0' in jQuery(".typeahead:visible");
        if (!isKeyInList && (- 1 != p)) {
          //user just entered a valid delimeter
          tagIsValid = true;
          var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
          user_input = trimTag(user_input);
          pushTag(user_input, e.data, tagIsValid);
          e.preventDefault();
          // console.log("pushTag: keypress");
        }
        else {
          tagIsValid = false;
        }

        // console.log("keypress: " + e.which);
      });

      if (tagManagerOptions.deleteTagsOnBackspace) {
        obj.on("keydown", obj, function (e) {
          var p = jQuery.inArray(e.which, backspace);
          if (-1 != p) {
            //user just entered backspace or equivalent
            var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
            var i = user_input.length;
            if (i <= 0) {
              // console.log("backspace detected");
              e.preventDefault();
              popTag();
            }
          }
        });
      }

      obj.change(function (e) {
        e.cancelBubble = true;
        e.returnValue = false;
        e.stopPropagation();
        e.preventDefault();

        var selectedItemClass = tagManagerOptions.typeaheadOverrides.selectedClass;
        var listItemSelector = '.' + selectedItemClass;

        // check the typeahead list selection
        var data = $(this).data('typeahead');
        if (data) { 
          isSelectedFromList = $(this).data('typeahead').$menu.find("*")
            .filter(listItemSelector)
            .hasClass(selectedItemClass);

          if (isSelectedFromList) {
            tagIsValid = true;
          }
        }

        if (!tagIsValid) {
          return false;
        }

        var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
        var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
        var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
        var is_safari = navigator.userAgent.indexOf("Safari") > -1;

        if (!is_chrome && !is_safari)
          jQuery(this).focus();

        // console.log('Handler for .change() called, value selected:' + obj.val());
        var ao = jQuery(".typeahead:visible");
        if (ao[0] != undefined) {
          // console.log('change: typeaheadIsVisible is visible');
          //when the user click with the mouse on the typeahead li element we get the change event fired twice, once when the input field loose focus and later with the input field value is replaced with li value

          var isClear = !isSelectedFromList;

          if (isSelectedFromList) {
            // if user selected from list
            var user_input = $(this).data('typeahead').$menu.find(listItemSelector).attr('data-value');
            user_input = trimTag(user_input);
            if (queuedTag == jQuery(this).val() && queuedTag == user_input) {
              isClear = true;
            } else {
              pushTag(user_input, null, true);
              queuedTag = user_input;
              // console.log('Handler for .change() called, typeahead value pushed:' + queuedTag);
            }
            isSelectedFromList = false;
            $(this).data('typeahead').$menu.find(listItemSelector).removeClass(selectedItemClass);
          }

          if (isClear) {
            queuedTag = "";
            jQuery(this).val(queuedTag);
          }
        } else {
          // console.log('change: typeaheadIsVisible is NOT visible');
          var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
          user_input = trimTag(user_input);
          pushTag(user_input, null, true);
          // console.log("pushTag: change ");
        }

        tagIsValid = false;

        return false; //cancel bubble
      });

      if (1 == 1 || !tagManagerOptions.typeahead) {
        obj.on("blur", function (e) {
          //lost focus
          e.cancelBubble = true;
          e.returnValue = false;
          e.stopPropagation();
          e.preventDefault();

          var push = true;
          if (tagManagerOptions.typeahead) {
            var ao = jQuery(".typeahead:visible");
            if (ao[0] != undefined) {
              // console.log('blur: typeaheadIsVisible is visible');
              push = false;
            } else {
              // console.log('blur: typeaheadIsVisible is NOT visible');
              push = true;
            }
          }

          if (push) {
            // console.log('lost focus');
            var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
            user_input = trimTag(user_input);
            pushTag(user_input, null, tagIsValid);
            // console.log("pushTag: blur");
          }

          return false;
        });
      }

      if (tagManagerOptions.prefilled != null) {
        if (typeof (tagManagerOptions.prefilled) == "object") {
          var pta = tagManagerOptions.prefilled;
          jQuery.each(pta, function (key, val) {
            var a = 1;
            pushTag(val, obj, true);
          });
        } else if (typeof (tagManagerOptions.prefilled) == "string") {
          var pta = tagManagerOptions.prefilled.split(',');

          jQuery.each(pta, function (key, val) {
            var a = 1;
            pushTag(val, obj, true);
          });

        }
      }
    });

  }
})(jQuery);
