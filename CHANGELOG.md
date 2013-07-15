## Next Release

* Your change here

## 2.4.2

* Issue #132: Escape tags for display instead of emitting it as raw HTML (chkwok)
* Issue #125: Fixed AjaxPushAllTags (henryoswald)
* Issue #125: Fix typeaheadSource check if object or function in pushTag (zkwentz)
* Issue #127: Replace array.indexOf with $.inArray to support IE8 (Leonidaz)
* Issue #126: Fix for onlyTagList true when pushing tag (zkwentz)
* Issue #118: Fix problem with onlyTagList when using typeaheadAjaxSource (stalinb87)
* Issue #110: re-add onlyTagList feature which was accidentally deleted (johnnyshields)
* Wrap jQuery in a no-conflict wrapper; use `$` instead of `jQuery` consistently (johnnyshields)
* Issue #94: 'pushTag' method does not call validator if configured (johnnyshields)

## 2.4.1

* Feature: Added API parameter 'AjaxPushParameters', which enables a custom payload on AJAX push requests (kingofthejungle)
* Feature: Added support for 'prefilled' parameter as a function (cliffordwhansen)
* Feature: Added API parameter 'typeaheadAjaxMethod' as "GET" or "POST" (default "POST") for retrieving typeahead values via AJAX (santoshs)
* Feature: Auto-detect whether delimiters codes should be handled as keys or chars, and use appropriate event callback, i.e. keydown for keys, keypress for chars (johnnyshields)
* Feature: Use the first ASCII (non-key) delimiter code as the base delimiter for string storage (johnnyshields)
* Refactor: Move event initializer for AjaxPushAllTags into same place as other event initializers, and removed isInitialized variable (johnnyshields)
* Refactor: Cleanup trimTag() method and apply it consistently to pushTag() (johnnyshields)
* Fix: Correct typo of delimeters -> delimiters in Typrescript definition (johnnyshields)
* Fix: Clean whitespace around tags when calling pushTag() (quocvu)
* Fix: Version 2.4.0 was erronously requiring that the tag input have class attribute specified (johnnyshields)
* Fix: jQuery.browser method is no longer supported as of jQuery 1.9, so using native JS method (johnnyshields)
* Deprecations: Mark parameters preventSubmitOnEnter, isClearInputOnEsc, deleteTagsOnBackspace as deprecated, as they will be hardcoded to their default values in v3.0 (johnnyshields)

## 2.4.0

* Feature: Use Bootstrap semantic colors in LESS and CSS (johnnyshields)
* Feature: Added auto-prefill from hidden field if a hiddenTagListId option is set (johnnyshields)
* Feature: Interpolate tag class from the input control class (johnnyshields)
* Feature: API parameter 'typeaheadDelegate' should always pass-through to the Bootstrap typehead instance (johnnyshields)
* Feature: (#53) Add new API parameter 'AjaxPushAllTags', which enables a mode to sync the entire tag state via AJAX (rather than incrementally) each time a tag is added/deleted. (sumegizoltan)
* Feature: Add new API parameter 'onlyTagList' which constrains the input to only options within the typeaheadSource (rishijain)
* Feature: Add Typescript definitition (sumegizoltan)
* Fix: TM initialization before the DOM tree (kenshin)
* Fix: Correct spelling API parameter delimeter -> delimiter. Old spelling still works (johnnyshields)
* Fix: Prevent double-initialization of TagManager (johnnyshields)
* Fix: (#11) Fix selection from Typeahead list in Firefox (sumegizoltan)
* Fix: (#51) Fix name selector by adding quotes (sumegizoltan)
* Fix: (#49, #50) Fix typeahead overrides when typeahead is not used (sumegizoltan)
* Admin: Added docs.html and docs.css which are pulled by welldonethings.com every 5 minutes (max-favilli)
* Admin: Add package.json (max-favilli)
* Admin: Add CHANGELOG.md (johnnyshields)
* Sync: Regenerate CSS from LESS

## 2.3.0 and prior

Refer to GitHub commit history: https://github.com/max-favilli/tagmanager/commits/master
