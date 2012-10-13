/*


*/
"use strict";

(function ($) {
   var SourceArray = ["Lombardia", "Abruzzo", "Toscana", "Liguria"];
   var SourceAjaxArray = new Array();

   var delimeters = new Array();
   var backspace = new Array();
   var inputObj = null;
   var tagList = new Array();
   var tagLiID = new Array();
   var lastTagId = 0;
   var hiddenTagList = null;

   var tagManagerOptions = null;

   var queuedTag = "";

   if (typeof console === "undefined" || typeof console.log === "undefined") {
      console = {};
      console.log = function () { };
   }

   inputObj = this;

   $.fn.trimTag = function (tag) {
      var txt = $.trim(tag);

      var l = txt.length;
      var t = 0;

      //          console.log(
      //                "tag to trim : " + txt
      //              );
      //remove from end
      for (var i = l - 1; i >= 0; i--) {
         //            console.log(
         //                "char to evaluate : " + txt[i] + " (" + txt.charCodeAt(i) + ")"
         //              );
         if (-1 != $.inArray(txt.charCodeAt(i), delimeters)) {
            //              console.log(
            //                "char to remove from end: " + txt[i]
            //              );
            t++;
         } else
            break;
      }
      txt = txt.substring(0, l - t);
      l = txt.length;
      t = 0;
      //remove from head
      for (var i = 0; i < l; i++) {
         //            console.log(
         //                "char to evaluate : " + txt[i] + " (" + txt.charCodeAt(i) + ")"
         //              );
         if (-1 != $.inArray(txt.charCodeAt(i), delimeters)) {
            //              console.log(
            //                "char to remove from head: " + txt[i]
            //              );
            t++;
         } else
            break;
      }

      txt = txt.substring(t, l);
      //          console.log(
      //                "trimmed to : " + txt
      //              );

      return txt;
   };

   $.fn.setupTypeahead = function (tag) {
      var obj = $(this);

      if(!obj.typeahead)
         return;

      if (tagManagerOptions.typeaheadSource != null) {
         obj.typeahead();
         obj.data('active', true);
         obj.data('typeahead').source = tagManagerOptions.typeaheadSource;
         obj.data('active', false);
      } else if (tagManagerOptions.typeaheadAjaxSource != null) {
         obj.typeahead();
         $.getJSON(tagManagerOptions.typeaheadAjaxSource, function (data) {
            if (data != undefined && data.tags != undefined) {
               SourceAjaxArray.length = 0;
               $.each(data.tags, function (key, val) {
                  var a = 1;
                  //$('#addexpenses select[name="who"]').append('<option value="' + val.who + '">' + val.name + '</option>');
                  SourceAjaxArray.push(val.tag);
                  //obj.attr("data-sources", SourceArray);
                  obj.data('active', true);
                  obj.data('typeahead').source = SourceAjaxArray;
                  obj.data('active', false);
                  //obj.attr("data-sources", SourceAjaxArray.join(", "));
               });
            }
         });
      }
   };

   $.fn.refreshHiddenTagList = function (robj) {
      var obj;
      if (robj == null)
         obj = $(this);
      else
         obj = robj;

      var tlis = obj.data("tlis");
      var lhiddenTagList = obj.data("lhiddenTagList");
      
      if(lhiddenTagList == undefined)
         return;

      $(lhiddenTagList).val(tlis.join(","));
   };

   $.fn.spliceTag = function (TagId,robj) {
      var obj;
      if (robj == null)
         return;
      else
         obj = robj;
      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      console.log(
              "TagIdToRemove: " + TagId
            );
      var p = $.inArray(TagId, tlid)
      console.log(
              "position: " + p
            );
      if (-1 != p) {
         $("#myTag_" + TagId).remove();
         tlis.splice(p, 1);
         tlid.splice(p, 1);
         obj.refreshHiddenTagList(obj);
         console.log(tlis);
      }

      if ( tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags ) {
         obj.show();
      }
   };

   $.fn.popTag = function (robj) {
      var obj;
      if (robj == null)
         obj = $(this);
      else
         obj = robj;

      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      if (tlid.length > 0) {
         var TagId = tlid.pop();
         tlis.pop();
         console.log(
              "TagIdToRemove: " + TagId
            );
         $("#myTag_" + TagId).remove();
         $(obj).refreshHiddenTagList();
         console.log(tlis);
      }
   };

   $.fn.pushTag = function (tag, robj) {
      if (!tag || tag.length <= 0) {
         return;
      }
      if (tagManagerOptions.CapitalizeFirstLetter && tag.length > 1) {
         tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      }

      // call the validator (if any) and do not let the tag pass if invalid
      if (tagManagerOptions.validator !== undefined) {
        if ( tagManagerOptions.validator(tag) !== true ) return;
      }

      var obj;
      if (robj == null)
         obj = $(this);
      else
         obj = robj;

      var tlis = obj.data("tlis");
      var tlid = obj.data("tlid");

      // dont accept new tags beyond the defined maximum
      if ( tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) return;

      var alreadyInList = false;
      var p = $.inArray(tag, tlis);
      if (-1 != p) {
         console.log(
                "tag:" + tag + " !!already in list!!"
              );
         alreadyInList = true;
      }

      if (alreadyInList) {
         var pTagId = tlid[p];
         $("#myTag_" + pTagId).stop().animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100).animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100).animate({ backgroundColor: tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor: tagManagerOptions.blinkBGColor_2 }, 100);
      } else {
         var TagId = lastTagId++;
         tlis.push(tag);
         tlid.push(TagId);

         var html = '';
         html += '<span class="myTag" id="myTag_' + TagId + '"><span>' + tag + '&nbsp;&nbsp;</span><a href="#" class="myTagRemover" id="myRemover_' + TagId + '" TagIdToRemove="' + TagId + '" title="Removing tag">x</a></span>';
         console.log(
              "tagList: " + tlis
            );
         obj.before(html);
         $("#myRemover_" + TagId).on("click", obj, function (e) {
         e.preventDefault();
            var TagIdToRemove = parseInt($(this).attr("TagIdToRemove"));

            e.data.spliceTag(TagIdToRemove,e.data);
//            var TagIdToRemove = parseInt($(this).attr("TagIdToRemove"));
//            $(this).spliceTag(parseInt($(this).attr("TagIdToRemove")));
         });

         obj.refreshHiddenTagList(obj);

         if ( tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags ) {
            obj.hide();
         }

      }
      obj.val("");

   };

   $.fn.tagsManager = function (options) {
      tagManagerOptions = {
         prefilled: null,
         CapitalizeFirstLetter: true,
         preventSubmitOnEnter: true,
         typeahead: false,
         typeaheadAjaxSource: null,
         typeaheadSource: null,
         delimeters: [44, 188, 13],
         backspace: [8],
         maxTags: 0,
         hiddenTagListName: ''
      };

      $.extend(tagManagerOptions, options);

      if(tagManagerOptions.hiddenTagListName === ''){
         tagManagerOptions.hiddenTagListName = "hidden-"+this.attr('name');
      }

      return this.each(function() {
         var obj = $(this);

         //let's store some instance specific data directly into the DOM object
         var tlis = new Array();
         var tlid = new Array();
         obj.data("tlis", tlis); //list of string tags
         obj.data("tlid", tlid); //list of ID of the string tags

         var html = "";
         html += "<input name='" + tagManagerOptions.hiddenTagListName + "' type='hidden' value=''/>";
         obj.after(html);
         obj.data("lhiddenTagList", 
            obj.siblings("input[name='" + tagManagerOptions.hiddenTagListName + "']")[0]
         );

         delimeters = tagManagerOptions.delimeters;
         backspace = tagManagerOptions.backspace;

         if (lastTagId > 0) {
            while (lastTagId > 0) {
               obj.popTag(obj);
               lastTagId--;
            }
         }

         if (tagManagerOptions.typeahead) {
            obj.setupTypeahead();
            //obj.typeahead({ source: SourceArray })
         }

         // disable submit on enter for this input field
         obj.on("focus", function (e) {
            if ($(this).popover) {
               $(this).popover("hide");
               //$(this).popover = null;
            }
         });

         obj.on("keypress", function (e) {
            if ($(this).popover) {
               $(this).popover("hide");
               //$(this).popover = null;
            }
            if (tagManagerOptions.preventSubmitOnEnter) {
               if (e.which == 13) {
                  e.cancelBubble = true;
                  e.returnValue = false;
                  e.stopPropagation();
                  e.preventDefault();
                  //e.keyCode = 9;
               }
            }
            console.log(
                     "keyup: " + e.keyCode
                   );
         });

         obj.on("keyup", obj, function (e) {
            if(e.which == 9){
               var ao = $(".typeahead:visible");
               if (ao[0] != undefined) {
                  console.log('pressed tab with typeaheadIsVisible is visible');
               } else {
                  console.log('pressed tab with typeaheadIsVisible is NOT visible');
               }
            }
            var p = $.inArray(e.which, delimeters);
            if (-1 != p) {
               //user just entered a valid delimeter
               var user_input = $(this).val(); //user_input = $().inArray(delimeters[p]);
               user_input = $(this).trimTag(user_input);
               e.data.pushTag(user_input,e.data);
               console.log(
                        "pushTag: keyup "
                      );
            }
   //         console.log(
   //                  "keyup: " + e.which
   //                );
         });

         obj.on("keydown", obj, function (e) {
            var p = $.inArray(e.which, backspace);
            if (-1 != p) {
               //user just entered backspace or equivalent
               var user_input = $(this).val(); //user_input = $().inArray(delimeters[p]);
               var i = user_input.length;
               if (i <= 0) {
                  console.log(
                     "backspace detected"
                   );
                  e.data.popTag();
               }
            }
         });

         obj.change(function (e) {
            e.cancelBubble = true;
            e.returnValue = false;
            e.stopPropagation();
            e.preventDefault();

            var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
            var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
            var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
            var is_safari = navigator.userAgent.indexOf("Safari") > -1;
            
            if(!is_chrome && !is_safari )
               $(this).focus();

            console.log('Handler for .change() called, value selected:' + obj.val());
            var ao = $(".typeahead:visible");
            if (ao[0] != undefined){
               console.log('change: typeaheadIsVisible is visible');
               //when the user click with the mouse on the typeahead li element we get the change event fired twice, once when the input field loose focus and later with the input field value is replaced with li value
               var user_input = $(".typeahead .active").attr("data-value"); 
               user_input = $(this).trimTag(user_input);
               if( queuedTag == obj.val() && queuedTag == user_input ){
                  queuedTag = "";
                  obj.val(queuedTag);
               }else{
                  $(this).pushTag(user_input);
                  queuedTag = user_input;
                  console.log('Handler for .change() called, typeahead value pushed:' + queuedTag);
               }
            } else {
               console.log('change: typeaheadIsVisible is NOT visible');
               var user_input = $(this).val(); //user_input = $().inArray(delimeters[p]);
               user_input = $(this).trimTag(user_input);
               $(this).pushTag(user_input);
               console.log(
                        "pushTag: change "
                      );
            }

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
                  var ao = $(".typeahead:visible");
                  if (ao[0] != undefined) {
                     console.log('blur: typeaheadIsVisible is visible');
                     push = false;
                  } else {
                     console.log('blur: typeaheadIsVisible is NOT visible');
                     push = true;
                  }
               }

               if (push) {
                  console.log('lost focus');
                  var user_input = $(this).val(); //user_input = $().inArray(delimeters[p]);
                  user_input = $(this).trimTag(user_input);
                  $(this).pushTag(user_input);
                  console.log(
                           "pushTag: blur"
                         );
               }
            });
         }

         if (tagManagerOptions.prefilled != null) {
            if (typeof (tagManagerOptions.prefilled) == "object") {
               var pta = tagManagerOptions.prefilled;
               $.each(pta, function (key, val) {
                  var a = 1;
                  obj.pushTag(val, obj);
               });
            } else if (typeof (tagManagerOptions.prefilled) == "string") {
               var pta = tagManagerOptions.prefilled.split(',');

               $.each(pta, function (key, val) {
                  var a = 1;
                  obj.pushTag(val, obj);
               });

            }
         }
      });

   }
})(jQuery);